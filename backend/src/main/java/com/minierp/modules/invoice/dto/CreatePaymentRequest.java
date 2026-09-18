package com.minierp.modules.invoice.dto;

import com.minierp.modules.invoice.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    // Opsiyonel: URL path üzerinden (@PathVariable invoiceId) veya gövdeden atanabilir
    private Long invoiceId;

    @NotNull(message = "Ödeme tutarı boş bırakılamaz")
    @DecimalMin(value = "0.01", message = "Ödeme tutarı en az 0.01 olmalıdır")
    private BigDecimal amount;

    @NotNull(message = "Ödeme yöntemi seçilmelidir (CASH, BANK_TRANSFER)")
    private PaymentMethod paymentMethod;

    private Long accountId;
    private OffsetDateTime paymentDate;
    private String referenceNumber;
    private String notes;

    @Builder.Default
    private String currency = "TRY";

    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;
}
