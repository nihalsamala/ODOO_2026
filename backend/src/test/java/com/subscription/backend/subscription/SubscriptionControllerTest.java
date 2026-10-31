package com.subscription.backend.subscription;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SubscriptionControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private SubscriptionController subscriptionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(subscriptionController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void testPurchaseEndpoint_ValidRequest_Returns201Created() throws Exception {
        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L)
                .planId(20L)
                .quantity(2)
                .build();

        SubscriptionDto.SubscriptionResponse response = SubscriptionDto.SubscriptionResponse.builder()
                .id(101L)
                .subscriptionNumber("SUB-CUST-001")
                .customerId(1L)
                .customerName("Acme Customer")
                .productId(10L)
                .productName("CRM Cloud")
                .planId(20L)
                .planName("Pro Monthly")
                .quantity(2)
                .startDate(LocalDate.now())
                .agreedUnitPrice(new BigDecimal("120.00"))
                .subtotal(new BigDecimal("240.00"))
                .status(SubscriptionStatus.CONFIRMED)
                .build();

        when(subscriptionService.purchaseSubscription(any(SubscriptionDto.CustomerPurchaseRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/subscriptions/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.subscriptionNumber").value("SUB-CUST-001"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.agreedUnitPrice").value(120.00))
                .andExpect(jsonPath("$.subtotal").value(240.00));

        verify(subscriptionService).purchaseSubscription(any(SubscriptionDto.CustomerPurchaseRequest.class));
    }

    @Test
    void testPurchaseEndpoint_InvalidRequest_MissingRequiredFields_Returns400() throws Exception {
        // Missing productId, planId, quantity is 0
        SubscriptionDto.CustomerPurchaseRequest invalidRequest = SubscriptionDto.CustomerPurchaseRequest.builder()
                .quantity(0)
                .build();

        mockMvc.perform(post("/api/subscriptions/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
