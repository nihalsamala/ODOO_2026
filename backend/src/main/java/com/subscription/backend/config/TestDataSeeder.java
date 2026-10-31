package com.subscription.backend.config;

import com.subscription.backend.auth.User;
import com.subscription.backend.auth.UserRepository;
import com.subscription.backend.customer.Customer;
import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.discount.DiscountRule;
import com.subscription.backend.discount.DiscountRuleRepository;
import com.subscription.backend.discount.DiscountTarget;
import com.subscription.backend.discount.DiscountType;
import com.subscription.backend.invoice.Invoice;
import com.subscription.backend.invoice.InvoiceLine;
import com.subscription.backend.invoice.InvoiceRepository;
import com.subscription.backend.invoice.InvoiceStatus;
import com.subscription.backend.payment.Payment;
import com.subscription.backend.payment.PaymentMethod;
import com.subscription.backend.payment.PaymentRepository;
import com.subscription.backend.plan.*;
import com.subscription.backend.product.*;
import com.subscription.backend.security.Role;
import com.subscription.backend.subscription.Subscription;
import com.subscription.backend.subscription.SubscriptionRepository;
import com.subscription.backend.subscription.SubscriptionStatus;
import com.subscription.backend.tax.TaxRule;
import com.subscription.backend.tax.TaxRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class TestDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PlanRepository planRepository;
    private final ProductPlanRepository productPlanRepository;
    private final DiscountRuleRepository discountRuleRepository;
    private final TaxRuleRepository taxRuleRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking SubscriptIQ realistic test dataset...");
        seedUsersAndCustomers();
        seedProductsAndVariants();
        seedPlans();
        seedProductPlanCompatibilities();
        seedDiscountRules();
        seedTaxRules();
        seedSubscriptions();
        seedInvoicesAndPayments();
        log.info("SubscriptIQ test dataset verification and seeding complete.");
    }

    private void seedUsersAndCustomers() {
        // Staff 2
        if (!userRepository.existsByEmail("staff2@subscriptiq.com")) {
            User staff2 = User.builder()
                    .email("staff2@subscriptiq.com")
                    .password(passwordEncoder.encode("Staff@123"))
                    .fullName("Operations Lead (Priya Sharma)")
                    .role(Role.STAFF)
                    .enabled(true)
                    .build();
            userRepository.save(staff2);
            log.info("Seeded staff member: staff2@subscriptiq.com");
        }

        // Fictional Customers & associated portal users
        createCustomerWithUser("Acme Cloud Corp", "user@subscriptiq.com", "+1 555-0101", "100 Innovation Way, San Francisco, CA");
        createCustomerWithUser("Acro Industries", "r.gupta@acroindustries.com", "+91 98765 43210", "Plot 42, Electronics City, Bangalore, India");
        createCustomerWithUser("NovaTech Solutions", "elena.vance@novatech.co", "+1 555-0188", "742 Evergreen Terrace, Austin, TX");
        createCustomerWithUser("QuantumScale Labs", "billing@quantumscale.io", "+44 20 7946 0912", "10 Finsbury Square, London, UK");
        createCustomerWithUser("Apex Global Logistics", "finance@apexlogistics.com", "+1 555-0144", "500 Harbour Blvd, Seattle, WA");
        createCustomerWithUser("Zenith Digital Media", "accounts@zenithmedia.net", "+1 555-0177", "350 Fifth Avenue, New York, NY");
    }

    private Customer createCustomerWithUser(String name, String email, String phone, String address) {
        Customer customer = customerRepository.findByEmail(email).orElseGet(() -> {
            Customer c = Customer.builder()
                    .name(name)
                    .email(email)
                    .phone(phone)
                    .address(address)
                    .build();
            return customerRepository.save(c);
        });

        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("User@123"))
                    .fullName(name)
                    .role(Role.CUSTOMER)
                    .customerId(customer.getId())
                    .enabled(true)
                    .build();
            user = userRepository.save(user);

            customer.setUserId(user.getId());
            customer = customerRepository.save(customer);
            log.info("Seeded customer & portal user: {} ({})", name, email);
        } else if (customer.getUserId() == null) {
            final Customer targetCust = customer;
            userRepository.findByEmail(email).ifPresent(u -> {
                targetCust.setUserId(u.getId());
                customerRepository.save(targetCust);
            });
        }
        return customer;
    }

    private void seedProductsAndVariants() {
        createProductWithVariants(
                "Cloud Storage Engine",
                ProductType.DIGITAL,
                new BigDecimal("120.00"),
                new BigDecimal("40.00"),
                "High availability S3-compatible enterprise object storage with automated failover",
                List.of(
                        new VariantData("Multi-Region Geo-Replication", new BigDecimal("50.00")),
                        new VariantData("Cold Archival Tier", new BigDecimal("-30.00"))
                )
        );

        createProductWithVariants(
                "Project Management Suite",
                ProductType.SERVICE,
                new BigDecimal("250.00"),
                new BigDecimal("80.00"),
                "Agile sprint planning, Gantt charts, resource allocation, and issue tracking",
                List.of(
                        new VariantData("Unlimited Automations & Integrations", new BigDecimal("75.00")),
                        new VariantData("HIPAA & SOC-2 Compliance Pack", new BigDecimal("120.00"))
                )
        );

        createProductWithVariants(
                "Enterprise Analytics Platform",
                ProductType.DIGITAL,
                new BigDecimal("400.00"),
                new BigDecimal("150.00"),
                "Real-time stream processing, BI dashboards, and predictive forecasting engine",
                List.of(
                        new VariantData("AI Predictive Analytics Add-on", new BigDecimal("180.00")),
                        new VariantData("Dedicated BI Compute Node", new BigDecimal("250.00"))
                )
        );

        createProductWithVariants(
                "Premium 24/7 SLA Support",
                ProductType.SERVICE,
                new BigDecimal("300.00"),
                new BigDecimal("100.00"),
                "15-minute response time SLA with dedicated technical account manager",
                List.of(
                        new VariantData("Dedicated TAM & Weekend Escalations", new BigDecimal("150.00"))
                )
        );

        createProductWithVariants(
                "Team Collaboration & Chat Hub",
                ProductType.DIGITAL,
                new BigDecimal("150.00"),
                new BigDecimal("45.00"),
                "End-to-end encrypted messaging, video conferencing, and interactive screen sharing",
                List.of(
                        new VariantData("Enterprise Recording & Archiving", new BigDecimal("60.00"))
                )
        );

        createProductWithVariants(
                "Hardware Security Key Bundle",
                ProductType.PHYSICAL,
                new BigDecimal("85.00"),
                new BigDecimal("35.00"),
                "FIDO2/WebAuthn compliant hardware security keys for zero-trust MFA",
                List.of()
        );
    }

    private static record VariantData(String name, BigDecimal priceAdjustment) {}

    private void createProductWithVariants(String name, ProductType type, BigDecimal salesPrice, BigDecimal costPrice, String notes, List<VariantData> variants) {
        if (!productRepository.existsByName(name)) {
            Product product = Product.builder()
                    .name(name)
                    .type(type)
                    .salesPrice(salesPrice)
                    .costPrice(costPrice)
                    .notes(notes)
                    .active(true)
                    .build();

            for (VariantData vd : variants) {
                ProductVariant variant = ProductVariant.builder()
                        .name(vd.name())
                        .priceAdjustment(vd.priceAdjustment())
                        .active(true)
                        .build();
                product.addVariant(variant);
            }

            productRepository.save(product);
            log.info("Seeded product: {} with {} variants", name, variants.size());
        }
    }

    private void seedPlans() {
        createPlan("Starter Monthly Plan", new BigDecimal("0.00"), BillingInterval.MONTHLY, 1, LifecycleRule.AUTO_RENEW);
        createPlan("Growth Monthly Plan", new BigDecimal("50.00"), BillingInterval.MONTHLY, 1, LifecycleRule.AUTO_RENEW);
        createPlan("Enterprise Annual Plan", new BigDecimal("450.00"), BillingInterval.YEARLY, 5, LifecycleRule.AUTO_RENEW);
        createPlan("Weekly Fast-Track Sprint", new BigDecimal("25.00"), BillingInterval.WEEKLY, 1, LifecycleRule.AUTO_CLOSE);
        createPlan("Fixed-Term Pilot Plan", new BigDecimal("100.00"), BillingInterval.MONTHLY, 1, LifecycleRule.MANUAL_RENEWAL);
    }

    private void createPlan(String name, BigDecimal price, BillingInterval interval, int minQty, LifecycleRule lifecycleRule) {
        if (!planRepository.existsByName(name)) {
            Plan plan = Plan.builder()
                    .name(name)
                    .price(price)
                    .billingInterval(interval)
                    .minimumQuantity(minQty)
                    .availabilityStartDate(LocalDate.of(2025, 1, 1))
                    .availabilityEndDate(LocalDate.of(2030, 12, 31))
                    .lifecycleRule(lifecycleRule)
                    .active(true)
                    .build();
            planRepository.save(plan);
            log.info("Seeded plan: {} ({})", name, interval);
        }
    }

    private void seedProductPlanCompatibilities() {
        mapProductToPlan("Cloud Storage Engine", "Starter Monthly Plan");
        mapProductToPlan("Cloud Storage Engine", "Growth Monthly Plan");
        mapProductToPlan("Cloud Storage Engine", "Enterprise Annual Plan");

        mapProductToPlan("Project Management Suite", "Starter Monthly Plan");
        mapProductToPlan("Project Management Suite", "Growth Monthly Plan");
        mapProductToPlan("Project Management Suite", "Enterprise Annual Plan");
        mapProductToPlan("Project Management Suite", "Weekly Fast-Track Sprint");

        mapProductToPlan("Enterprise Analytics Platform", "Growth Monthly Plan");
        mapProductToPlan("Enterprise Analytics Platform", "Enterprise Annual Plan");
        mapProductToPlan("Enterprise Analytics Platform", "Fixed-Term Pilot Plan");

        mapProductToPlan("Premium 24/7 SLA Support", "Starter Monthly Plan");
        mapProductToPlan("Premium 24/7 SLA Support", "Growth Monthly Plan");
        mapProductToPlan("Premium 24/7 SLA Support", "Enterprise Annual Plan");

        mapProductToPlan("Team Collaboration & Chat Hub", "Starter Monthly Plan");
        mapProductToPlan("Team Collaboration & Chat Hub", "Growth Monthly Plan");
        mapProductToPlan("Team Collaboration & Chat Hub", "Enterprise Annual Plan");

        mapProductToPlan("Hardware Security Key Bundle", "Starter Monthly Plan");
        mapProductToPlan("Hardware Security Key Bundle", "Fixed-Term Pilot Plan");
    }

    private void mapProductToPlan(String productName, String planName) {
        Product product = productRepository.findByName(productName).orElse(null);
        Plan plan = planRepository.findByName(planName).orElse(null);
        if (product != null && plan != null) {
            if (!productPlanRepository.existsByProductIdAndPlanId(product.getId(), plan.getId())) {
                ProductPlan pp = ProductPlan.builder()
                        .product(product)
                        .plan(plan)
                        .active(true)
                        .build();
                productPlanRepository.save(pp);
            }
        }
    }

    private void seedDiscountRules() {
        createDiscountRule("WELCOME10", DiscountType.PERCENTAGE, new BigDecimal("10.00"), null, null, null, null, null, DiscountTarget.ALL);
        createDiscountRule("SAVE50FIXED", DiscountType.FIXED, new BigDecimal("50.00"), new BigDecimal("200.00"), null, null, null, null, DiscountTarget.ALL);
        createDiscountRule("VOLUME20", DiscountType.PERCENTAGE, new BigDecimal("20.00"), new BigDecimal("500.00"), 5, null, null, null, DiscountTarget.SUBSCRIPTION);
        createDiscountRule("HACKATHON2026", DiscountType.PERCENTAGE, new BigDecimal("15.00"), null, null, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), 100, DiscountTarget.ALL);
    }

    private void createDiscountRule(String code, DiscountType type, BigDecimal value, BigDecimal minPurchase, Integer minQty,
                                     LocalDate start, LocalDate end, Integer maxUsage, DiscountTarget target) {
        if (!discountRuleRepository.existsByCode(code)) {
            DiscountRule rule = DiscountRule.builder()
                    .code(code)
                    .type(type)
                    .value(value)
                    .minPurchaseAmount(minPurchase)
                    .minQuantity(minQty)
                    .startDate(start)
                    .endDate(end)
                    .maxUsageCount(maxUsage)
                    .targetType(target)
                    .active(true)
                    .build();
            discountRuleRepository.save(rule);
            log.info("Seeded discount rule: {}", code);
        }
    }

    private void seedTaxRules() {
        createTaxRule("Standard VAT (10%)", new BigDecimal("10.00"));
        createTaxRule("State Sales Tax (8.25%)", new BigDecimal("8.25"));
        createTaxRule("GST Services (18%)", new BigDecimal("18.00"));
        createTaxRule("Zero-Rated Export (0%)", new BigDecimal("0.00"));
    }

    private void createTaxRule(String name, BigDecimal rate) {
        if (!taxRuleRepository.existsByName(name)) {
            TaxRule rule = TaxRule.builder()
                    .name(name)
                    .rate(rate)
                    .active(true)
                    .build();
            taxRuleRepository.save(rule);
            log.info("Seeded tax rule: {} ({}%)", name, rate);
        }
    }

    private void seedSubscriptions() {
        Customer acme = customerRepository.findByEmail("user@subscriptiq.com").orElse(null);
        Customer acro = customerRepository.findByEmail("r.gupta@acroindustries.com").orElse(null);
        Customer nova = customerRepository.findByEmail("elena.vance@novatech.co").orElse(null);
        Customer quantum = customerRepository.findByEmail("billing@quantumscale.io").orElse(null);
        Customer apex = customerRepository.findByEmail("finance@apexlogistics.com").orElse(null);
        Customer zenith = customerRepository.findByEmail("accounts@zenithmedia.net").orElse(null);

        Product cloudStorage = productRepository.findByName("Cloud Storage Engine").orElse(null);
        Product pmSuite = productRepository.findByName("Project Management Suite").orElse(null);
        Product analytics = productRepository.findByName("Enterprise Analytics Platform").orElse(null);
        Product support = productRepository.findByName("Premium 24/7 SLA Support").orElse(null);
        Product collab = productRepository.findByName("Team Collaboration & Chat Hub").orElse(null);

        Plan starterPlan = planRepository.findByName("Starter Monthly Plan").orElse(null);
        Plan growthPlan = planRepository.findByName("Growth Monthly Plan").orElse(null);
        Plan enterprisePlan = planRepository.findByName("Enterprise Annual Plan").orElse(null);
        Plan weeklyPlan = planRepository.findByName("Weekly Fast-Track Sprint").orElse(null);

        // 1. SUB-2026-1001 (ACTIVE)
        if (acme != null && cloudStorage != null && growthPlan != null) {
            ProductVariant variant = cloudStorage.getVariants().stream()
                    .filter(v -> v.getName().contains("Multi-Region")).findFirst().orElse(null);
            createSubscription(
                    "SUB-2026-1001",
                    acme,
                    cloudStorage,
                    variant,
                    growthPlan,
                    2,
                    LocalDate.of(2026, 9, 1),
                    null,
                    LocalDate.of(2026, 11, 1),
                    new BigDecimal("220.00"),
                    new BigDecimal("440.00"),
                    SubscriptionStatus.ACTIVE,
                    null
            );
        }

        // 2. SUB-2026-1002 (CONFIRMED)
        if (acro != null && pmSuite != null && growthPlan != null) {
            ProductVariant variant = pmSuite.getVariants().stream()
                    .filter(v -> v.getName().contains("Unlimited Automations")).findFirst().orElse(null);
            createSubscription(
                    "SUB-2026-1002",
                    acro,
                    pmSuite,
                    variant,
                    growthPlan,
                    3,
                    LocalDate.of(2026, 10, 15),
                    null,
                    LocalDate.of(2026, 11, 15),
                    new BigDecimal("375.00"),
                    new BigDecimal("1125.00"),
                    SubscriptionStatus.CONFIRMED,
                    null
            );
        }

        // 3. SUB-2026-1003 (ACTIVE - Annual high value)
        if (nova != null && analytics != null && enterprisePlan != null) {
            ProductVariant variant = analytics.getVariants().stream()
                    .filter(v -> v.getName().contains("Dedicated BI")).findFirst().orElse(null);
            createSubscription(
                    "SUB-2026-1003",
                    nova,
                    analytics,
                    variant,
                    enterprisePlan,
                    5,
                    LocalDate.of(2026, 1, 1),
                    null,
                    LocalDate.of(2027, 1, 1),
                    new BigDecimal("1100.00"),
                    new BigDecimal("5500.00"),
                    SubscriptionStatus.ACTIVE,
                    null
            );
        }

        // 4. SUB-2026-1004 (PAUSED)
        if (quantum != null && collab != null && starterPlan != null) {
            createSubscription(
                    "SUB-2026-1004",
                    quantum,
                    collab,
                    null,
                    starterPlan,
                    10,
                    LocalDate.of(2026, 8, 1),
                    null,
                    LocalDate.of(2026, 11, 1),
                    new BigDecimal("150.00"),
                    new BigDecimal("1500.00"),
                    SubscriptionStatus.PAUSED,
                    LocalDate.of(2026, 10, 10)
            );
        }

        // 5. SUB-2026-1005 (DRAFT Quotation)
        if (apex != null && support != null && starterPlan != null) {
            createSubscription(
                    "SUB-2026-1005",
                    apex,
                    support,
                    null,
                    starterPlan,
                    1,
                    LocalDate.of(2026, 11, 1),
                    null,
                    LocalDate.of(2026, 11, 1),
                    new BigDecimal("300.00"),
                    new BigDecimal("300.00"),
                    SubscriptionStatus.DRAFT,
                    null
            );
        }

        // 6. SUB-2026-1006 (CLOSED)
        if (zenith != null && cloudStorage != null && weeklyPlan != null) {
            createSubscription(
                    "SUB-2026-1006",
                    zenith,
                    cloudStorage,
                    null,
                    weeklyPlan,
                    1,
                    LocalDate.of(2026, 9, 1),
                    LocalDate.of(2026, 10, 1),
                    LocalDate.of(2026, 10, 1),
                    new BigDecimal("145.00"),
                    new BigDecimal("145.00"),
                    SubscriptionStatus.CLOSED,
                    null
            );
        }
    }

    private void createSubscription(String subNumber, Customer customer, Product product, ProductVariant variant, Plan plan,
                                    int qty, LocalDate start, LocalDate expiry, LocalDate nextBilling, BigDecimal unitPrice,
                                    BigDecimal subtotal, SubscriptionStatus status, LocalDate pausedAt) {
        if (!subscriptionRepository.existsBySubscriptionNumber(subNumber)) {
            Subscription sub = Subscription.builder()
                    .subscriptionNumber(subNumber)
                    .customer(customer)
                    .product(product)
                    .variant(variant)
                    .plan(plan)
                    .quantity(qty)
                    .startDate(start)
                    .expiryDate(expiry)
                    .nextBillingDate(nextBilling)
                    .agreedUnitPrice(unitPrice)
                    .subtotal(subtotal)
                    .status(status)
                    .pausedAt(pausedAt)
                    .build();
            subscriptionRepository.save(sub);
            log.info("Seeded subscription: {} ({}) for {}", subNumber, status, customer.getName());
        }
    }

    private void seedInvoicesAndPayments() {
        Subscription sub1 = subscriptionRepository.findBySubscriptionNumber("SUB-2026-1001").orElse(null);
        Subscription sub2 = subscriptionRepository.findBySubscriptionNumber("SUB-2026-1002").orElse(null);
        Subscription sub3 = subscriptionRepository.findBySubscriptionNumber("SUB-2026-1003").orElse(null);
        Subscription sub4 = subscriptionRepository.findBySubscriptionNumber("SUB-2026-1004").orElse(null);

        // 1. INV-2026-1001 - PAID
        if (sub1 != null) {
            Invoice inv1 = createInvoice(
                    "INV-2026-1001",
                    sub1,
                    "2026-09-01 to 2026-09-30",
                    LocalDate.of(2026, 9, 1),
                    LocalDate.of(2026, 9, 30),
                    LocalDate.of(2026, 9, 1),
                    LocalDate.of(2026, 9, 16),
                    new BigDecimal("440.00"),
                    new BigDecimal("440.00"),
                    BigDecimal.ZERO,
                    InvoiceStatus.PAID,
                    "Cloud Storage Engine (Multi-Region Geo-Replication) - Growth Monthly Plan (MONTHLY)",
                    2,
                    new BigDecimal("220.00")
            );

            createPayment(
                    "PAY-2026-1001",
                    inv1,
                    new BigDecimal("440.00"),
                    PaymentMethod.CREDIT_CARD,
                    LocalDate.of(2026, 9, 5),
                    "Full payment via Corporate Visa card ending in 4242"
            );
        }

        // 2. INV-2026-1002 - PARTIALLY PAID
        if (sub2 != null) {
            Invoice inv2 = createInvoice(
                    "INV-2026-1002",
                    sub2,
                    "2026-10-15 to 2026-11-14",
                    LocalDate.of(2026, 10, 15),
                    LocalDate.of(2026, 11, 14),
                    LocalDate.of(2026, 10, 15),
                    LocalDate.of(2026, 10, 30),
                    new BigDecimal("1125.00"),
                    new BigDecimal("600.00"),
                    new BigDecimal("525.00"),
                    InvoiceStatus.PARTIALLY_PAID,
                    "Project Management Suite (Unlimited Automations & Integrations) - Growth Monthly Plan (MONTHLY)",
                    3,
                    new BigDecimal("375.00")
            );

            createPayment(
                    "PAY-2026-1002",
                    inv2,
                    new BigDecimal("600.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.of(2026, 10, 20),
                    "Partial wire transfer deposit Ref #WIRE-98214"
            );
        }

        // 3. INV-2026-1003 - PAID (Annual high value)
        if (sub3 != null) {
            Invoice inv3 = createInvoice(
                    "INV-2026-1003",
                    sub3,
                    "2026-01-01 to 2026-12-31",
                    LocalDate.of(2026, 1, 1),
                    LocalDate.of(2026, 12, 31),
                    LocalDate.of(2026, 1, 1),
                    LocalDate.of(2026, 1, 16),
                    new BigDecimal("5500.00"),
                    new BigDecimal("5500.00"),
                    BigDecimal.ZERO,
                    InvoiceStatus.PAID,
                    "Enterprise Analytics Platform (Dedicated BI Compute Node) - Enterprise Annual Plan (YEARLY)",
                    5,
                    new BigDecimal("1100.00")
            );

            createPayment(
                    "PAY-2026-1003",
                    inv3,
                    new BigDecimal("5500.00"),
                    PaymentMethod.BANK_TRANSFER,
                    LocalDate.of(2026, 1, 5),
                    "Annual upfront settlement Ref #ACH-884102"
            );
        }

        // 4. INV-2026-1004 - OVERDUE (CONFIRMED, past due date, unpaid)
        if (sub4 != null) {
            createInvoice(
                    "INV-2026-1004",
                    sub4,
                    "2026-09-01 to 2026-09-30",
                    LocalDate.of(2026, 9, 1),
                    LocalDate.of(2026, 9, 30),
                    LocalDate.of(2026, 9, 1),
                    LocalDate.of(2026, 9, 16),
                    new BigDecimal("1500.00"),
                    BigDecimal.ZERO,
                    new BigDecimal("1500.00"),
                    InvoiceStatus.CONFIRMED,
                    "Team Collaboration & Chat Hub - Starter Monthly Plan (MONTHLY)",
                    10,
                    new BigDecimal("150.00")
            );
        }

        // 5. INV-2026-1005 - DRAFT (New upcoming period)
        if (sub1 != null) {
            createInvoice(
                    "INV-2026-1005",
                    sub1,
                    "2026-10-01 to 2026-10-31",
                    LocalDate.of(2026, 10, 1),
                    LocalDate.of(2026, 10, 31),
                    LocalDate.of(2026, 10, 1),
                    LocalDate.of(2026, 10, 16),
                    new BigDecimal("440.00"),
                    BigDecimal.ZERO,
                    new BigDecimal("440.00"),
                    InvoiceStatus.DRAFT,
                    "Cloud Storage Engine (Multi-Region Geo-Replication) - Growth Monthly Plan (MONTHLY)",
                    2,
                    new BigDecimal("220.00")
            );
        }

        // 6. INV-2026-1006 - CONFIRMED (Current active, not overdue)
        if (sub2 != null) {
            createInvoice(
                    "INV-2026-1006",
                    sub2,
                    "2026-11-15 to 2026-12-14",
                    LocalDate.of(2026, 11, 15),
                    LocalDate.of(2026, 12, 14),
                    LocalDate.of(2026, 10, 31),
                    LocalDate.of(2026, 11, 15),
                    new BigDecimal("1125.00"),
                    BigDecimal.ZERO,
                    new BigDecimal("1125.00"),
                    InvoiceStatus.CONFIRMED,
                    "Project Management Suite (Unlimited Automations & Integrations) - Growth Monthly Plan (MONTHLY)",
                    3,
                    new BigDecimal("375.00")
            );
        }
    }

    private Invoice createInvoice(String invoiceNumber, Subscription subscription, String billingPeriod,
                                  LocalDate periodStart, LocalDate periodEnd, LocalDate issueDate, LocalDate dueDate,
                                  BigDecimal total, BigDecimal amountPaid, BigDecimal outstanding,
                                  InvoiceStatus status, String lineDescription, int lineQty, BigDecimal lineUnitPrice) {
        if (invoiceRepository.existsByInvoiceNumber(invoiceNumber)) {
            return invoiceRepository.findByInvoiceNumber(invoiceNumber).orElse(null);
        }

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .subscription(subscription)
                .customer(subscription.getCustomer())
                .billingPeriod(billingPeriod)
                .billingPeriodStart(periodStart)
                .billingPeriodEnd(periodEnd)
                .issueDate(issueDate)
                .dueDate(dueDate)
                .subtotal(total)
                .discountAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .total(total)
                .amountPaid(amountPaid)
                .outstandingBalance(outstanding)
                .status(status)
                .invoiceLines(new ArrayList<>())
                .build();

        InvoiceLine line = InvoiceLine.builder()
                .invoice(invoice)
                .description(lineDescription)
                .quantity(lineQty)
                .unitPrice(lineUnitPrice)
                .discountAmount(BigDecimal.ZERO)
                .taxRate(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .lineTotal(total)
                .build();

        invoice.addLine(line);
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Seeded invoice: {} ({}) for {}", invoiceNumber, status, subscription.getCustomer().getName());
        return saved;
    }

    private void createPayment(String paymentNumber, Invoice invoice, BigDecimal amount, PaymentMethod method, LocalDate date, String note) {
        if (invoice != null && !paymentRepository.existsByPaymentNumber(paymentNumber)) {
            Payment payment = Payment.builder()
                    .paymentNumber(paymentNumber)
                    .invoice(invoice)
                    .amount(amount)
                    .paymentMethod(method)
                    .paymentDate(date)
                    .note(note)
                    .build();
            paymentRepository.save(payment);
            log.info("Seeded payment: {} of ${} for invoice {}", paymentNumber, amount, invoice.getInvoiceNumber());
        }
    }
}
