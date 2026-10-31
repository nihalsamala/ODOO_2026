package com.subscription.backend.discount;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DiscountDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiscountRequest {
        @NotBlank(message = "Discount code is required")
        private String code;

        @NotNull(message = "Discount type is required")
        private DiscountType type;

        @NotNull(message = "Discount value is required")
        @DecimalMin(value = "0.01", message = "Discount value must be greater than zero")
        private BigDecimal value;

        private BigDecimal minPurchaseAmount;
        private Integer minQuantity;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer maxUsageCount;

        @Builder.Default
        private DiscountTarget targetType = DiscountTarget.ALL;

        private Long targetProductId;

        @Builder.Default
        private Boolean active = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiscountResponse {
        private Long id;
        private String code;
        private DiscountType type;
        private BigDecimal value;
        private BigDecimal minPurchaseAmount;
        private Integer minQuantity;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer maxUsageCount;
        private int currentUsageCount;
        private DiscountTarget targetType;
        private Long targetProductId;
        private boolean active;
        private LocalDateTime createdAt;
    }
}
