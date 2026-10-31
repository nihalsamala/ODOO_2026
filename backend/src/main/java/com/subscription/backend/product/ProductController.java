package com.subscription.backend.product;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto.ProductResponse>> getAllProducts(
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(productService.getAllProducts(activeOnly));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto.ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductDto.ProductResponse> createProduct(
            @Valid @RequestBody ProductDto.ProductRequest request) {
        ProductDto.ProductResponse response = productService.createProduct(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto.ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDto.ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @GetMapping("/{id}/variants")
    public ResponseEntity<List<ProductDto.VariantResponse>> getVariants(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean activeOnly) {
        return ResponseEntity.ok(productService.getVariantsByProductId(id, activeOnly));
    }

    @PostMapping("/{id}/variants")
    public ResponseEntity<ProductDto.VariantResponse> addVariant(
            @PathVariable Long id,
            @Valid @RequestBody ProductDto.VariantRequest request) {
        ProductDto.VariantResponse response = productService.addVariant(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/variants/{variantId}")
    public ResponseEntity<ProductDto.VariantResponse> updateVariant(
            @PathVariable Long id,
            @PathVariable Long variantId,
            @Valid @RequestBody ProductDto.VariantRequest request) {
        return ResponseEntity.ok(productService.updateVariant(id, variantId, request));
    }
}
