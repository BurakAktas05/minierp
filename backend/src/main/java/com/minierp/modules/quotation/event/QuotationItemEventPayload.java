package com.minierp.modules.quotation.event;

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
public class QuotationItemEventPayload implements Serializable {

    private Long variantId;
    private String sku;
    private Integer quantity;
    private BigDecimal unitPrice;
}
