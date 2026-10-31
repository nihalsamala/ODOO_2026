package com.subscription.backend.product;

import com.subscription.backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @InjectMocks
    private ProductService productService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = Product.builder()
                .id(1L)
                .name("Cloud Hosting Pro")
                .type(ProductType.SERVICE)
                .salesPrice(new BigDecimal("100.00"))
                .costPrice(new BigDecimal("40.00"))
                .notes("Standard server package")
                .active(true)
                .variants(new ArrayList<>())
                .build();
    }

    @Test
    void testCreateProduct() {
        ProductDto.ProductRequest request = ProductDto.ProductRequest.builder()
                .name("Cloud Hosting Pro")
                .type(ProductType.SERVICE)
                .salesPrice(new BigDecimal("100.00"))
                .costPrice(new BigDecimal("40.00"))
                .notes("Standard server package")
                .active(true)
                .build();

        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductDto.ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Cloud Hosting Pro", response.getName());
        assertEquals(new BigDecimal("100.00"), response.getSalesPrice());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void testGetProductById_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        ProductDto.ProductResponse response = productService.getProductById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Cloud Hosting Pro", response.getName());
    }

    @Test
    void testGetProductById_NotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(99L));
    }

    @Test
    void testAddVariant_CalculatesEffectivePrice() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        ProductVariant savedVariant = ProductVariant.builder()
                .id(10L)
                .product(sampleProduct)
                .name("Extra 16GB RAM")
                .priceAdjustment(new BigDecimal("25.00"))
                .active(true)
                .build();

        when(productVariantRepository.save(any(ProductVariant.class))).thenReturn(savedVariant);

        ProductDto.VariantRequest variantRequest = ProductDto.VariantRequest.builder()
                .name("Extra 16GB RAM")
                .priceAdjustment(new BigDecimal("25.00"))
                .build();

        ProductDto.VariantResponse response = productService.addVariant(1L, variantRequest);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Extra 16GB RAM", response.getName());
        assertEquals(new BigDecimal("25.00"), response.getPriceAdjustment());
        assertEquals(new BigDecimal("125.00"), response.getEffectivePrice()); // 100 + 25 = 125
    }
}
