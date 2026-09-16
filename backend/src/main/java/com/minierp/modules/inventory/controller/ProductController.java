package com.minierp.modules.inventory.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.inventory.dto.ProductCreateRequest;
import com.minierp.modules.inventory.dto.ProductResponse;
import com.minierp.modules.inventory.dto.ProductVariantRequest;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ürün kartı ve varyantları başarıyla oluşturuldu", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping("/{id}/variants")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> addVariant(
            @PathVariable Long id,
            @Valid @RequestBody ProductVariantRequest variantRequest) {
        ProductVariantResponse response = productService.addVariantToProduct(id, variantRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ürüne yeni varyant başarıyla eklendi", response));
    }
}
