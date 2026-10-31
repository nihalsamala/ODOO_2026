package com.subscription.backend.discount;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountService discountService;

    @GetMapping
    public ResponseEntity<List<DiscountDto.DiscountResponse>> getAllDiscounts(
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(discountService.getAllDiscounts(activeOnly));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscountDto.DiscountResponse> getDiscountById(@PathVariable Long id) {
        return ResponseEntity.ok(discountService.getDiscountById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<DiscountDto.DiscountResponse> getDiscountByCode(@PathVariable String code) {
        return ResponseEntity.ok(discountService.getDiscountByCode(code));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountDto.DiscountResponse> createDiscount(@Valid @RequestBody DiscountDto.DiscountRequest request) {
        DiscountDto.DiscountResponse response = discountService.createDiscount(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountDto.DiscountResponse> updateDiscount(
            @PathVariable Long id,
            @Valid @RequestBody DiscountDto.DiscountRequest request) {
        return ResponseEntity.ok(discountService.updateDiscount(id, request));
    }
}
