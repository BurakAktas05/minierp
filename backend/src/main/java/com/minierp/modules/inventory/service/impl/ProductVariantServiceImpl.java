package com.minierp.modules.inventory.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.mapper.ProductVariantMapper;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.inventory.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantMapper productVariantMapper;

    @Override
    @Transactional(readOnly = true)
    public ProductVariantResponse getVariantById(Long id) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));
        return productVariantMapper.toResponse(variant);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductVariantResponse getVariantBySku(String sku) {
        ProductVariant variant = productVariantRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "sku", sku));
        return productVariantMapper.toResponse(variant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getVariantsByProductId(Long productId) {
        return productVariantMapper.toResponseList(productVariantRepository.findByProductId(productId));
    }

    @Override
    @Transactional
    public ProductVariantResponse updateStock(Long id, int quantityChange) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        int newStock = variant.getStockQuantity() + quantityChange;
        if (newStock < 0) {
            throw new BusinessException(String.format("Yetersiz fiili stok! SKU: %s, Fiili: %d, Değişim: %d",
                    variant.getSku(), variant.getStockQuantity(), quantityChange));
        }

        variant.setStockQuantity(newStock);
        ProductVariant updated = productVariantRepository.save(variant);
        log.info("Varyant fiili stoğu güncellendi: SKU={}, Yeni Fiili Stok={}", variant.getSku(), newStock);
        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse reserveStock(Long id, int quantity) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        int available = variant.getAvailableStock();
        if (available < quantity) {
            throw new BusinessException(String.format(
                    "Yetersiz satılabilir stok! SKU: %s, Mevcut Satılabilir: %d, İstenen Rezerve: %d",
                    variant.getSku(), available, quantity));
        }

        int newReserved = variant.getReservedStock() + quantity;
        variant.setReservedStock(newReserved);
        ProductVariant updated = productVariantRepository.save(variant);

        log.info("Stok rezerve edildi: SKU={}, Rezerve Miktar={}, Yeni Rezerve Toplamı={}, Kalan Satılabilir={}",
                variant.getSku(), quantity, newReserved, updated.getAvailableStock());

        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse releaseReservedStock(Long id, int quantity) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        int currentReserved = variant.getReservedStock();
        int newReserved = Math.max(0, currentReserved - quantity);
        variant.setReservedStock(newReserved);
        ProductVariant updated = productVariantRepository.save(variant);

        log.info("Rezerve stok serbest bırakıldı: SKU={}, Serbest Bırakılan={}, Yeni Rezerve Toplamı={}, Satılabilir={}",
                variant.getSku(), quantity, newReserved, updated.getAvailableStock());

        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse fulfillStock(Long id, int quantity) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        if (variant.getStockQuantity() < quantity) {
            throw new BusinessException(String.format("Yetersiz fiili stok sevk edilemez! SKU: %s, Fiili: %d, Sevk: %d",
                    variant.getSku(), variant.getStockQuantity(), quantity));
        }

        variant.setStockQuantity(variant.getStockQuantity() - quantity);
        variant.setReservedStock(Math.max(0, variant.getReservedStock() - quantity));
        ProductVariant updated = productVariantRepository.save(variant);

        log.info("Stok sevkiyatı yapıldı: SKU={}, Sevk Adedi={}, Kalan Fiili={}, Kalan Rezerve={}",
                variant.getSku(), quantity, updated.getStockQuantity(), updated.getReservedStock());

        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse addPhysicalStock(Long id, int quantity) {
        return updateStock(id, Math.max(0, quantity));
    }
}
