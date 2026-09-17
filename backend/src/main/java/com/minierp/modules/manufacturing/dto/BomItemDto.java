package com.minierp.modules.manufacturing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomItemDto {
    private Long id;
    private Long componentVariantId;
    private String componentSku;
    private String componentName;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal scrapRate;
    private String description;
}
