package com.minierp.modules.inventory.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.core.common.service.DocumentNumberService;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.entity.StockMovement;
import com.minierp.modules.inventory.entity.StockMovementType;
import com.minierp.modules.inventory.mapper.ProductVariantMapper;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.inventory.repository.StockMovementRepository;
import com.minierp.modules.inventory.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantMapper productVariantMapper;
    private final StockMovementRepository stockMovementRepository;
    private final DocumentNumberService documentNumberService;
    private final com.minierp.modules.inventory.repository.WarehouseRepository warehouseRepository;
    private final com.minierp.modules.inventory.repository.WarehouseStockRepository warehouseStockRepository;

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
        return updateStock(id, quantityChange, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse updateStock(Long id, int quantityChange, Long warehouseId) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        int newStock = variant.getStockQuantity() + quantityChange;
        if (newStock < 0) {
            throw new BusinessException(String.format("Yetersiz fiili stok! SKU: %s, Fiili: %d, Değişim: %d",
                    variant.getSku(), variant.getStockQuantity(), quantityChange));
        }

        variant.setStockQuantity(newStock);
        ProductVariant updated = productVariantRepository.save(variant);

        // Depo bazlı stok senkronizasyonu
        com.minierp.modules.inventory.entity.Warehouse wh = getEffectiveWarehouse(warehouseId);
        syncWarehouseStock(wh, variant, quantityChange, 0);

        // Stok hareketi kaydı oluştur
        StockMovementType movementType = quantityChange > 0 ? StockMovementType.ADJUSTMENT : StockMovementType.ADJUSTMENT;
        createStockMovement(variant, movementType, Math.abs(quantityChange), "MANUAL", null,
                String.format("Manuel stok düzeltmesi: %+d (Depo: %s)", quantityChange, wh != null ? wh.getName() : "Genel"));

        log.info("Varyant fiili stoğu güncellendi: SKU={}, Yeni Fiili Stok={}, Depo={}",
                variant.getSku(), newStock, wh != null ? wh.getName() : "Genel");
        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse reserveStock(Long id, int quantity) {
        return reserveStock(id, quantity, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse reserveStock(Long id, int quantity, Long warehouseId) {
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

        // Depo bazlı rezerv senkronizasyonu
        com.minierp.modules.inventory.entity.Warehouse wh = getEffectiveWarehouse(warehouseId);
        syncWarehouseStock(wh, variant, 0, quantity);

        log.info("Stok rezerve edildi: SKU={}, Rezerve Miktar={}, Yeni Rezerve Toplamı={}, Kalan Satılabilir={}, Depo={}",
                variant.getSku(), quantity, newReserved, updated.getAvailableStock(), wh != null ? wh.getName() : "Genel");

        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse releaseReservedStock(Long id, int quantity) {
        return releaseReservedStock(id, quantity, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse releaseReservedStock(Long id, int quantity, Long warehouseId) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        int currentReserved = variant.getReservedStock();
        int newReserved = Math.max(0, currentReserved - quantity);
        variant.setReservedStock(newReserved);
        ProductVariant updated = productVariantRepository.save(variant);

        // Depo bazlı rezerv düşümü
        com.minierp.modules.inventory.entity.Warehouse wh = getEffectiveWarehouse(warehouseId);
        syncWarehouseStock(wh, variant, 0, -quantity);

        log.info("Rezerve stok serbest bırakıldı: SKU={}, Serbest Bırakılan={}, Yeni Rezerve Toplamı={}, Satılabilir={}, Depo={}",
                variant.getSku(), quantity, newReserved, updated.getAvailableStock(), wh != null ? wh.getName() : "Genel");

        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse fulfillStock(Long id, int quantity) {
        return fulfillStock(id, quantity, null, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse fulfillStock(Long id, int quantity, Long warehouseId) {
        return fulfillStock(id, quantity, warehouseId, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse fulfillStock(Long id, int quantity, Long warehouseId, String lotNumber) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        if (variant.getStockQuantity() < quantity) {
            throw new BusinessException(String.format("Yetersiz fiili stok sevk edilemez! SKU: %s, Fiili: %d, Sevk: %d",
                    variant.getSku(), variant.getStockQuantity(), quantity));
        }

        variant.setStockQuantity(variant.getStockQuantity() - quantity);
        variant.setReservedStock(Math.max(0, variant.getReservedStock() - quantity));
        ProductVariant updated = productVariantRepository.save(variant);

        // Depo bazlı fiili ve rezerve düşümü
        com.minierp.modules.inventory.entity.Warehouse wh = getEffectiveWarehouse(warehouseId);
        syncWarehouseStock(wh, variant, -quantity, -quantity);

        // Stok hareketi kaydı - Mal Çıkışı
        String note = String.format("Sevkiyat: %d adet çıkış (Depo: %s)%s",
                quantity, wh != null ? wh.getName() : "Genel",
                lotNumber != null ? ", Lot: " + lotNumber : "");
        createStockMovement(variant, StockMovementType.GOODS_ISSUE, quantity, "WAYBILL", null, note, lotNumber);

        log.info("Stok sevkiyatı yapıldı: SKU={}, Sevk Adedi={}, Lot={}, Kalan Fiili={}, Kalan Rezerve={}, Depo={}",
                variant.getSku(), quantity, lotNumber, updated.getStockQuantity(), updated.getReservedStock(), wh != null ? wh.getName() : "Genel");

        return productVariantMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductVariantResponse addPhysicalStock(Long id, int quantity) {
        return addPhysicalStock(id, quantity, null, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse addPhysicalStock(Long id, int quantity, Long warehouseId) {
        return addPhysicalStock(id, quantity, warehouseId, null);
    }

    @Override
    @Transactional
    public ProductVariantResponse addPhysicalStock(Long id, int quantity, Long warehouseId, String lotNumber) {
        ProductVariant variant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", id));

        int safeQuantity = Math.max(0, quantity);
        int newStock = variant.getStockQuantity() + safeQuantity;
        variant.setStockQuantity(newStock);
        ProductVariant updated = productVariantRepository.save(variant);

        // Depo bazlı mal kabulü / girişi
        com.minierp.modules.inventory.entity.Warehouse wh = getEffectiveWarehouse(warehouseId);
        syncWarehouseStock(wh, variant, safeQuantity, 0);

        // Stok hareketi kaydı - Mal Kabul
        String note = String.format("Mal kabul: %d adet giriş (Depo: %s)%s",
                safeQuantity, wh != null ? wh.getName() : "Genel",
                lotNumber != null ? ", Lot: " + lotNumber : "");
        createStockMovement(variant, StockMovementType.GOODS_RECEIPT, safeQuantity, "WAYBILL", null, note, lotNumber);

        log.info("Depoya fiziksel stok eklendi: SKU={}, Eklenen={}, Lot={}, Yeni Toplam={}, Depo={}",
                variant.getSku(), safeQuantity, lotNumber, updated.getStockQuantity(), wh != null ? wh.getName() : "Genel");

        return productVariantMapper.toResponse(updated);
    }

    private com.minierp.modules.inventory.entity.Warehouse getEffectiveWarehouse(Long warehouseId) {
        if (warehouseId != null) {
            return warehouseRepository.findById(warehouseId).orElse(null);
        }
        List<com.minierp.modules.inventory.entity.Warehouse> warehouses = warehouseRepository.findAll();
        return warehouses.isEmpty() ? null : warehouses.get(0);
    }

    private void syncWarehouseStock(com.minierp.modules.inventory.entity.Warehouse warehouse, ProductVariant variant,
                                     int quantityDelta, int reservedDelta) {
        if (warehouse == null || variant == null) {
            return;
        }
        try {
            com.minierp.modules.inventory.entity.WarehouseStock ws = warehouseStockRepository
                    .findByWarehouseIdAndVariantId(warehouse.getId(), variant.getId())
                    .orElseGet(() -> com.minierp.modules.inventory.entity.WarehouseStock.builder()
                            .warehouse(warehouse)
                            .variant(variant)
                            .quantity(0)
                            .reservedStock(0)
                            .build());

            int newQty = Math.max(0, ws.getQuantity() + quantityDelta);
            int newRes = Math.max(0, ws.getReservedStock() + reservedDelta);
            ws.setQuantity(newQty);
            ws.setReservedStock(newRes);
            warehouseStockRepository.save(ws);
            log.info("Depo bazlı stok senkronize edildi: Depo={}, SKU={}, Yeni Adet={}, Yeni Rezerve={}",
                    warehouse.getName(), variant.getSku(), newQty, newRes);
        } catch (Exception e) {
            log.warn("Depo bazlı stok senkronizasyonunda hata: {}", e.getMessage());
        }
    }

    /**
     * Her stok değişikliğinde denetlenebilir stok hareketi kaydı oluşturur.
     * ERP best practice: Tüm stok hareketleri izlenebilir olmalıdır.
     */
    private void createStockMovement(ProductVariant variant, StockMovementType type,
                                      int quantity, String referenceType, Long referenceId, String notes) {
        createStockMovement(variant, type, quantity, referenceType, referenceId, notes, null);
    }

    private void createStockMovement(ProductVariant variant, StockMovementType type,
                                      int quantity, String referenceType, Long referenceId, String notes, String lotNumber) {
        try {
            String movementNumber = documentNumberService.generateNumber("STOCK_MOVEMENT", "STK");

            StockMovement movement = StockMovement.builder()
                    .movementNumber(movementNumber)
                    .movementType(type)
                    .variant(variant)
                    .quantity(quantity)
                    .referenceType(referenceType)
                    .referenceId(referenceId)
                    .notes(notes)
                    .lotNumber(lotNumber)
                    .performedBy("SYSTEM")
                    .build();

            stockMovementRepository.save(movement);
            log.debug("Stok hareketi kaydedildi: No={}, Tür={}, SKU={}, Adet={}, Lot={}",
                    movementNumber, type, variant.getSku(), quantity, lotNumber);
        } catch (Exception e) {
            // Stok hareketi kaydı başarısız olursa ana işlemi engelleme
            log.warn("Stok hareketi kaydı oluşturulamadı: SKU={}, Hata={}", variant.getSku(), e.getMessage());
        }
    }
}
