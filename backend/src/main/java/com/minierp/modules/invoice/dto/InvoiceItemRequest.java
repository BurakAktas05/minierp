package com.minierp.modules.invoice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemRequest {

    private Long variantId;
    private Long waybillItemId;
    private String description;

    @NotNull(message = "Miktar boş bırakılamaz")
    @DecimalMin(value = "0.001", message = "Miktar en az 0.001 olmalıdır")
    private BigDecimal quantity;

    @NotNull(message = "Birim fiyat boş bırakılamaz")
    @DecimalMin(value = "0.00", inclusive = true, message = "Birim fiyat negatif olamaz")
    private BigDecimal unitPrice;

    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("20.00");

    @Builder.Default
    private BigDecimal discountRate = BigDecimal.ZERO;
}
