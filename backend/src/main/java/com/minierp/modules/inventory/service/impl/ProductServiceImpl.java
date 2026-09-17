package com.minierp.modules.inventory.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.inventory.dto.ProductCreateRequest;
import com.minierp.modules.inventory.dto.ProductResponse;
import com.minierp.modules.inventory.dto.ProductVariantRequest;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.entity.Category;
import com.minierp.modules.inventory.entity.Product;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.mapper.ProductMapper;
import com.minierp.modules.inventory.mapper.ProductVariantMapper;
import com.minierp.modules.inventory.repository.CategoryRepository;
import com.minierp.modules.inventory.repository.ProductRepository;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.inventory.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final ProductVariantMapper productVariantMapper;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        if (productRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Bu ürün kodu zaten mevcut: " + request.getCode());
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Kategori", "id", request.getCategoryId()));
        }

        Product product = productMapper.toEntity(request);
        product.setCategory(category);

        // Başlangıç varyantları varsa ekle
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantRequest vReq : request.getVariants()) {
                if (productVariantRepository.existsBySku(vReq.getSku())) {
                    throw new BusinessException("Varyant SKU zaten mevcut: " + vReq.getSku());
                }
                ProductVariant variant = productVariantMapper.toEntity(vReq);
                product.addVariant(variant);
            }
        }

        Product saved = productRepository.save(product);
        log.info("Yeni ürün kartı ve varyantları oluşturuldu: Code={}, ID={}", saved.getCode(), saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productMapper.toResponseList(productRepository.findAllWithVariants());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdWithVariants(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", "id", id));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductVariantResponse addVariantToProduct(Long productId, ProductVariantRequest variantRequest) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün", "id", productId));

        if (productVariantRepository.existsBySku(variantRequest.getSku())) {
            throw new BusinessException("Varyant SKU zaten mevcut: " + variantRequest.getSku());
        }

        ProductVariant variant = productVariantMapper.toEntity(variantRequest);
        product.addVariant(variant);
        ProductVariant saved = productVariantRepository.save(variant);

        log.info("Ürüne yeni varyant eklendi: ProductID={}, VariantSKU={}", productId, saved.getSku());
        return productVariantMapper.toResponse(saved);
    }
}
