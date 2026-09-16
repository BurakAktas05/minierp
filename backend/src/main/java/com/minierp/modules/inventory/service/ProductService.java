package com.minierp.modules.inventory.service;

import com.minierp.modules.inventory.dto.ProductCreateRequest;
import com.minierp.modules.inventory.dto.ProductResponse;
import com.minierp.modules.inventory.dto.ProductVariantRequest;
import com.minierp.modules.inventory.dto.ProductVariantResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductCreateRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Long id);

    ProductVariantResponse addVariantToProduct(Long productId, ProductVariantRequest variantRequest);
}
