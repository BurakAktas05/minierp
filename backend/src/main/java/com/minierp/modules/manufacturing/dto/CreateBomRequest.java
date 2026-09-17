package com.minierp.modules.manufacturing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBomRequest {

    private String bomCode;

    @NotBlank(message = "Reçete adı boş bırakılamaz")
    private String name;

    @NotNull(message = "Üretilecek mamul varyantı seçilmelidir")
    private Long variantId;

    @NotNull(message = "Üretim miktarı belirtilmelidir")
    @Positive(message = "Üretim miktarı pozitif olmalıdır")
    private BigDecimal quantity;

    private String unit;
    private String description;
    private String industryType;
    private Map<String, Object> metadata;

    private List<CreateBomItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBomItemRequest {
        @NotNull(message = "Sarf malzemesi varyantı seçilmelidir")
        private Long componentVariantId;

        @NotNull(message = "Sarf miktarı belirtilmelidir")
        @Positive(message = "Sarf miktarı pozitif olmalıdır")
        private BigDecimal quantity;

        private String unit;
        private BigDecimal scrapRate;
        private String description;
    }
}
