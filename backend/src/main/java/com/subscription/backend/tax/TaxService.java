package com.subscription.backend.tax;

import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxService {

    private final TaxRuleRepository taxRuleRepository;

    @Transactional
    public TaxDto.TaxResponse createTaxRule(TaxDto.TaxRequest request) {
        if (taxRuleRepository.findByName(request.getName().trim()).isPresent()) {
            throw new BusinessRuleException("A tax rule with name '" + request.getName() + "' already exists");
        }

        TaxRule taxRule = TaxRule.builder()
                .name(request.getName().trim())
                .rate(request.getRate())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        TaxRule saved = taxRuleRepository.save(taxRule);
        return toTaxResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TaxDto.TaxResponse> getAllTaxes(Boolean activeOnly) {
        List<TaxRule> taxes = Boolean.TRUE.equals(activeOnly)
                ? taxRuleRepository.findByActive(true)
                : taxRuleRepository.findAll();
        return taxes.stream().map(this::toTaxResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxDto.TaxResponse getTaxById(Long id) {
        TaxRule rule = taxRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tax rule not found with id: " + id));
        return toTaxResponse(rule);
    }

    @Transactional
    public TaxDto.TaxResponse updateTaxRule(Long id, TaxDto.TaxRequest request) {
        TaxRule rule = taxRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tax rule not found with id: " + id));

        rule.setName(request.getName().trim());
        rule.setRate(request.getRate());
        if (request.getActive() != null) {
            rule.setActive(request.getActive());
        }

        TaxRule updated = taxRuleRepository.save(rule);
        return toTaxResponse(updated);
    }

    public TaxDto.TaxResponse toTaxResponse(TaxRule rule) {
        return TaxDto.TaxResponse.builder()
                .id(rule.getId())
                .name(rule.getName())
                .rate(rule.getRate())
                .active(rule.isActive())
                .createdAt(rule.getCreatedAt())
                .build();
    }
}
