package com.subscription.backend.tax;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TaxDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaxRequest {
        @NotBlank(message = "Tax name is required")
        private String name;

        @NotNull(message = "Tax rate is required")
        @DecimalMin(value = "0.0", message = "Tax rate cannot be negative")
        @DecimalMax(value = "100.0", message = "Tax rate cannot exceed 100%")
        private BigDecimal rate;

        @Builder.Default
        private Boolean active = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaxResponse {
        private Long id;
        private String name;
        private BigDecimal rate;
        private boolean active;
        private LocalDateTime createdAt;
    }
}
