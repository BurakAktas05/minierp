package com.minierp.modules.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private Long id;
    private Long variantId;
    private String variantName;
    private String sku;
    private String description;
    private Integer quantity;
    private Integer deliveredQuantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRate;
    private BigDecimal discountRate;
    private BigDecimal subtotal;
}
