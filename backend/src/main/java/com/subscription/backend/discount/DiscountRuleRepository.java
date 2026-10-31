package com.subscription.backend.discount;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Long> {
    Optional<DiscountRule> findByCode(String code);
    boolean existsByCode(String code);
    List<DiscountRule> findByActive(boolean active);
}
