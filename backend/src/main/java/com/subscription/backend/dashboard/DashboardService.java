package com.subscription.backend.dashboard;

import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.invoice.InvoiceRepository;
import com.subscription.backend.invoice.InvoiceStatus;
import com.subscription.backend.payment.PaymentRepository;
import com.subscription.backend.subscription.SubscriptionRepository;
import com.subscription.backend.subscription.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public DashboardDto.DashboardSummaryResponse getSummary(LocalDate startDate, LocalDate endDate) {
        long activeSubscriptions = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);

        BigDecimal revenueReceived;
        if (startDate != null && endDate != null) {
            revenueReceived = paymentRepository.sumAmountByPaymentDateBetween(startDate, endDate);
        } else {
            revenueReceived = paymentRepository.sumAllPayments();
        }

        BigDecimal amountOwed = invoiceRepository.sumOutstandingBalanceByStatusIn(
                List.of(InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID)
        );

        long overdueInvoices = invoiceRepository.countByDueDateBeforeAndStatusNotIn(
                LocalDate.now(),
                List.of(InvoiceStatus.PAID, InvoiceStatus.CANCELLED)
        );

        long totalCustomers = customerRepository.count();
        long totalInvoices = invoiceRepository.count();

        return DashboardDto.DashboardSummaryResponse.builder()
                .activeSubscriptions(activeSubscriptions)
                .revenueReceived(revenueReceived != null ? revenueReceived : BigDecimal.ZERO)
                .amountOwed(amountOwed != null ? amountOwed : BigDecimal.ZERO)
                .overdueInvoices(overdueInvoices)
                .totalCustomers(totalCustomers)
                .totalInvoices(totalInvoices)
                .build();
    }
}
