package com.minierp.modules.invoice.dto;

import com.minierp.modules.invoice.entity.TreasuryAccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TreasuryAccountDto {
    private Long id;
    private String accountCode;
    private String accountName;
    private TreasuryAccountType accountType;
    private String currency;
    private BigDecimal currentBalance;
    private String bankName;
    private String branchCode;
    private String iban;
    private boolean active;
    private String notes;
    private Map<String, Object> metadata;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
