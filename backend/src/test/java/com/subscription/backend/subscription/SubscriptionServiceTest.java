package com.subscription.backend.subscription;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.customer.Customer;
import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.customer.CustomerService;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.plan.BillingInterval;
import com.subscription.backend.plan.LifecycleRule;
import com.subscription.backend.plan.Plan;
import com.subscription.backend.plan.PlanRepository;
import com.subscription.backend.plan.PlanService;
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
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PlanService planService;

    @Mock
    private CustomerService customerService;

    @Mock
    private AuthService authService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private Customer sampleCustomer;
    private Product sampleProduct;
    private Plan samplePlan;
    private Subscription sampleSubscription;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .id(1L)
                .name("Acme Corp")
                .email("billing@acme.com")
                .build();

        sampleProduct = Product.builder()
                .id(10L)
                .name("CRM Cloud")
                .type(ProductType.DIGITAL)
                .salesPrice(new BigDecimal("100.00"))
                .active(true)
                .build();

        samplePlan = Plan.builder()
                .id(20L)
                .name("Pro Monthly")
                .price(new BigDecimal("20.00"))
                .billingInterval(BillingInterval.MONTHLY)
                .minimumQuantity(2)
                .availabilityStartDate(LocalDate.now().minusDays(5))
                .lifecycleRule(LifecycleRule.AUTO_RENEW)
                .active(true)
                .build();

        sampleSubscription = Subscription.builder()
                .id(100L)
                .subscriptionNumber("SUB-TEST-01")
                .customer(sampleCustomer)
                .product(sampleProduct)
                .plan(samplePlan)
                .quantity(3)
                .startDate(LocalDate.now())
                .nextBillingDate(LocalDate.now())
                .agreedUnitPrice(new BigDecimal("120.00")) // 100 + 20
                .subtotal(new BigDecimal("360.00")) // 120 * 3
                .status(SubscriptionStatus.DRAFT)
                .build();
    }

    @Test
    void testCreateSubscription_Success() {
        SubscriptionDto.SubscriptionRequest request = SubscriptionDto.SubscriptionRequest.builder()
                .customerId(1L)
                .productId(10L)
                .planId(20L)
                .quantity(3)
                .startDate(LocalDate.now())
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(sampleSubscription);

        SubscriptionDto.SubscriptionResponse response = subscriptionService.createSubscription(request);

        assertNotNull(response);
        assertEquals("SUB-TEST-01", response.getSubscriptionNumber());
        assertEquals(new BigDecimal("120.00"), response.getAgreedUnitPrice());
        assertEquals(new BigDecimal("360.00"), response.getSubtotal());
    }

    @Test
    void testCreateSubscription_QuantityLessThanMinimum_ThrowsException() {
        SubscriptionDto.SubscriptionRequest request = SubscriptionDto.SubscriptionRequest.builder()
                .customerId(1L)
                .productId(10L)
                .planId(20L)
                .quantity(1) // Minimum is 2!
                .startDate(LocalDate.now())
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> subscriptionService.createSubscription(request));

        assertTrue(ex.getMessage().contains("minimum required quantity"));
    }

    @Test
    void testLifecycleTransitions_DraftToActiveToPausedToResume() {
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(sampleSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 1. DRAFT -> CONFIRMED
        SubscriptionDto.SubscriptionResponse confirmed = subscriptionService.confirmSubscription(100L);
        assertEquals(SubscriptionStatus.CONFIRMED, confirmed.getStatus());

        // 2. CONFIRMED -> ACTIVE
        SubscriptionDto.SubscriptionResponse active = subscriptionService.activateSubscription(100L);
        assertEquals(SubscriptionStatus.ACTIVE, active.getStatus());

        // 3. ACTIVE -> PAUSED
        SubscriptionDto.SubscriptionResponse paused = subscriptionService.pauseSubscription(100L);
        assertEquals(SubscriptionStatus.PAUSED, paused.getStatus());
        assertNotNull(paused.getPausedAt());

        // 4. PAUSED -> ACTIVE (resumes and shifts nextBillingDate)
        LocalDate oldBillingDate = sampleSubscription.getNextBillingDate();
        SubscriptionDto.SubscriptionResponse resumed = subscriptionService.resumeSubscription(100L);
        assertEquals(SubscriptionStatus.ACTIVE, resumed.getStatus());
        assertNull(resumed.getPausedAt());
        assertTrue(resumed.getNextBillingDate().isAfter(oldBillingDate));
    }
}
