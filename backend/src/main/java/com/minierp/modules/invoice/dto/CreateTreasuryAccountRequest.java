package com.minierp.modules.invoice.dto;

import com.minierp.modules.invoice.entity.TreasuryAccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTreasuryAccountRequest {

    private String accountCode;

    @NotBlank(message = "Hesap adı zorunludur")
    private String accountName;

    @NotNull(message = "Hesap türü (CASH/BANK) zorunludur")
    private TreasuryAccountType accountType;

    @Builder.Default
    private String currency = "TRY";

    @Builder.Default
    private BigDecimal initialBalance = BigDecimal.ZERO;

    private String bankName;
    private String branchCode;
    private String iban;
    private String notes;
    private Map<String, Object> metadata;
}
