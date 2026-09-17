package com.minierp.modules.invoice.dto;

import com.minierp.modules.invoice.entity.InvoiceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {

    @NotNull(message = "Fatura türü (SALES_INVOICE, PURCHASE_INVOICE) seçilmelidir")
    private InvoiceType invoiceType;

    @NotNull(message = "Cari hesap ID boş bırakılamaz")
    private Long partnerId;

    private Long orderId;
    private Long waybillId;

    private OffsetDateTime invoiceDate;
    private OffsetDateTime dueDate;

    @Builder.Default
    private String currency = "TRY";

    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;

    private String notes;
    private Map<String, Object> metadata;

    @Valid
    private List<InvoiceItemRequest> items;
}
