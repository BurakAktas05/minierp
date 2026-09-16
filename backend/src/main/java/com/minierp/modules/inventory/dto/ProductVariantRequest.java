package com.minierp.modules.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantRequest {

    @NotBlank(message = "SKU boş bırakılamaz")
    private String sku;

    private String barcode;

    @NotBlank(message = "Varyant adı boş bırakılamaz (örn: Kırmızı - M)")
    private String variantName;

    @NotNull(message = "Alış fiyatı boş bırakılamaz")
    @DecimalMin(value = "0.0", inclusive = true, message = "Alış fiyatı negatif olamaz")
    private BigDecimal purchasePrice;

    @NotNull(message = "Satış fiyatı boş bırakılamaz")
    @DecimalMin(value = "0.0", inclusive = true, message = "Satış fiyatı negatif olamaz")
    private BigDecimal salePrice;

    @NotNull(message = "Stok miktarı boş bırakılamaz")
    @Min(value = 0, message = "Stok miktarı negatif olamaz")
    private Integer stockQuantity;

    /**
     * Dinamik JSONB özellikleri (örn: {"renk": "Kırmızı", "beden": "M", "kumas": "Pamuk"})
     */
    private Map<String, Object> attributes;
}
