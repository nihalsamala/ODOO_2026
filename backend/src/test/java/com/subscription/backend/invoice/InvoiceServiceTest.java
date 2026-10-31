package com.subscription.backend.invoice;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.customer.Customer;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.plan.BillingInterval;
import com.subscription.backend.plan.Plan;
import com.subscription.backend.product.Product;
import com.subscription.backend.subscription.Subscription;
import com.subscription.backend.subscription.SubscriptionRepository;
import com.subscription.backend.subscription.SubscriptionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private InvoiceService invoiceService;

    private Customer sampleCustomer;
    private Subscription sampleSubscription;
    private Plan samplePlan;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .id(1L)
                .name("Global Tech")
                .email("billing@globaltech.com")
                .build();

        sampleProduct = Product.builder()
                .id(10L)
                .name("Enterprise Cloud")
                .salesPrice(new BigDecimal("150.00"))
                .build();

        samplePlan = Plan.builder()
                .id(20L)
                .name("Annual Pro")
                .price(new BigDecimal("0.00"))
                .billingInterval(BillingInterval.MONTHLY)
                .build();

        sampleSubscription = Subscription.builder()
                .id(100L)
                .subscriptionNumber("SUB-2026-001")
                .customer(sampleCustomer)
                .product(sampleProduct)
                .plan(samplePlan)
                .quantity(2)
                .startDate(LocalDate.of(2026, 11, 1))
                .nextBillingDate(LocalDate.of(2026, 11, 1))
                .agreedUnitPrice(new BigDecimal("150.00"))
                .subtotal(new BigDecimal("300.00"))
                .status(SubscriptionStatus.ACTIVE)
                .build();
    }

    @Test
    void testGenerateInvoice_Success() {
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(sampleSubscription));
        when(invoiceRepository.existsBySubscriptionIdAndBillingPeriod(anyLong(), anyString())).thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(500L);
            return inv;
        });

        InvoiceDto.InvoiceResponse response = invoiceService.generateInvoiceForSubscription(100L, LocalDate.of(2026, 11, 1));

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals("2026-11-01 to 2026-11-30", response.getBillingPeriod());
        assertEquals(new BigDecimal("300.00"), response.getSubtotal());
        assertEquals(new BigDecimal("300.00"), response.getTotal());
        assertEquals(new BigDecimal("300.00"), response.getOutstandingBalance());
        assertEquals(InvoiceStatus.CONFIRMED, response.getStatus());

        // Verify next billing date advanced to December 1, 2026
        assertEquals(LocalDate.of(2026, 12, 1), sampleSubscription.getNextBillingDate());
    }

    @Test
    void testGenerateInvoice_DuplicateBillingPeriod_ThrowsException() {
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(sampleSubscription));
        when(invoiceRepository.existsBySubscriptionIdAndBillingPeriod(100L, "2026-11-01 to 2026-11-30")).thenReturn(true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> invoiceService.generateInvoiceForSubscription(100L, LocalDate.of(2026, 11, 1)));

        assertTrue(ex.getMessage().contains("Duplicate invoice"));
        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    @Test
    void testGenerateInvoice_PausedSubscription_ThrowsException() {
        sampleSubscription.setStatus(SubscriptionStatus.PAUSED);
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(sampleSubscription));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> invoiceService.generateInvoiceForSubscription(100L, null));

        assertTrue(ex.getMessage().contains("Cannot generate invoices for PAUSED subscriptions"));
    }
}
