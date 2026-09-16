package com.minierp.modules.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantStockUpdateRequest {

    @NotNull(message = "Stok değişim miktarı boş bırakılamaz")
    private Integer amount; // Pozitif: stok girişi, Negatif: stok çıkışı
}
