package com.subscription.backend.discount;

import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountRuleRepository discountRuleRepository;

    @Transactional
    public DiscountDto.DiscountResponse createDiscount(DiscountDto.DiscountRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (discountRuleRepository.existsByCode(code)) {
            throw new BusinessRuleException("Discount code '" + code + "' already exists");
        }

        if (request.getEndDate() != null && request.getStartDate() != null &&
                request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessRuleException("End date cannot be before start date");
        }

        DiscountRule rule = DiscountRule.builder()
                .code(code)
                .type(request.getType())
                .value(request.getValue())
                .minPurchaseAmount(request.getMinPurchaseAmount())
                .minQuantity(request.getMinQuantity())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxUsageCount(request.getMaxUsageCount())
                .currentUsageCount(0)
                .targetType(request.getTargetType() != null ? request.getTargetType() : DiscountTarget.ALL)
                .targetProductId(request.getTargetProductId())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        DiscountRule saved = discountRuleRepository.save(rule);
        return toDiscountResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DiscountDto.DiscountResponse> getAllDiscounts(Boolean activeOnly) {
        List<DiscountRule> list = Boolean.TRUE.equals(activeOnly)
                ? discountRuleRepository.findByActive(true)
                : discountRuleRepository.findAll();
        return list.stream().map(this::toDiscountResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiscountDto.DiscountResponse getDiscountById(Long id) {
        DiscountRule rule = discountRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount rule not found with id: " + id));
        return toDiscountResponse(rule);
    }

    @Transactional(readOnly = true)
    public DiscountDto.DiscountResponse getDiscountByCode(String code) {
        DiscountRule rule = discountRuleRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Discount rule not found with code: " + code));
        return toDiscountResponse(rule);
    }

    @Transactional
    public DiscountDto.DiscountResponse updateDiscount(Long id, DiscountDto.DiscountRequest request) {
        DiscountRule rule = discountRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount rule not found with id: " + id));

        String code = request.getCode().trim().toUpperCase();
        if (!rule.getCode().equalsIgnoreCase(code) && discountRuleRepository.existsByCode(code)) {
            throw new BusinessRuleException("Discount code '" + code + "' already exists");
        }

        rule.setCode(code);
        rule.setType(request.getType());
        rule.setValue(request.getValue());
        rule.setMinPurchaseAmount(request.getMinPurchaseAmount());
        rule.setMinQuantity(request.getMinQuantity());
        rule.setStartDate(request.getStartDate());
        rule.setEndDate(request.getEndDate());
        rule.setMaxUsageCount(request.getMaxUsageCount());
        if (request.getTargetType() != null) {
            rule.setTargetType(request.getTargetType());
        }
        rule.setTargetProductId(request.getTargetProductId());
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }

        DiscountRule updated = discountRuleRepository.save(rule);
        return toDiscountResponse(updated);
    }

    public DiscountDto.DiscountResponse toDiscountResponse(DiscountRule rule) {
        return DiscountDto.DiscountResponse.builder()
                .id(rule.getId())
                .code(rule.getCode())
                .type(rule.getType())
                .value(rule.getValue())
                .minPurchaseAmount(rule.getMinPurchaseAmount())
                .minQuantity(rule.getMinQuantity())
                .startDate(rule.getStartDate())
                .endDate(rule.getEndDate())
                .maxUsageCount(rule.getMaxUsageCount())
                .currentUsageCount(rule.getCurrentUsageCount())
                .targetType(rule.getTargetType())
                .targetProductId(rule.getTargetProductId())
                .active(rule.isActive())
                .createdAt(rule.getCreatedAt())
                .build();
    }
}
