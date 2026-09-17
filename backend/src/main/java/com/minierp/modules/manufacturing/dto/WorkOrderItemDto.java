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
public class WorkOrderItemDto {
    private Long id;
    private Long componentVariantId;
    private String componentSku;
    private String componentName;
    private BigDecimal plannedQuantity;
    private BigDecimal consumedQuantity;
    private String unit;
}
