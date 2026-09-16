package com.minierp.modules.waybill.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class WaybillItemRequest {

    @NotNull(message = "Ürün varyant ID boş bırakılamaz")
    private Long variantId;

    private String description;

    @NotNull(message = "Miktar boş bırakılamaz")
    @Min(value = 1, message = "Miktar en az 1 olmalıdır")
    private Integer quantity;

    @Builder.Default
    @DecimalMin(value = "0.0", inclusive = true, message = "Birim fiyat negatif olamaz")
    private BigDecimal unitPrice = BigDecimal.ZERO;
}
