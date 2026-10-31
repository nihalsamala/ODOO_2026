package com.subscription.backend.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class DashboardDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardSummaryResponse {
        private long activeSubscriptions;
        private BigDecimal revenueReceived;
        private BigDecimal amountOwed;
        private long overdueInvoices;
        private long totalCustomers;
        private long totalInvoices;
    }
}
