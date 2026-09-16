package com.minierp.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String code;
    private String baseUnit;
    private BigDecimal taxRate;
    private String description;
    private Map<String, Object> attributes;
    private List<ProductVariantResponse> variants;
    private OffsetDateTime createdAt;
}
