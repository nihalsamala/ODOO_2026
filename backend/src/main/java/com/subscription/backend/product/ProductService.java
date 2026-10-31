package com.subscription.backend.product;

import com.subscription.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional
    public ProductDto.ProductResponse createProduct(ProductDto.ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName().trim())
                .type(request.getType())
                .salesPrice(request.getSalesPrice())
                .costPrice(request.getCostPrice())
                .notes(request.getNotes())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductDto.VariantRequest vr : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .name(vr.getName().trim())
                        .priceAdjustment(vr.getPriceAdjustment() != null ? vr.getPriceAdjustment() : BigDecimal.ZERO)
                        .active(vr.getActive() != null ? vr.getActive() : true)
                        .build();
                product.addVariant(variant);
            }
        }

        Product saved = productRepository.save(product);
        return toProductResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductDto.ProductResponse> getAllProducts(Boolean activeOnly) {
        List<Product> products;
        if (Boolean.TRUE.equals(activeOnly)) {
            products = productRepository.findByActive(true);
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(this::toProductResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDto.ProductResponse getProductById(Long id) {
        Product product = findProductEntityById(id);
        return toProductResponse(product);
    }

    @Transactional(readOnly = true)
    public Product findProductEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public ProductDto.ProductResponse updateProduct(Long id, ProductDto.ProductRequest request) {
        Product product = findProductEntityById(id);
        product.setName(request.getName().trim());
        product.setType(request.getType());
        product.setSalesPrice(request.getSalesPrice());
        product.setCostPrice(request.getCostPrice());
        product.setNotes(request.getNotes());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updated = productRepository.save(product);
        return toProductResponse(updated);
    }

    @Transactional
    public ProductDto.VariantResponse addVariant(Long productId, ProductDto.VariantRequest request) {
        Product product = findProductEntityById(productId);
        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .name(request.getName().trim())
                .priceAdjustment(request.getPriceAdjustment() != null ? request.getPriceAdjustment() : BigDecimal.ZERO)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        product.addVariant(variant);
        ProductVariant saved = productVariantRepository.save(variant);
        return toVariantResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductDto.VariantResponse> getVariantsByProductId(Long productId, Boolean activeOnly) {
        findProductEntityById(productId); // Ensure product exists
        List<ProductVariant> variants;
        if (Boolean.TRUE.equals(activeOnly)) {
            variants = productVariantRepository.findByProductIdAndActive(productId, true);
        } else {
            variants = productVariantRepository.findByProductId(productId);
        }
        return variants.stream().map(this::toVariantResponse).collect(Collectors.toList());
    }

    @Transactional
    public ProductDto.VariantResponse updateVariant(Long productId, Long variantId, ProductDto.VariantRequest request) {
        findProductEntityById(productId); // Ensure product exists
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Variant id " + variantId + " does not belong to product " + productId);
        }

        variant.setName(request.getName().trim());
        if (request.getPriceAdjustment() != null) {
            variant.setPriceAdjustment(request.getPriceAdjustment());
        }
        if (request.getActive() != null) {
            variant.setActive(request.getActive());
        }

        ProductVariant updated = productVariantRepository.save(variant);
        return toVariantResponse(updated);
    }

    public ProductDto.ProductResponse toProductResponse(Product product) {
        List<ProductDto.VariantResponse> variantResponses = product.getVariants() != null
                ? product.getVariants().stream().map(this::toVariantResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return ProductDto.ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .type(product.getType())
                .salesPrice(product.getSalesPrice())
                .costPrice(product.getCostPrice())
                .notes(product.getNotes())
                .active(product.isActive())
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .build();
    }

    public ProductDto.VariantResponse toVariantResponse(ProductVariant variant) {
        BigDecimal basePrice = variant.getProduct() != null ? variant.getProduct().getSalesPrice() : BigDecimal.ZERO;
        BigDecimal adjustment = variant.getPriceAdjustment() != null ? variant.getPriceAdjustment() : BigDecimal.ZERO;
        return ProductDto.VariantResponse.builder()
                .id(variant.getId())
                .productId(variant.getProduct() != null ? variant.getProduct().getId() : null)
                .name(variant.getName())
                .priceAdjustment(adjustment)
                .effectivePrice(basePrice.add(adjustment))
                .active(variant.isActive())
                .build();
    }
}
