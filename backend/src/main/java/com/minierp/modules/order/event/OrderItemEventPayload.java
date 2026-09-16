package com.minierp.modules.order.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEventPayload implements Serializable {

    private Long variantId;
    private String sku;
    private Integer quantity;
    private BigDecimal unitPrice;
}
