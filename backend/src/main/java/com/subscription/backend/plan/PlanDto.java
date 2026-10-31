package com.subscription.backend.plan;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PlanDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlanRequest {
        @NotBlank(message = "Plan name is required")
        private String name;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Price cannot be negative")
        private BigDecimal price;

        @NotNull(message = "Billing interval is required")
        private BillingInterval billingInterval;

        @NotNull(message = "Minimum quantity is required")
        @Min(value = 1, message = "Minimum quantity must be at least 1")
        @Builder.Default
        private Integer minimumQuantity = 1;

        @NotNull(message = "Availability start date is required")
        private LocalDate availabilityStartDate;

        private LocalDate availabilityEndDate;

        @NotNull(message = "Lifecycle rule is required")
        @Builder.Default
        private LifecycleRule lifecycleRule = LifecycleRule.AUTO_RENEW;

        @Builder.Default
        private Boolean active = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlanResponse {
        private Long id;
        private String name;
        private BigDecimal price;
        private BillingInterval billingInterval;
        private Integer minimumQuantity;
        private LocalDate availabilityStartDate;
        private LocalDate availabilityEndDate;
        private LifecycleRule lifecycleRule;
        private boolean active;
        private LocalDateTime createdAt;
    }
}
