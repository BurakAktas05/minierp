package com.minierp.modules.manufacturing.dto;

import com.minierp.modules.manufacturing.entity.WorkOrderStatus;
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
public class WorkOrderDto {
    private Long id;
    private String orderNumber;
    private Long bomId;
    private String bomCode;
    private String bomName;
    private Long productVariantId;
    private String productVariantSku;
    private String productVariantName;
    private Long salesOrderId;
    private Long sourceWarehouseId;
    private String sourceWarehouseName;
    private Long targetWarehouseId;
    private String targetWarehouseName;
    private BigDecimal plannedQuantity;
    private BigDecimal producedQuantity;
    private WorkOrderStatus status;
    private String priority;
    private OffsetDateTime startDate;
    private OffsetDateTime dueDate;
    private OffsetDateTime completionDate;
    private String notes;
    private Map<String, Object> metadata;
    private List<WorkOrderItemDto> items;
    private OffsetDateTime createdAt;
}
