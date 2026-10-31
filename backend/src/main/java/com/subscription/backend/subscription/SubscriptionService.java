package com.subscription.backend.subscription;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.customer.Customer;
import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.customer.CustomerService;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import com.subscription.backend.invoice.InvoiceService;
import com.subscription.backend.plan.LifecycleRule;
import com.subscription.backend.plan.Plan;
import com.subscription.backend.plan.PlanRepository;
import com.subscription.backend.plan.PlanService;
import com.subscription.backend.product.Product;
import com.subscription.backend.product.ProductRepository;
import com.subscription.backend.product.ProductVariant;
import com.subscription.backend.product.ProductVariantRepository;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final CustomerRepository customerRepository;
    private final PlanRepository planRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PlanService planService;
    private final AuthService authService;
    private final CustomerService customerService;
    private final InvoiceService invoiceService;

    @Transactional
    public SubscriptionDto.SubscriptionResponse createSubscription(SubscriptionDto.SubscriptionRequest request) {

        customerService.enforceCustomerAccess(request.getCustomerId());

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + request.getPlanId()));

        // Validate Product-Plan compatibility
        planService.validateProductPlanCompatibility(product.getId(), plan.getId());

        // Validate quantity against plan minimum quantity
        if (request.getQuantity() < plan.getMinimumQuantity()) {
            throw new BusinessRuleException("Quantity (" + request.getQuantity() +
                    ") is less than the plan's minimum required quantity (" + plan.getMinimumQuantity() + ")");
        }

        // Validate dates
        if (request.getExpiryDate() != null && request.getExpiryDate().isBefore(request.getStartDate())) {
            throw new BusinessRuleException("Expiry date cannot be before start date");
        }

        // Validate optional variant
        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + request.getVariantId()));
            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new BusinessRuleException("Variant id " + request.getVariantId() + " does not belong to product " + product.getId());
            }
            if (!variant.isActive()) {
                throw new BusinessRuleException("Variant " + variant.getName() + " is not currently active");
            }
        }

        // Price calculation: locked agreed unit price
        BigDecimal unitPrice = request.getAgreedUnitPrice();
        if (unitPrice == null) {
            BigDecimal variantAdj = (variant != null && variant.getPriceAdjustment() != null)
                    ? variant.getPriceAdjustment() : BigDecimal.ZERO;
            BigDecimal planPrice = (plan.getPrice() != null) ? plan.getPrice() : BigDecimal.ZERO;
            unitPrice = product.getSalesPrice().add(variantAdj).add(planPrice);
        }

        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));

        SubscriptionStatus status = request.getInitialStatus() != null
                ? request.getInitialStatus()
                : SubscriptionStatus.DRAFT;

        String subNumber = generateSubscriptionNumber();

        Subscription subscription = Subscription.builder()
                .subscriptionNumber(subNumber)
                .customer(customer)
                .plan(plan)
                .product(product)
                .variant(variant)
                .quantity(request.getQuantity())
                .startDate(request.getStartDate())
                .expiryDate(request.getExpiryDate())
                .nextBillingDate(request.getStartDate())
                .agreedUnitPrice(unitPrice)
                .subtotal(subtotal)
                .status(status)
                .build();

        Subscription saved = subscriptionRepository.save(subscription);
        return toSubscriptionResponse(saved);
    }

    @Transactional
    public SubscriptionDto.SubscriptionResponse purchaseSubscription(SubscriptionDto.CustomerPurchaseRequest request) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser == null || currentUser.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Access denied: Only CUSTOMER users can purchase subscriptions through the catalog");
        }

        Long customerId = currentUser.getCustomerId();
        if (customerId == null) {
            throw new AccessDeniedException("Access denied: Authenticated customer profile not found");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!product.isActive()) {
            throw new BusinessRuleException("Product " + product.getName() + " is currently inactive");
        }

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + request.getPlanId()));

        // Validate Product-Plan compatibility, plan active status, and availability window
        planService.validateProductPlanCompatibility(product.getId(), plan.getId());

        // Validate quantity against plan minimum quantity
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new BusinessRuleException("Quantity must be at least 1");
        }
        if (request.getQuantity() < plan.getMinimumQuantity()) {
            throw new BusinessRuleException("Quantity (" + request.getQuantity() +
                    ") is less than the plan's minimum required quantity (" + plan.getMinimumQuantity() + ")");
        }

        // Validate optional variant
        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + request.getVariantId()));
            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new BusinessRuleException("Variant id " + request.getVariantId() + " does not belong to product " + product.getId());
            }
            if (!variant.isActive()) {
                throw new BusinessRuleException("Variant " + variant.getName() + " is not currently active");
            }
        }

        // Price calculation: strictly computed from backend catalog values
        BigDecimal basePrice = (product.getSalesPrice() != null) ? product.getSalesPrice() : BigDecimal.ZERO;
        BigDecimal variantAdj = (variant != null && variant.getPriceAdjustment() != null)
                ? variant.getPriceAdjustment() : BigDecimal.ZERO;
        BigDecimal planPrice = (plan.getPrice() != null) ? plan.getPrice() : BigDecimal.ZERO;
        BigDecimal unitPrice = basePrice.add(variantAdj).add(planPrice);
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(request.getQuantity()));

        LocalDate today = LocalDate.now();
        String subNumber = generateSubscriptionNumber();

        // Customer purchases start in CONFIRMED state awaiting payment/billing
        Subscription subscription = Subscription.builder()
                .subscriptionNumber(subNumber)
                .customer(customer)
                .plan(plan)
                .product(product)
                .variant(variant)
                .quantity(request.getQuantity())
                .startDate(today)
                .expiryDate(null)
                .nextBillingDate(today)
                .agreedUnitPrice(unitPrice)
                .subtotal(subtotal)
                .status(SubscriptionStatus.CONFIRMED)
                .build();

        Subscription saved = subscriptionRepository.save(subscription);

        // Automatically generate initial invoice for the confirmed subscription
        invoiceService.createInvoiceForPeriod(saved, today);

        return toSubscriptionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDto.SubscriptionResponse> getSubscriptions(Long customerId, SubscriptionStatus status) {
        UserPrincipal currentUser = authService.getCurrentUser();
        Long effectiveCustomerId = customerId;

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            effectiveCustomerId = currentUser.getCustomerId();
        }

        List<Subscription> subscriptions;
        if (effectiveCustomerId != null && status != null) {
            subscriptions = subscriptionRepository.findByCustomerIdAndStatus(effectiveCustomerId, status);
        } else if (effectiveCustomerId != null) {
            subscriptions = subscriptionRepository.findByCustomerId(effectiveCustomerId);
        } else if (status != null) {
            subscriptions = subscriptionRepository.findByStatus(status);
        } else {
            subscriptions = subscriptionRepository.findAll();
        }

        return subscriptions.stream().map(this::toSubscriptionResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubscriptionDto.SubscriptionResponse getSubscriptionById(Long id) {
        Subscription subscription = findSubscriptionEntityById(id);
        enforceSubscriptionOwnership(subscription);
        return toSubscriptionResponse(subscription);
    }

    @Transactional(readOnly = true)
    public Subscription findSubscriptionEntityById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));
    }

    // Lifecycle transitions
    @Transactional
    public SubscriptionDto.SubscriptionResponse confirmSubscription(Long id) {
        Subscription sub = findSubscriptionEntityById(id);
        enforceSubscriptionOwnership(sub);

        if (sub.getStatus() != SubscriptionStatus.DRAFT && sub.getStatus() != SubscriptionStatus.QUOTATION) {
            throw new BusinessRuleException("Cannot confirm subscription in " + sub.getStatus() + " state. Must be DRAFT or QUOTATION.");
        }

        sub.setStatus(SubscriptionStatus.CONFIRMED);
        return toSubscriptionResponse(subscriptionRepository.save(sub));
    }

    @Transactional
    public SubscriptionDto.SubscriptionResponse activateSubscription(Long id) {
        Subscription sub = findSubscriptionEntityById(id);
        enforceSubscriptionOwnership(sub);

        if (sub.getStatus() != SubscriptionStatus.CONFIRMED && sub.getStatus() != SubscriptionStatus.DRAFT) {
            throw new BusinessRuleException("Cannot activate subscription in " + sub.getStatus() + " state. Must be CONFIRMED or DRAFT.");
        }

        sub.setStatus(SubscriptionStatus.ACTIVE);
        return toSubscriptionResponse(subscriptionRepository.save(sub));
    }

    @Transactional
    public SubscriptionDto.SubscriptionResponse pauseSubscription(Long id) {
        Subscription sub = findSubscriptionEntityById(id);
        enforceSubscriptionOwnership(sub);

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot pause subscription in " + sub.getStatus() + " state. Only ACTIVE subscriptions can be paused.");
        }

        sub.setStatus(SubscriptionStatus.PAUSED);
        sub.setPausedAt(LocalDate.now());

        return toSubscriptionResponse(subscriptionRepository.save(sub));
    }

    @Transactional
    public SubscriptionDto.SubscriptionResponse resumeSubscription(Long id) {
        Subscription sub = findSubscriptionEntityById(id);
        enforceSubscriptionOwnership(sub);

        if (sub.getStatus() != SubscriptionStatus.PAUSED) {
            throw new BusinessRuleException("Cannot resume subscription in " + sub.getStatus() + " state. Only PAUSED subscriptions can be resumed.");
        }

        // Calculate paused duration and shift next billing date
        LocalDate pauseStart = sub.getPausedAt() != null ? sub.getPausedAt() : LocalDate.now();
        long pausedDays = ChronoUnit.DAYS.between(pauseStart, LocalDate.now());
        if (pausedDays <= 0) {
            pausedDays = 1; // Minimum 1 day shift if resumed within same day
        }

        sub.setNextBillingDate(sub.getNextBillingDate().plusDays(pausedDays));
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);

        return toSubscriptionResponse(subscriptionRepository.save(sub));
    }

    @Transactional
    public SubscriptionDto.SubscriptionResponse closeSubscription(Long id) {
        Subscription sub = findSubscriptionEntityById(id);
        enforceSubscriptionOwnership(sub);

        if (sub.getStatus() == SubscriptionStatus.CLOSED) {
            throw new BusinessRuleException("Subscription is already CLOSED.");
        }

        sub.setStatus(SubscriptionStatus.CLOSED);
        return toSubscriptionResponse(subscriptionRepository.save(sub));
    }

    private void enforceSubscriptionOwnership(Subscription subscription) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Long customerId = currentUser.getCustomerId();
            if (customerId == null || !customerId.equals(subscription.getCustomer().getId())) {
                throw new AccessDeniedException("Access denied: You do not own this subscription");
            }
        }
    }

    private String generateSubscriptionNumber() {
        return "SUB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public SubscriptionDto.SubscriptionResponse toSubscriptionResponse(Subscription sub) {
        return SubscriptionDto.SubscriptionResponse.builder()
                .id(sub.getId())
                .subscriptionNumber(sub.getSubscriptionNumber())
                .customerId(sub.getCustomer().getId())
                .customerName(sub.getCustomer().getName())
                .planId(sub.getPlan().getId())
                .planName(sub.getPlan().getName())
                .productId(sub.getProduct().getId())
                .productName(sub.getProduct().getName())
                .variantId(sub.getVariant() != null ? sub.getVariant().getId() : null)
                .variantName(sub.getVariant() != null ? sub.getVariant().getName() : null)
                .quantity(sub.getQuantity())
                .startDate(sub.getStartDate())
                .expiryDate(sub.getExpiryDate())
                .nextBillingDate(sub.getNextBillingDate())
                .agreedUnitPrice(sub.getAgreedUnitPrice())
                .subtotal(sub.getSubtotal())
                .status(sub.getStatus())
                .pausedAt(sub.getPausedAt())
                .createdAt(sub.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDto.RenewalAlertResponse> getUpcomingRenewalAlerts(int daysAhead, Long customerId, LocalDate asOfDate) {
        UserPrincipal currentUser = authService.getCurrentUser();
        Long effectiveCustomerId = customerId;
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            effectiveCustomerId = currentUser.getCustomerId();
        }

        LocalDate today = (asOfDate != null) ? asOfDate : LocalDate.now();
        int validDays = (daysAhead > 0) ? daysAhead : 7;
        LocalDate endDate = today.plusDays(validDays);

        List<SubscriptionStatus> excludedStatuses = List.of(
                SubscriptionStatus.CLOSED,
                SubscriptionStatus.DRAFT,
                SubscriptionStatus.QUOTATION
        );

        List<Subscription> subscriptions;
        if (effectiveCustomerId != null) {
            subscriptions = subscriptionRepository.findUpcomingRenewalAlertsByCustomerId(
                    effectiveCustomerId, excludedStatuses, today, endDate);
        } else {
            subscriptions = subscriptionRepository.findUpcomingRenewalAlerts(
                    excludedStatuses, today, endDate);
        }

        List<SubscriptionDto.RenewalAlertResponse> alerts = new ArrayList<>();
        for (Subscription sub : subscriptions) {
            LocalDate relevantDate = sub.getNextBillingDate();
            String dateType = "NEXT_BILLING_DATE";

            if (sub.getExpiryDate() != null
                    && !sub.getExpiryDate().isBefore(today)
                    && !sub.getExpiryDate().isAfter(endDate)) {
                if (relevantDate == null || !sub.getExpiryDate().isAfter(relevantDate)) {
                    relevantDate = sub.getExpiryDate();
                    dateType = "EXPIRATION_DATE";
                }
            }

            if (relevantDate == null || relevantDate.isBefore(today) || relevantDate.isAfter(endDate)) {
                continue;
            }

            long daysRemaining = ChronoUnit.DAYS.between(today, relevantDate);

            LifecycleRule lifecycle = (sub.getPlan() != null && sub.getPlan().getLifecycleRule() != null)
                    ? sub.getPlan().getLifecycleRule()
                    : LifecycleRule.AUTO_RENEW;
            boolean autoRenew = (lifecycle == LifecycleRule.AUTO_RENEW && sub.getStatus() != SubscriptionStatus.PAUSED);

            boolean actionRequired = false;
            String alertMessage;

            if (sub.getStatus() == SubscriptionStatus.PAUSED) {
                actionRequired = true;
                alertMessage = "Subscription paused: Billing deferred until unpaused.";
            } else if ("EXPIRATION_DATE".equals(dateType)) {
                if (lifecycle == LifecycleRule.AUTO_CLOSE) {
                    actionRequired = true;
                    alertMessage = daysRemaining == 0
                            ? "Expires today: Will automatically close."
                            : "Expires in " + daysRemaining + " day(s): Will automatically close.";
                } else if (lifecycle == LifecycleRule.MANUAL_RENEWAL) {
                    actionRequired = true;
                    alertMessage = daysRemaining == 0
                            ? "Expires today: Manual renewal required."
                            : "Expires in " + daysRemaining + " day(s): Manual renewal required.";
                } else {
                    alertMessage = "Term expiration approaching in " + daysRemaining + " day(s).";
                }
            } else {
                if (lifecycle == LifecycleRule.AUTO_RENEW) {
                    alertMessage = daysRemaining == 0
                            ? "Renewing today: Scheduled for automatic charge."
                            : "Renewing in " + daysRemaining + " day(s): Scheduled for automatic charge.";
                } else if (lifecycle == LifecycleRule.MANUAL_RENEWAL) {
                    actionRequired = true;
                    alertMessage = daysRemaining == 0
                            ? "Due today: Manual renewal required to avoid suspension."
                            : "Due in " + daysRemaining + " day(s): Manual renewal required.";
                } else {
                    actionRequired = true;
                    alertMessage = daysRemaining == 0
                            ? "Due today: Will auto-close after billing."
                            : "Due in " + daysRemaining + " day(s): Will auto-close after billing.";
                }
            }

            String alertLevel;
            if (daysRemaining <= 2 || sub.getStatus() == SubscriptionStatus.PAUSED) {
                alertLevel = "URGENT";
            } else if (daysRemaining <= 5) {
                alertLevel = "WARNING";
            } else {
                alertLevel = "INFO";
            }

            alerts.add(SubscriptionDto.RenewalAlertResponse.builder()
                    .subscriptionId(sub.getId())
                    .subscriptionNumber(sub.getSubscriptionNumber())
                    .customerId(sub.getCustomer() != null ? sub.getCustomer().getId() : null)
                    .customerName(sub.getCustomer() != null ? sub.getCustomer().getName() : "Unknown Customer")
                    .customerEmail(sub.getCustomer() != null ? sub.getCustomer().getEmail() : null)
                    .productId(sub.getProduct() != null ? sub.getProduct().getId() : null)
                    .productName(sub.getProduct() != null ? sub.getProduct().getName() : "Subscription Service")
                    .planId(sub.getPlan() != null ? sub.getPlan().getId() : null)
                    .planName(sub.getPlan() != null ? sub.getPlan().getName() : "Plan")
                    .billingInterval(sub.getPlan() != null && sub.getPlan().getBillingInterval() != null
                            ? sub.getPlan().getBillingInterval().name() : "MONTHLY")
                    .lifecycleRule(lifecycle.name())
                    .status(sub.getStatus())
                    .relevantDate(relevantDate)
                    .dateType(dateType)
                    .daysRemaining(daysRemaining)
                    .amount(sub.getSubtotal() != null ? sub.getSubtotal() : BigDecimal.ZERO)
                    .autoRenew(autoRenew)
                    .actionRequired(actionRequired)
                    .alertLevel(alertLevel)
                    .alertMessage(alertMessage)
                    .build());
        }

        alerts.sort(Comparator.comparingLong(SubscriptionDto.RenewalAlertResponse::getDaysRemaining));
        return alerts;
    }
}
