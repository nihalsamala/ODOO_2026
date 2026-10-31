package com.subscription.backend.invoice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerateInvoiceRequest {
        private Long subscriptionId;
        private LocalDate asOfDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceResponse {
        private Long id;
        private String invoiceNumber;
        private Long subscriptionId;
        private String subscriptionNumber;
        private Long customerId;
        private String customerName;
        private String customerEmail;
        private String billingPeriod;
        private LocalDate billingPeriodStart;
        private LocalDate billingPeriodEnd;
        private LocalDate issueDate;
        private LocalDate dueDate;
        private BigDecimal subtotal;
        private BigDecimal discountAmount;
        private BigDecimal taxAmount;
        private BigDecimal total;
        private BigDecimal amountPaid;
        private BigDecimal outstandingBalance;
        private InvoiceStatus status;
        private List<InvoiceLineResponse> lines;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceLineResponse {
        private Long id;
        private String description;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal discountAmount;
        private BigDecimal taxRate;
        private BigDecimal taxAmount;
        private BigDecimal lineTotal;
    }
}
