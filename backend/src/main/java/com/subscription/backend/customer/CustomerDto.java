package com.subscription.backend.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class CustomerDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerRequest {
        @NotBlank(message = "Customer name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        private String phone;
        private String address;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String address;
        private Long userId;
        private LocalDateTime createdAt;
    }
}
