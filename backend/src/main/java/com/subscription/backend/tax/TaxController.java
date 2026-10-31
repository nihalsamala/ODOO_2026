package com.subscription.backend.tax;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taxes")
@RequiredArgsConstructor
public class TaxController {

    private final TaxService taxService;

    @GetMapping
    public ResponseEntity<List<TaxDto.TaxResponse>> getAllTaxes(
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(taxService.getAllTaxes(activeOnly));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaxDto.TaxResponse> getTaxById(@PathVariable Long id) {
        return ResponseEntity.ok(taxService.getTaxById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxDto.TaxResponse> createTaxRule(@Valid @RequestBody TaxDto.TaxRequest request) {
        TaxDto.TaxResponse response = taxService.createTaxRule(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxDto.TaxResponse> updateTaxRule(
            @PathVariable Long id,
            @Valid @RequestBody TaxDto.TaxRequest request) {
        return ResponseEntity.ok(taxService.updateTaxRule(id, request));
    }
}
