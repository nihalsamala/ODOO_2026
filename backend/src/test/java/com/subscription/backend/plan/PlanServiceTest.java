package com.subscription.backend.plan;

import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.product.Product;
import com.subscription.backend.product.ProductRepository;
import com.subscription.backend.product.ProductType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanServiceTest {

    @Mock
    private PlanRepository planRepository;

    @Mock
    private ProductPlanRepository productPlanRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private PlanService planService;

    private Plan samplePlan;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = Product.builder()
                .id(1L)
                .name("SaaS Pro")
                .type(ProductType.DIGITAL)
                .salesPrice(new BigDecimal("50.00"))
                .active(true)
                .build();

        samplePlan = Plan.builder()
                .id(1L)
                .name("Monthly Gold")
                .price(new BigDecimal("30.00"))
                .billingInterval(BillingInterval.MONTHLY)
                .minimumQuantity(1)
                .availabilityStartDate(LocalDate.now().minusDays(10))
                .availabilityEndDate(LocalDate.now().plusDays(90))
                .lifecycleRule(LifecycleRule.AUTO_RENEW)
                .active(true)
                .build();
    }

    @Test
    void testCreatePlan_Success() {
        PlanDto.PlanRequest request = PlanDto.PlanRequest.builder()
                .name("Monthly Gold")
                .price(new BigDecimal("30.00"))
                .billingInterval(BillingInterval.MONTHLY)
                .minimumQuantity(1)
                .availabilityStartDate(LocalDate.now())
                .lifecycleRule(LifecycleRule.AUTO_RENEW)
                .build();

        when(planRepository.save(any(Plan.class))).thenReturn(samplePlan);

        PlanDto.PlanResponse response = planService.createPlan(request);

        assertNotNull(response);
        assertEquals("Monthly Gold", response.getName());
        assertEquals(BillingInterval.MONTHLY, response.getBillingInterval());
    }

    @Test
    void testCreatePlan_InvalidDates_ThrowsException() {
        PlanDto.PlanRequest request = PlanDto.PlanRequest.builder()
                .name("Bad Plan")
                .price(new BigDecimal("30.00"))
                .billingInterval(BillingInterval.MONTHLY)
                .availabilityStartDate(LocalDate.now())
                .availabilityEndDate(LocalDate.now().minusDays(5)) // end before start!
                .lifecycleRule(LifecycleRule.AUTO_RENEW)
                .build();

        assertThrows(BusinessRuleException.class, () -> planService.createPlan(request));
    }

    @Test
    void testValidateProductPlanCompatibility_Success() {
        ProductPlan mapping = ProductPlan.builder()
                .id(100L)
                .product(sampleProduct)
                .plan(samplePlan)
                .active(true)
                .build();

        when(productPlanRepository.findByProductIdAndPlanId(1L, 1L)).thenReturn(Optional.of(mapping));

        assertDoesNotThrow(() -> planService.validateProductPlanCompatibility(1L, 1L));
    }

    @Test
    void testValidateProductPlanCompatibility_NotMapped_ThrowsException() {
        when(productPlanRepository.findByProductIdAndPlanId(1L, 2L)).thenReturn(Optional.empty());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> planService.validateProductPlanCompatibility(1L, 2L));

        assertTrue(ex.getMessage().contains("not configured"));
    }

    @Test
    void testValidateProductPlanCompatibility_ExpiredPlan_ThrowsException() {
        Plan expiredPlan = Plan.builder()
                .id(2L)
                .name("Expired Plan")
                .price(new BigDecimal("10.00"))
                .billingInterval(BillingInterval.MONTHLY)
                .minimumQuantity(1)
                .availabilityStartDate(LocalDate.now().minusDays(30))
                .availabilityEndDate(LocalDate.now().minusDays(1)) // Expired yesterday
                .active(true)
                .build();

        ProductPlan mapping = ProductPlan.builder()
                .id(101L)
                .product(sampleProduct)
                .plan(expiredPlan)
                .active(true)
                .build();

        when(productPlanRepository.findByProductIdAndPlanId(1L, 2L)).thenReturn(Optional.of(mapping));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> planService.validateProductPlanCompatibility(1L, 2L));

        assertTrue(ex.getMessage().contains("expired"));
    }
}
