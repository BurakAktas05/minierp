package com.minierp.modules.manufacturing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class CreateWorkOrderRequest {

    @NotNull(message = "Üretim reçetesi (BOM) seçilmelidir")
    private Long bomId;

    private Long salesOrderId;
    private Long sourceWarehouseId;
    private Long targetWarehouseId;

    @NotNull(message = "Planlanan üretim miktarı belirtilmelidir")
    @Positive(message = "Planlanan miktar pozitif olmalıdır")
    private BigDecimal plannedQuantity;

    private String priority;
    private OffsetDateTime startDate;
    private OffsetDateTime dueDate;
    private String notes;
    private Map<String, Object> metadata;
}
