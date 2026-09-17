package com.minierp.modules.inventory.service;

import com.minierp.modules.inventory.dto.ProductVariantResponse;

import java.util.List;

public interface ProductVariantService {

    ProductVariantResponse getVariantById(Long id);

    ProductVariantResponse getVariantBySku(String sku);

    List<ProductVariantResponse> getVariantsByProductId(Long productId);

    ProductVariantResponse updateStock(Long id, int quantityChange);
    ProductVariantResponse updateStock(Long id, int quantityChange, Long warehouseId);

    /**
     * Satış teklifi onaylandığında veya siparişe dönüştüğünde satılabilir stoktan rezerve eder.
     */
    ProductVariantResponse reserveStock(Long id, int quantity);
    ProductVariantResponse reserveStock(Long id, int quantity, Long warehouseId);

    /**
     * Teklif iptal edildiğinde veya süresi dolduğunda rezerve stoğu serbest bırakır.
     */
    ProductVariantResponse releaseReservedStock(Long id, int quantity);
    ProductVariantResponse releaseReservedStock(Long id, int quantity, Long warehouseId);

    /**
     * Sevkiyat / irsaliye yapıldığında hem fiili hem rezerve stoğu düşer.
     */
    ProductVariantResponse fulfillStock(Long id, int quantity);
    ProductVariantResponse fulfillStock(Long id, int quantity, Long warehouseId);
    ProductVariantResponse fulfillStock(Long id, int quantity, Long warehouseId, String lotNumber);

    /**
     * Alış teklifi veya üretim tamamlandığında depoya fiziksel mal girişi (fiili stok artışı) yapar.
     */
    ProductVariantResponse addPhysicalStock(Long id, int quantity);
    ProductVariantResponse addPhysicalStock(Long id, int quantity, Long warehouseId);
    ProductVariantResponse addPhysicalStock(Long id, int quantity, Long warehouseId, String lotNumber);
}
