package com.minierp.modules.waybill.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaybillItemResponse {

    private Long id;
    private Long variantId;
    private String variantName;
    private String sku;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
}
