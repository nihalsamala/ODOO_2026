package com.subscription.backend.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductRequest {
        @NotBlank(message = "Product name is required")
        private String name;

        @NotNull(message = "Product type is required")
        private ProductType type;

        @NotNull(message = "Sales price is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Sales price cannot be negative")
        private BigDecimal salesPrice;

        @DecimalMin(value = "0.0", inclusive = true, message = "Cost price cannot be negative")
        private BigDecimal costPrice;

        private String notes;

        @Builder.Default
        private Boolean active = true;

        private List<VariantRequest> variants;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductResponse {
        private Long id;
        private String name;
        private ProductType type;
        private BigDecimal salesPrice;
        private BigDecimal costPrice;
        private String notes;
        private boolean active;
        private List<VariantResponse> variants;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VariantRequest {
        @NotBlank(message = "Variant name is required")
        private String name;

        @NotNull(message = "Price adjustment is required")
        private BigDecimal priceAdjustment;

        @Builder.Default
        private Boolean active = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VariantResponse {
        private Long id;
        private Long productId;
        private String name;
        private BigDecimal priceAdjustment;
        private BigDecimal effectivePrice;
        private boolean active;
    }
}
