package com.subscription.backend.payment;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import com.subscription.backend.invoice.Invoice;
import com.subscription.backend.invoice.InvoiceRepository;
import com.subscription.backend.invoice.InvoiceStatus;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuthService authService;

    @Transactional
    public PaymentDto.PaymentResponse recordPayment(PaymentDto.PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + request.getInvoiceId()));

        enforceInvoicePaymentAccess(invoice);

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot record payment for a CANCELLED invoice");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessRuleException("Invoice is already fully PAID");
        }

        BigDecimal paymentAmount = request.getAmount();

        // Overpayment rejection in MVP
        if (paymentAmount.compareTo(invoice.getOutstandingBalance()) > 0) {
            throw new BusinessRuleException("Overpayment rejected: Payment amount (" + paymentAmount
                    + ") exceeds the remaining outstanding balance (" + invoice.getOutstandingBalance() + ")");
        }

        LocalDate payDate = (request.getPaymentDate() != null) ? request.getPaymentDate() : LocalDate.now();
        String payNumber = generatePaymentNumber();

        Payment payment = Payment.builder()
                .paymentNumber(payNumber)
                .invoice(invoice)
                .amount(paymentAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentDate(payDate)
                .note(request.getNote())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice balance and status
        BigDecimal updatedAmountPaid = invoice.getAmountPaid().add(paymentAmount);
        BigDecimal remainingBalance = invoice.getTotal().subtract(updatedAmountPaid);

        invoice.setAmountPaid(updatedAmountPaid);
        invoice.setOutstandingBalance(remainingBalance);

        if (remainingBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);

        return toPaymentResponse(savedPayment, invoice.getStatus(), remainingBalance);
    }

    @Transactional(readOnly = true)
    public List<PaymentDto.PaymentResponse> getPayments(Long invoiceId, Long customerId) {
        UserPrincipal currentUser = authService.getCurrentUser();
        Long effectiveCustomerId = customerId;

        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            effectiveCustomerId = currentUser.getCustomerId();
        }

        List<Payment> payments;
        if (effectiveCustomerId != null) {
            payments = paymentRepository.findByInvoiceCustomerId(effectiveCustomerId);
        } else if (invoiceId != null) {
            payments = paymentRepository.findByInvoiceId(invoiceId);
        } else {
            payments = paymentRepository.findAll();
        }

        return payments.stream()
                .map(p -> toPaymentResponse(p, p.getInvoice().getStatus(), p.getInvoice().getOutstandingBalance()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentDto.PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        enforceInvoicePaymentAccess(payment.getInvoice());
        return toPaymentResponse(payment, payment.getInvoice().getStatus(), payment.getInvoice().getOutstandingBalance());
    }

    private void enforceInvoicePaymentAccess(Invoice invoice) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Long customerId = currentUser.getCustomerId();
            if (customerId == null || !customerId.equals(invoice.getCustomer().getId())) {
                throw new AccessDeniedException("Access denied: You do not own the invoice for this payment");
            }
        }
    }

    private String generatePaymentNumber() {
        return "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private PaymentDto.PaymentResponse toPaymentResponse(Payment payment, InvoiceStatus status, BigDecimal balance) {
        return PaymentDto.PaymentResponse.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .invoiceId(payment.getInvoice().getId())
                .invoiceNumber(payment.getInvoice().getInvoiceNumber())
                .customerId(payment.getInvoice().getCustomer().getId())
                .customerName(payment.getInvoice().getCustomer().getName())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentDate(payment.getPaymentDate())
                .note(payment.getNote())
                .invoiceStatus(status)
                .remainingOutstandingBalance(balance)
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
