package com.minierp.modules.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequest {

    private Long categoryId;
    private Long partnerId;
    private com.minierp.modules.inventory.entity.ProductType productType;

    @NotBlank(message = "Ürün adı boş bırakılamaz")
    @Size(max = 150, message = "Ürün adı en fazla 150 karakter olabilir")
    private String name;

    @NotBlank(message = "Ürün kodu boş bırakılamaz")
    @Size(max = 50, message = "Ürün kodu en fazla 50 karakter olabilir")
    private String code;

    @Builder.Default
    private String baseUnit = "ADET";

    @Builder.Default
    @NotNull(message = "KDV oranı boş bırakılamaz")
    @DecimalMin(value = "0.0", inclusive = true, message = "KDV oranı negatif olamaz")
    private BigDecimal taxRate = new BigDecimal("20.00");

    private String description;

    /**
     * Ana ürün şablonuna ait dinamik JSONB özellikleri (örn: marka, menşei, sezon)
     */
    private Map<String, Object> attributes;

    /**
     * Ürüne ait başlangıç varyantları (opsiyonel, sonradan da eklenebilir)
     */
    @Valid
    private List<ProductVariantRequest> variants;
}
