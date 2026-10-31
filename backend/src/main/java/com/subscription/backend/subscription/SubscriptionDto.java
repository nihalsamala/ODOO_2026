package com.subscription.backend.subscription;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SubscriptionDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubscriptionRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;

        @NotNull(message = "Plan ID is required")
        private Long planId;

        @NotNull(message = "Product ID is required")
        private Long productId;

        private Long variantId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        private LocalDate expiryDate;

        private BigDecimal agreedUnitPrice;

        @Builder.Default
        private SubscriptionStatus initialStatus = SubscriptionStatus.DRAFT;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubscriptionResponse {
        private Long id;
        private String subscriptionNumber;
        private Long customerId;
        private String customerName;
        private Long planId;
        private String planName;
        private Long productId;
        private String productName;
        private Long variantId;
        private String variantName;
        private Integer quantity;
        private LocalDate startDate;
        private LocalDate expiryDate;
        private LocalDate nextBillingDate;
        private BigDecimal agreedUnitPrice;
        private BigDecimal subtotal;
        private SubscriptionStatus status;
        private LocalDate pausedAt;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RenewalAlertResponse {
        private Long subscriptionId;
        private String subscriptionNumber;
        private Long customerId;
        private String customerName;
        private String customerEmail;
        private Long productId;
        private String productName;
        private Long planId;
        private String planName;
        private String billingInterval;
        private String lifecycleRule;
        private SubscriptionStatus status;
        private LocalDate relevantDate;
        private String dateType;
        private long daysRemaining;
        private BigDecimal amount;
        private boolean autoRenew;
        private boolean actionRequired;
        private String alertLevel;
        private String alertMessage;
    }
}
