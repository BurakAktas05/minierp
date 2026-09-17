package com.minierp.modules.manufacturing.dto;

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
public class BomDto {
    private Long id;
    private String bomCode;
    private String name;
    private Long variantId;
    private String variantSku;
    private String variantName;
    private BigDecimal quantity;
    private String unit;
    private String description;
    private String industryType;
    private Boolean active;
    private Map<String, Object> metadata;
    private List<BomItemDto> items;
    private OffsetDateTime createdAt;
}
