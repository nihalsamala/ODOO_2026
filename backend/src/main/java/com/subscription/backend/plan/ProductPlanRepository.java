package com.subscription.backend.plan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductPlanRepository extends JpaRepository<ProductPlan, Long> {
    Optional<ProductPlan> findByProductIdAndPlanId(Long productId, Long planId);
    boolean existsByProductIdAndPlanId(Long productId, Long planId);
    boolean existsByProductIdAndPlanIdAndActive(Long productId, Long planId, boolean active);
    List<ProductPlan> findByProductId(Long productId);
    List<ProductPlan> findByPlanId(Long planId);
    List<ProductPlan> findByActive(boolean active);
}
