package com.subscription.backend.dashboard;

import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.invoice.InvoiceRepository;
import com.subscription.backend.invoice.InvoiceStatus;
import com.subscription.backend.payment.PaymentRepository;
import com.subscription.backend.subscription.SubscriptionRepository;
import com.subscription.backend.subscription.SubscriptionStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void testGetSummary_AllCalculations() {
        when(subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE)).thenReturn(42L);
        when(paymentRepository.sumAllPayments()).thenReturn(new BigDecimal("15450.00"));
        when(invoiceRepository.sumOutstandingBalanceByStatusIn(anyCollection())).thenReturn(new BigDecimal("3200.00"));
        when(invoiceRepository.countByDueDateBeforeAndStatusNotIn(any(LocalDate.class), anyCollection())).thenReturn(3L);
        when(customerRepository.count()).thenReturn(28L);
        when(invoiceRepository.count()).thenReturn(65L);

        DashboardDto.DashboardSummaryResponse summary = dashboardService.getSummary(null, null);

        assertNotNull(summary);
        assertEquals(42L, summary.getActiveSubscriptions());
        assertEquals(new BigDecimal("15450.00"), summary.getRevenueReceived());
        assertEquals(new BigDecimal("3200.00"), summary.getAmountOwed());
        assertEquals(3L, summary.getOverdueInvoices());
        assertEquals(28L, summary.getTotalCustomers());
        assertEquals(65L, summary.getTotalInvoices());
    }

    @Test
    void testGetSummary_WithDateFilter_UsesPeriodRevenue() {
        LocalDate start = LocalDate.of(2026, 10, 1);
        LocalDate end = LocalDate.of(2026, 10, 31);

        when(subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE)).thenReturn(10L);
        when(paymentRepository.sumAmountByPaymentDateBetween(start, end)).thenReturn(new BigDecimal("4500.00"));
        when(invoiceRepository.sumOutstandingBalanceByStatusIn(anyCollection())).thenReturn(new BigDecimal("1200.00"));
        when(invoiceRepository.countByDueDateBeforeAndStatusNotIn(any(LocalDate.class), anyCollection())).thenReturn(1L);

        DashboardDto.DashboardSummaryResponse summary = dashboardService.getSummary(start, end);

        assertNotNull(summary);
        assertEquals(10L, summary.getActiveSubscriptions());
        assertEquals(new BigDecimal("4500.00"), summary.getRevenueReceived());
        assertEquals(new BigDecimal("1200.00"), summary.getAmountOwed());
    }
}
