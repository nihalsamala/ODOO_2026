package com.subscription.backend.plan;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-plans")
@RequiredArgsConstructor
public class ProductPlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<List<ProductPlanDto.ProductPlanResponse>> getAllProductPlans(
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(planService.getAllProductPlans(activeOnly));
    }

    @PostMapping
    public ResponseEntity<ProductPlanDto.ProductPlanResponse> linkProductPlan(
            @Valid @RequestBody ProductPlanDto.ProductPlanRequest request) {
        ProductPlanDto.ProductPlanResponse response = planService.linkProductPlan(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProductPlan(@PathVariable Long id) {
        planService.deleteProductPlan(id);
        return ResponseEntity.noContent().build();
    }
}
