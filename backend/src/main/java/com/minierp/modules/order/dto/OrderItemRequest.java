package com.minierp.modules.order.dto;

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
public class OrderItemRequest {

    @NotNull(message = "Ürün varyant ID boş bırakılamaz")
    private Long variantId;

    private String description;

    @NotNull(message = "Miktar boş bırakılamaz")
    @Min(value = 1, message = "Miktar en az 1 olmalıdır")
    private Integer quantity;

    @DecimalMin(value = "0.0", inclusive = true, message = "Birim fiyat negatif olamaz")
    private BigDecimal unitPrice; // null ise cari fiyat listesinden veya ürün varsayılan fiyatından çözümlenir

    @Builder.Default
    @DecimalMin(value = "0.0", inclusive = true, message = "KDV oranı negatif olamaz")
    private BigDecimal taxRate = new BigDecimal("20.00");

    @Builder.Default
    @DecimalMin(value = "0.0", inclusive = true, message = "İskonto oranı negatif olamaz")
    private BigDecimal discountRate = BigDecimal.ZERO;
}
