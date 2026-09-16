package com.minierp.modules.quotation.dto;

import com.minierp.modules.quotation.entity.QuotationType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuotationRequest {

    @NotNull(message = "Teklif türü (PURCHASE, SALES) seçilmelidir")
    private QuotationType type;

    @NotNull(message = "Cari hesap ID boş bırakılamaz")
    private Long partnerId;

    private OffsetDateTime validUntil;

    @Builder.Default
    private String currency = "TRY";

    private String notes;

    /**
     * Dinamik teklif özellikleri (örn: {"teslimatYeri": "Fabrika Teslim", "odemePlani": "30 Gün"})
     */
    private Map<String, Object> metadata;

    @NotEmpty(message = "Teklif en az bir ürün kalemi içermelidir")
    @Valid
    private List<QuotationItemRequest> items;
}
