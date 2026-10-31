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
import com.subscription.backend.invoice.InvoiceService;
import com.subscription.backend.product.ProductVariant;
import com.subscription.backend.product.ProductVariantRepository;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private InvoiceService invoiceService;

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

    @Test
    void testGetUpcomingRenewalAlerts_BoundaryDueTodayAnd7Days() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 1);

        Subscription subDueToday = Subscription.builder()
                .id(101L)
                .subscriptionNumber("SUB-TODAY")
                .customer(sampleCustomer)
                .product(sampleProduct)
                .plan(samplePlan)
                .quantity(1)
                .startDate(asOfDate.minusMonths(1))
                .nextBillingDate(asOfDate) // Due today (0 days remaining)
                .agreedUnitPrice(new BigDecimal("120.00"))
                .subtotal(new BigDecimal("120.00"))
                .status(SubscriptionStatus.ACTIVE)
                .build();

        Subscription subDue7Days = Subscription.builder()
                .id(102L)
                .subscriptionNumber("SUB-DAY-7")
                .customer(sampleCustomer)
                .product(sampleProduct)
                .plan(samplePlan)
                .quantity(1)
                .startDate(asOfDate.minusMonths(1))
                .nextBillingDate(asOfDate.plusDays(7)) // Due exactly 7 days from today
                .agreedUnitPrice(new BigDecimal("120.00"))
                .subtotal(new BigDecimal("120.00"))
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findUpcomingRenewalAlerts(any(), eq(asOfDate), eq(asOfDate.plusDays(7))))
                .thenReturn(List.of(subDueToday, subDue7Days));

        List<SubscriptionDto.RenewalAlertResponse> alerts =
                subscriptionService.getUpcomingRenewalAlerts(7, null, asOfDate);

        assertEquals(2, alerts.size());

        // Verify boundary 0 days (today)
        SubscriptionDto.RenewalAlertResponse alertToday = alerts.get(0);
        assertEquals("SUB-TODAY", alertToday.getSubscriptionNumber());
        assertEquals(0L, alertToday.getDaysRemaining());
        assertEquals(asOfDate, alertToday.getRelevantDate());
        assertEquals("URGENT", alertToday.getAlertLevel());
        assertTrue(alertToday.isAutoRenew());

        // Verify boundary 7 days
        SubscriptionDto.RenewalAlertResponse alert7Days = alerts.get(1);
        assertEquals("SUB-DAY-7", alert7Days.getSubscriptionNumber());
        assertEquals(7L, alert7Days.getDaysRemaining());
        assertEquals(asOfDate.plusDays(7), alert7Days.getRelevantDate());
        assertEquals("INFO", alert7Days.getAlertLevel());
    }

    @Test
    void testGetUpcomingRenewalAlerts_PausedSubscription_RequiresAction() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 1);

        Subscription subPaused = Subscription.builder()
                .id(103L)
                .subscriptionNumber("SUB-PAUSED")
                .customer(sampleCustomer)
                .product(sampleProduct)
                .plan(samplePlan)
                .quantity(1)
                .startDate(asOfDate.minusMonths(1))
                .nextBillingDate(asOfDate.plusDays(3))
                .agreedUnitPrice(new BigDecimal("120.00"))
                .subtotal(new BigDecimal("120.00"))
                .status(SubscriptionStatus.PAUSED)
                .pausedAt(asOfDate.minusDays(5))
                .build();

        when(subscriptionRepository.findUpcomingRenewalAlerts(any(), eq(asOfDate), eq(asOfDate.plusDays(7))))
                .thenReturn(List.of(subPaused));

        List<SubscriptionDto.RenewalAlertResponse> alerts =
                subscriptionService.getUpcomingRenewalAlerts(7, null, asOfDate);

        assertEquals(1, alerts.size());
        SubscriptionDto.RenewalAlertResponse alert = alerts.get(0);
        assertEquals("SUB-PAUSED", alert.getSubscriptionNumber());
        assertEquals(SubscriptionStatus.PAUSED, alert.getStatus());
        assertTrue(alert.isActionRequired());
        assertFalse(alert.isAutoRenew());
        assertTrue(alert.getAlertMessage().contains("paused"));
    }

    @Test
    void testGetUpcomingRenewalAlerts_EmptyResults_ReturnsEmptyList() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 1);

        when(subscriptionRepository.findUpcomingRenewalAlerts(any(), eq(asOfDate), eq(asOfDate.plusDays(7))))
                .thenReturn(List.of());

        List<SubscriptionDto.RenewalAlertResponse> alerts =
                subscriptionService.getUpcomingRenewalAlerts(7, null, asOfDate);

        assertNotNull(alerts);
        assertTrue(alerts.isEmpty());
    }

    @Test
    void testGetUpcomingRenewalAlerts_ExcludedStatus_ClosedPassedToRepository() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 1);

        when(subscriptionRepository.findUpcomingRenewalAlerts(argThat(statuses ->
                statuses.contains(SubscriptionStatus.CLOSED) &&
                statuses.contains(SubscriptionStatus.DRAFT)),
                eq(asOfDate), eq(asOfDate.plusDays(7))))
                .thenReturn(List.of());

        List<SubscriptionDto.RenewalAlertResponse> alerts =
                subscriptionService.getUpcomingRenewalAlerts(7, null, asOfDate);

        assertNotNull(alerts);
        assertTrue(alerts.isEmpty());
        verify(subscriptionRepository).findUpcomingRenewalAlerts(
                argThat(statuses -> statuses.contains(SubscriptionStatus.CLOSED)),
                eq(asOfDate),
                eq(asOfDate.plusDays(7))
        );
    }

    @Test
    void testGetUpcomingRenewalAlerts_DueIn8Days_ExcludedFromAlerts() {
        LocalDate asOfDate = LocalDate.of(2026, 11, 1);

        Subscription subDue8Days = Subscription.builder()
                .id(104L)
                .subscriptionNumber("SUB-DAY-8")
                .customer(sampleCustomer)
                .product(sampleProduct)
                .plan(samplePlan)
                .quantity(1)
                .startDate(asOfDate.minusMonths(1))
                .nextBillingDate(asOfDate.plusDays(8))
                .agreedUnitPrice(new BigDecimal("120.00"))
                .subtotal(new BigDecimal("120.00"))
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(subscriptionRepository.findUpcomingRenewalAlerts(any(), eq(asOfDate), eq(asOfDate.plusDays(7))))
                .thenReturn(List.of(subDue8Days));

        List<SubscriptionDto.RenewalAlertResponse> alerts =
                subscriptionService.getUpcomingRenewalAlerts(7, null, asOfDate);

        assertTrue(alerts.isEmpty());
    }

    // ==========================================
    // Customer Purchase Workflow Tests
    // ==========================================

    @Test
    void testPurchaseSubscription_Success() {
        UserPrincipal customerPrincipal = new UserPrincipal(
                10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of()
        );
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);

        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription s = invocation.getArgument(0);
            s.setId(201L);
            return s;
        });

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L)
                .planId(20L)
                .quantity(3)
                .build();

        SubscriptionDto.SubscriptionResponse response = subscriptionService.purchaseSubscription(request);

        assertNotNull(response);
        assertEquals(201L, response.getId());
        assertEquals(1L, response.getCustomerId());
        assertEquals(SubscriptionStatus.CONFIRMED, response.getStatus());
        // Unit price = product sales price (100.00) + plan price (20.00) = 120.00
        assertEquals(new BigDecimal("120.00"), response.getAgreedUnitPrice());
        // Subtotal = 120.00 * 3 = 360.00
        assertEquals(new BigDecimal("360.00"), response.getSubtotal());

        // Verifies initial invoice generation for the confirmed subscription
        verify(invoiceService).createInvoiceForPeriod(any(Subscription.class), eq(LocalDate.now()));
    }

    @Test
    void testPurchaseSubscription_WithActiveVariant_Success() {
        UserPrincipal customerPrincipal = new UserPrincipal(
                10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of()
        );
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        ProductVariant variant = ProductVariant.builder()
                .id(30L)
                .product(sampleProduct)
                .name("High Speed")
                .priceAdjustment(new BigDecimal("15.00"))
                .active(true)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        when(productVariantRepository.findById(30L)).thenReturn(Optional.of(variant));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);

        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L)
                .planId(20L)
                .variantId(30L)
                .quantity(2)
                .build();

        SubscriptionDto.SubscriptionResponse response = subscriptionService.purchaseSubscription(request);

        assertNotNull(response);
        // Unit price = 100.00 + 15.00 (variant) + 20.00 (plan) = 135.00
        assertEquals(new BigDecimal("135.00"), response.getAgreedUnitPrice());
        // Subtotal = 135.00 * 2 = 270.00
        assertEquals(new BigDecimal("270.00"), response.getSubtotal());
        assertEquals(SubscriptionStatus.CONFIRMED, response.getStatus());
        verify(invoiceService).createInvoiceForPeriod(any(Subscription.class), eq(LocalDate.now()));
    }

    @Test
    void testPurchaseSubscription_UnauthenticatedOrNonCustomer_ThrowsAccessDenied() {
        // 1. Unauthenticated (null currentUser)
        when(authService.getCurrentUser()).thenReturn(null);
        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L).planId(20L).quantity(2).build();

        assertThrows(AccessDeniedException.class, () -> subscriptionService.purchaseSubscription(request));

        // 2. STAFF user
        UserPrincipal staffPrincipal = new UserPrincipal(2L, "staff@test.com", "pass", Role.STAFF, null, List.of());
        when(authService.getCurrentUser()).thenReturn(staffPrincipal);
        assertThrows(AccessDeniedException.class, () -> subscriptionService.purchaseSubscription(request));

        // 3. ADMIN user
        UserPrincipal adminPrincipal = new UserPrincipal(3L, "admin@test.com", "pass", Role.ADMIN, null, List.of());
        when(authService.getCurrentUser()).thenReturn(adminPrincipal);
        assertThrows(AccessDeniedException.class, () -> subscriptionService.purchaseSubscription(request));

        // 4. CUSTOMER role without customerId in token
        UserPrincipal customerWithoutId = new UserPrincipal(4L, "cust@test.com", "pass", Role.CUSTOMER, null, List.of());
        when(authService.getCurrentUser()).thenReturn(customerWithoutId);
        assertThrows(AccessDeniedException.class, () -> subscriptionService.purchaseSubscription(request));
    }

    @Test
    void testPurchaseSubscription_InactiveProduct_ThrowsBusinessRuleException() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of());
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        Product inactiveProduct = Product.builder()
                .id(11L)
                .name("Legacy Product")
                .salesPrice(new BigDecimal("50.00"))
                .active(false)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(11L)).thenReturn(Optional.of(inactiveProduct));

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(11L).planId(20L).quantity(2).build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> subscriptionService.purchaseSubscription(request));
        assertTrue(ex.getMessage().contains("inactive"));
    }

    @Test
    void testPurchaseSubscription_InactiveOrUnavailablePlan_ThrowsBusinessRuleException() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of());
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));

        doThrow(new BusinessRuleException("Plan Pro Monthly expired on 2026-10-01"))
                .when(planService).validateProductPlanCompatibility(10L, 20L);

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L).planId(20L).quantity(2).build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> subscriptionService.purchaseSubscription(request));
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    void testPurchaseSubscription_IncompatibleProductPlanMapping_ThrowsBusinessRuleException() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of());
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));

        doThrow(new BusinessRuleException("Invalid combination: Product id 10 is not configured for Plan id 20"))
                .when(planService).validateProductPlanCompatibility(10L, 20L);

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L).planId(20L).quantity(2).build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> subscriptionService.purchaseSubscription(request));
        assertTrue(ex.getMessage().contains("Invalid combination"));
    }

    @Test
    void testPurchaseSubscription_InvalidVariant_ThrowsBusinessRuleException() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of());
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        Product otherProduct = Product.builder().id(99L).name("Other").active(true).build();
        ProductVariant variantOtherProduct = ProductVariant.builder()
                .id(31L)
                .product(otherProduct)
                .name("Wrong Product Variant")
                .active(true)
                .build();

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);
        when(productVariantRepository.findById(31L)).thenReturn(Optional.of(variantOtherProduct));

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L).planId(20L).variantId(31L).quantity(2).build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> subscriptionService.purchaseSubscription(request));
        assertTrue(ex.getMessage().contains("does not belong to product"));
    }

    @Test
    void testPurchaseSubscription_QuantityBelowMinimum_ThrowsBusinessRuleException() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of());
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);

        // samplePlan minimumQuantity is 2
        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L).planId(20L).quantity(1).build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> subscriptionService.purchaseSubscription(request));
        assertTrue(ex.getMessage().contains("less than the plan's minimum required quantity"));
    }

    @Test
    void testPurchaseSubscription_StatusAlwaysConfirmedAndCustomerCannotBeOverridden() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "user@test.com", "pass", Role.CUSTOMER, 1L, List.of());
        when(authService.getCurrentUser()).thenReturn(customerPrincipal);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(planRepository.findById(20L)).thenReturn(Optional.of(samplePlan));
        doNothing().when(planService).validateProductPlanCompatibility(10L, 20L);

        ArgumentCaptor<Subscription> subCaptor = ArgumentCaptor.forClass(Subscription.class);
        when(subscriptionRepository.save(subCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionDto.CustomerPurchaseRequest request = SubscriptionDto.CustomerPurchaseRequest.builder()
                .productId(10L).planId(20L).quantity(2).build();

        subscriptionService.purchaseSubscription(request);

        Subscription saved = subCaptor.getValue();
        // Verify customer is strictly resolved from security context
        assertEquals(1L, saved.getCustomer().getId());
        // Verify status is strictly CONFIRMED (never ACTIVE or DRAFT)
        assertEquals(SubscriptionStatus.CONFIRMED, saved.getStatus());
        // Verify price was snapshotted
        assertEquals(new BigDecimal("120.00"), saved.getAgreedUnitPrice());
        assertEquals(new BigDecimal("240.00"), saved.getSubtotal());
    }
}
