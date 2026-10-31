package com.subscription.backend.payment;

import com.subscription.backend.invoice.InvoiceStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentRequest {
        @NotNull(message = "Invoice ID is required")
        private Long invoiceId;

        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
        private BigDecimal amount;

        @NotNull(message = "Payment method is required")
        private PaymentMethod paymentMethod;

        private LocalDate paymentDate;

        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentResponse {
        private Long id;
        private String paymentNumber;
        private Long invoiceId;
        private String invoiceNumber;
        private Long customerId;
        private String customerName;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
        private LocalDate paymentDate;
        private String note;
        private InvoiceStatus invoiceStatus;
        private BigDecimal remainingOutstandingBalance;
        private LocalDateTime createdAt;
    }
}
