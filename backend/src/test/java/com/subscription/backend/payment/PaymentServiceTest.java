package com.subscription.backend.payment;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.customer.Customer;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.invoice.Invoice;
import com.subscription.backend.invoice.InvoiceRepository;
import com.subscription.backend.invoice.InvoiceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private PaymentService paymentService;

    private Customer sampleCustomer;
    private Invoice sampleInvoice;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .id(1L)
                .name("Alpha Corp")
                .email("alpha@corp.com")
                .build();

        sampleInvoice = Invoice.builder()
                .id(10L)
                .invoiceNumber("INV-1001")
                .customer(sampleCustomer)
                .total(new BigDecimal("200.00"))
                .amountPaid(BigDecimal.ZERO)
                .outstandingBalance(new BigDecimal("200.00"))
                .status(InvoiceStatus.CONFIRMED)
                .build();
    }

    @Test
    void testPartialPayment_UpdatesStatusToPartiallyPaid() {
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(sampleInvoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(101L);
            return p;
        });

        PaymentDto.PaymentRequest request = PaymentDto.PaymentRequest.builder()
                .invoiceId(10L)
                .amount(new BigDecimal("75.00"))
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .paymentDate(LocalDate.now())
                .build();

        PaymentDto.PaymentResponse response = paymentService.recordPayment(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("75.00"), response.getAmount());
        assertEquals(new BigDecimal("125.00"), response.getRemainingOutstandingBalance());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, response.getInvoiceStatus());
        assertEquals(new BigDecimal("75.00"), sampleInvoice.getAmountPaid());
        assertEquals(new BigDecimal("125.00"), sampleInvoice.getOutstandingBalance());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, sampleInvoice.getStatus());
    }

    @Test
    void testFullPayment_UpdatesStatusToPaid() {
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(sampleInvoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(102L);
            return p;
        });

        PaymentDto.PaymentRequest request = PaymentDto.PaymentRequest.builder()
                .invoiceId(10L)
                .amount(new BigDecimal("200.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentDate(LocalDate.now())
                .build();

        PaymentDto.PaymentResponse response = paymentService.recordPayment(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("0.00"), response.getRemainingOutstandingBalance());
        assertEquals(InvoiceStatus.PAID, response.getInvoiceStatus());
        assertEquals(InvoiceStatus.PAID, sampleInvoice.getStatus());
    }

    @Test
    void testOverpayment_Rejected() {
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(sampleInvoice));

        PaymentDto.PaymentRequest request = PaymentDto.PaymentRequest.builder()
                .invoiceId(10L)
                .amount(new BigDecimal("250.00")) // Exceeds 200.00 balance
                .paymentMethod(PaymentMethod.UPI)
                .paymentDate(LocalDate.now())
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> paymentService.recordPayment(request));

        assertTrue(ex.getMessage().contains("Overpayment rejected"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }
}
