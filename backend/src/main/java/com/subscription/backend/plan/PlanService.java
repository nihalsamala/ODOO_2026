package com.subscription.backend.plan;

import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import com.subscription.backend.product.Product;
import com.subscription.backend.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;
    private final ProductPlanRepository productPlanRepository;
    private final ProductRepository productRepository;

    @Transactional
    public PlanDto.PlanResponse createPlan(PlanDto.PlanRequest request) {
        if (request.getAvailabilityEndDate() != null &&
                request.getAvailabilityEndDate().isBefore(request.getAvailabilityStartDate())) {
            throw new BusinessRuleException("Availability end date cannot be before start date");
        }

        Plan plan = Plan.builder()
                .name(request.getName().trim())
                .price(request.getPrice())
                .billingInterval(request.getBillingInterval())
                .minimumQuantity(request.getMinimumQuantity() != null ? request.getMinimumQuantity() : 1)
                .availabilityStartDate(request.getAvailabilityStartDate())
                .availabilityEndDate(request.getAvailabilityEndDate())
                .lifecycleRule(request.getLifecycleRule())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Plan saved = planRepository.save(plan);
        return toPlanResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PlanDto.PlanResponse> getAllPlans(Boolean activeOnly) {
        List<Plan> plans;
        if (Boolean.TRUE.equals(activeOnly)) {
            plans = planRepository.findByActive(true);
        } else {
            plans = planRepository.findAll();
        }
        return plans.stream().map(this::toPlanResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlanDto.PlanResponse getPlanById(Long id) {
        Plan plan = findPlanEntityById(id);
        return toPlanResponse(plan);
    }

    @Transactional(readOnly = true)
    public Plan findPlanEntityById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + id));
    }

    @Transactional
    public PlanDto.PlanResponse updatePlan(Long id, PlanDto.PlanRequest request) {
        Plan plan = findPlanEntityById(id);

        if (request.getAvailabilityEndDate() != null &&
                request.getAvailabilityEndDate().isBefore(request.getAvailabilityStartDate())) {
            throw new BusinessRuleException("Availability end date cannot be before start date");
        }

        plan.setName(request.getName().trim());
        plan.setPrice(request.getPrice());
        plan.setBillingInterval(request.getBillingInterval());
        if (request.getMinimumQuantity() != null) {
            plan.setMinimumQuantity(request.getMinimumQuantity());
        }
        plan.setAvailabilityStartDate(request.getAvailabilityStartDate());
        plan.setAvailabilityEndDate(request.getAvailabilityEndDate());
        plan.setLifecycleRule(request.getLifecycleRule());
        if (request.getActive() != null) {
            plan.setActive(request.getActive());
        }

        Plan updated = planRepository.save(plan);
        return toPlanResponse(updated);
    }

    // Product-Plan Compatibility
    @Transactional
    public ProductPlanDto.ProductPlanResponse linkProductPlan(ProductPlanDto.ProductPlanRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + request.getPlanId()));

        if (productPlanRepository.existsByProductIdAndPlanId(product.getId(), plan.getId())) {
            throw new BusinessRuleException("Compatibility mapping already exists for Product " + product.getId() + " and Plan " + plan.getId());
        }

        ProductPlan productPlan = ProductPlan.builder()
                .product(product)
                .plan(plan)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        ProductPlan saved = productPlanRepository.save(productPlan);
        return toProductPlanResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductPlanDto.ProductPlanResponse> getAllProductPlans(Boolean activeOnly) {
        List<ProductPlan> mappings;
        if (Boolean.TRUE.equals(activeOnly)) {
            mappings = productPlanRepository.findByActive(true);
        } else {
            mappings = productPlanRepository.findAll();
        }
        return mappings.stream().map(this::toProductPlanResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteProductPlan(Long id) {
        ProductPlan productPlan = productPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductPlan mapping not found with id: " + id));
        productPlanRepository.delete(productPlan);
    }

    @Transactional(readOnly = true)
    public void validateProductPlanCompatibility(Long productId, Long planId) {
        ProductPlan productPlan = productPlanRepository.findByProductIdAndPlanId(productId, planId)
                .orElseThrow(() -> new BusinessRuleException(
                        "Invalid combination: Product id " + productId + " is not configured for Plan id " + planId));

        if (!productPlan.isActive()) {
            throw new BusinessRuleException("The combination of Product id " + productId + " and Plan id " + planId + " is currently inactive");
        }

        Plan plan = productPlan.getPlan();
        if (!plan.isActive()) {
            throw new BusinessRuleException("Plan " + plan.getName() + " is currently inactive");
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(plan.getAvailabilityStartDate())) {
            throw new BusinessRuleException("Plan " + plan.getName() + " is not yet available (starts " + plan.getAvailabilityStartDate() + ")");
        }
        if (plan.getAvailabilityEndDate() != null && today.isAfter(plan.getAvailabilityEndDate())) {
            throw new BusinessRuleException("Plan " + plan.getName() + " expired on " + plan.getAvailabilityEndDate());
        }
    }

    public PlanDto.PlanResponse toPlanResponse(Plan plan) {
        return PlanDto.PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .price(plan.getPrice())
                .billingInterval(plan.getBillingInterval())
                .minimumQuantity(plan.getMinimumQuantity())
                .availabilityStartDate(plan.getAvailabilityStartDate())
                .availabilityEndDate(plan.getAvailabilityEndDate())
                .lifecycleRule(plan.getLifecycleRule())
                .active(plan.isActive())
                .createdAt(plan.getCreatedAt())
                .build();
    }

    public ProductPlanDto.ProductPlanResponse toProductPlanResponse(ProductPlan pp) {
        return ProductPlanDto.ProductPlanResponse.builder()
                .id(pp.getId())
                .productId(pp.getProduct().getId())
                .productName(pp.getProduct().getName())
                .planId(pp.getPlan().getId())
                .planName(pp.getPlan().getName())
                .billingInterval(pp.getPlan().getBillingInterval())
                .planPrice(pp.getPlan().getPrice())
                .active(pp.isActive())
                .createdAt(pp.getCreatedAt())
                .build();
    }
}
