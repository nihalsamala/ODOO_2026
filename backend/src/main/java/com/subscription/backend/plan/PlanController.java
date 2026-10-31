package com.subscription.backend.plan;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<List<PlanDto.PlanResponse>> getAllPlans(
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(planService.getAllPlans(activeOnly));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanDto.PlanResponse> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(planService.getPlanById(id));
    }

    @PostMapping
    public ResponseEntity<PlanDto.PlanResponse> createPlan(
            @Valid @RequestBody PlanDto.PlanRequest request) {
        PlanDto.PlanResponse response = planService.createPlan(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanDto.PlanResponse> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody PlanDto.PlanRequest request) {
        return ResponseEntity.ok(planService.updatePlan(id, request));
    }
}
