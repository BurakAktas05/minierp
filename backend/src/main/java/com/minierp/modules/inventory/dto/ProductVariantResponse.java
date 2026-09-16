package com.minierp.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {

    private Long id;
    private Long productId;
    private String sku;
    private String barcode;
    private String variantName;
    private BigDecimal purchasePrice;
    private BigDecimal salePrice;
    private Integer stockQuantity;   // Fiili stok
    private Integer reservedStock;   // Rezerve stok
    private Integer availableStock;  // Satılabilir stok (Fiili - Rezerve)
    private Map<String, Object> attributes;
    private OffsetDateTime createdAt;
}
