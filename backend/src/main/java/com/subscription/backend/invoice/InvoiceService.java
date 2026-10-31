package com.subscription.backend.invoice;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import com.subscription.backend.plan.BillingInterval;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import com.subscription.backend.subscription.Subscription;
import com.subscription.backend.subscription.SubscriptionRepository;
import com.subscription.backend.subscription.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AuthService authService;

    @Transactional
    public InvoiceDto.InvoiceResponse generateInvoiceForSubscription(Long subscriptionId, LocalDate targetDate) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + subscriptionId));

        enforceSubscriptionAccess(subscription);

        if (subscription.getStatus() == SubscriptionStatus.PAUSED) {
            throw new BusinessRuleException("Cannot generate invoices for PAUSED subscriptions. Resume subscription to proceed.");
        }

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE && subscription.getStatus() != SubscriptionStatus.CONFIRMED) {
            throw new BusinessRuleException("Cannot generate invoice for subscription in " + subscription.getStatus() + " state. Must be ACTIVE or CONFIRMED.");
        }

        LocalDate billingStart = targetDate != null ? targetDate : subscription.getNextBillingDate();
        Invoice invoice = createInvoiceForPeriod(subscription, billingStart);
        return toInvoiceResponse(invoice);
    }

    @Transactional
    public List<InvoiceDto.InvoiceResponse> generateDueInvoices(LocalDate asOfDate) {
        LocalDate effectiveDate = (asOfDate != null) ? asOfDate : LocalDate.now();

        List<Subscription> dueSubscriptions = subscriptionRepository.findByStatusAndNextBillingDateLessThanEqual(
                SubscriptionStatus.ACTIVE, effectiveDate);

        List<InvoiceDto.InvoiceResponse> generated = new ArrayList<>();
        for (Subscription sub : dueSubscriptions) {
            try {
                Invoice inv = createInvoiceForPeriod(sub, sub.getNextBillingDate());
                generated.add(toInvoiceResponse(inv));
            } catch (BusinessRuleException ex) {
                // Skip if duplicate exists or already generated for period
            }
        }

        return generated;
    }

    @Transactional
    public Invoice createInvoiceForPeriod(Subscription subscription, LocalDate periodStart) {
        BillingInterval interval = subscription.getPlan().getBillingInterval();
        LocalDate periodEnd = calculatePeriodEnd(periodStart, interval);
        String periodStr = periodStart + " to " + periodEnd;

        // Duplicate prevention safeguard
        if (invoiceRepository.existsBySubscriptionIdAndBillingPeriod(subscription.getId(), periodStr)) {
            throw new BusinessRuleException("Duplicate invoice: An invoice already exists for Subscription "
                    + subscription.getSubscriptionNumber() + " and billing period " + periodStr);
        }

        BigDecimal unitPrice = subscription.getAgreedUnitPrice();
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(subscription.getQuantity()));

        String description = subscription.getProduct().getName();
        if (subscription.getVariant() != null) {
            description += " (" + subscription.getVariant().getName() + ")";
        }
        description += " - " + subscription.getPlan().getName() + " (" + interval + ")";

        InvoiceLine line = InvoiceLine.builder()
                .description(description)
                .quantity(subscription.getQuantity())
                .unitPrice(unitPrice)
                .discountAmount(BigDecimal.ZERO)
                .taxRate(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .lineTotal(lineTotal)
                .build();

        String invoiceNumber = generateInvoiceNumber();
        LocalDate issueDate = LocalDate.now();
        LocalDate dueDate = issueDate.plusDays(15);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .subscription(subscription)
                .customer(subscription.getCustomer())
                .billingPeriod(periodStr)
                .billingPeriodStart(periodStart)
                .billingPeriodEnd(periodEnd)
                .issueDate(issueDate)
                .dueDate(dueDate)
                .subtotal(lineTotal)
                .discountAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .total(lineTotal)
                .amountPaid(BigDecimal.ZERO)
                .outstandingBalance(lineTotal)
                .status(InvoiceStatus.CONFIRMED)
                .build();

        invoice.addLine(line);

        Invoice saved = invoiceRepository.save(invoice);

        // Advance subscription's next billing date
        subscription.setNextBillingDate(periodEnd.plusDays(1));
        subscriptionRepository.save(subscription);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<InvoiceDto.InvoiceResponse> getInvoices(Long customerId, Long subscriptionId, InvoiceStatus status) {
        UserPrincipal currentUser = authService.getCurrentUser();
        Long effectiveCustomerId = customerId;

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            effectiveCustomerId = currentUser.getCustomerId();
        }

        List<Invoice> invoices;
        if (effectiveCustomerId != null && status != null) {
            invoices = invoiceRepository.findByCustomerIdAndStatus(effectiveCustomerId, status);
        } else if (effectiveCustomerId != null) {
            invoices = invoiceRepository.findByCustomerId(effectiveCustomerId);
        } else if (subscriptionId != null) {
            invoices = invoiceRepository.findBySubscriptionId(subscriptionId);
        } else if (status != null) {
            invoices = invoiceRepository.findByStatus(status);
        } else {
            invoices = invoiceRepository.findAll();
        }

        return invoices.stream().map(this::toInvoiceResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceDto.InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = findInvoiceEntityById(id);
        enforceInvoiceOwnership(invoice);
        return toInvoiceResponse(invoice);
    }

    @Transactional(readOnly = true)
    public Invoice findInvoiceEntityById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    @Transactional
    public InvoiceDto.InvoiceResponse confirmInvoice(Long id) {
        Invoice invoice = findInvoiceEntityById(id);
        enforceInvoiceOwnership(invoice);

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BusinessRuleException("Only DRAFT invoices can be confirmed");
        }

        invoice.setStatus(InvoiceStatus.CONFIRMED);
        return toInvoiceResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceDto.InvoiceResponse cancelInvoice(Long id) {
        Invoice invoice = findInvoiceEntityById(id);
        enforceInvoiceOwnership(invoice);

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessRuleException("Cannot cancel an invoice that has been fully paid");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        return toInvoiceResponse(invoiceRepository.save(invoice));
    }

    private LocalDate calculatePeriodEnd(LocalDate start, BillingInterval interval) {
        return switch (interval) {
            case DAILY -> start;
            case WEEKLY -> start.plusDays(6);
            case MONTHLY -> start.plusMonths(1).minusDays(1);
            case YEARLY -> start.plusYears(1).minusDays(1);
        };
    }

    private void enforceSubscriptionAccess(Subscription subscription) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Long customerId = currentUser.getCustomerId();
            if (customerId == null || !customerId.equals(subscription.getCustomer().getId())) {
                throw new AccessDeniedException("Access denied: You do not own this subscription");
            }
        }
    }

    private void enforceInvoiceOwnership(Invoice invoice) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Long customerId = currentUser.getCustomerId();
            if (customerId == null || !customerId.equals(invoice.getCustomer().getId())) {
                throw new AccessDeniedException("Access denied: You do not own this invoice");
            }
        }
    }

    private String generateInvoiceNumber() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public InvoiceDto.InvoiceResponse toInvoiceResponse(Invoice invoice) {
        List<InvoiceDto.InvoiceLineResponse> lineResponses = invoice.getInvoiceLines() != null
                ? invoice.getInvoiceLines().stream().map(line -> InvoiceDto.InvoiceLineResponse.builder()
                        .id(line.getId())
                        .description(line.getDescription())
                        .quantity(line.getQuantity())
                        .unitPrice(line.getUnitPrice())
                        .discountAmount(line.getDiscountAmount())
                        .taxRate(line.getTaxRate())
                        .taxAmount(line.getTaxAmount())
                        .lineTotal(line.getLineTotal())
                        .build()).collect(Collectors.toList())
                : Collections.emptyList();

        return InvoiceDto.InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .subscriptionId(invoice.getSubscription().getId())
                .subscriptionNumber(invoice.getSubscription().getSubscriptionNumber())
                .customerId(invoice.getCustomer().getId())
                .customerName(invoice.getCustomer().getName())
                .customerEmail(invoice.getCustomer().getEmail())
                .billingPeriod(invoice.getBillingPeriod())
                .billingPeriodStart(invoice.getBillingPeriodStart())
                .billingPeriodEnd(invoice.getBillingPeriodEnd())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .taxAmount(invoice.getTaxAmount())
                .total(invoice.getTotal())
                .amountPaid(invoice.getAmountPaid())
                .outstandingBalance(invoice.getOutstandingBalance())
                .status(invoice.getStatus())
                .lines(lineResponses)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
