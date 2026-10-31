package com.subscription.backend.plan;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductPlanDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductPlanRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Plan ID is required")
        private Long planId;

        @Builder.Default
        private Boolean active = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductPlanResponse {
        private Long id;
        private Long productId;
        private String productName;
        private Long planId;
        private String planName;
        private BillingInterval billingInterval;
        private BigDecimal planPrice;
        private boolean active;
        private LocalDateTime createdAt;
    }
}
