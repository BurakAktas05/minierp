package com.minierp.modules.partner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Cari hesap ekstresi (Partner Statement / Ledger).
 * Borç = Faturalar, Alacak = Ödemeler.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerStatementResponse {

    private Long partnerId;
    private String partnerName;
    private String partnerCode;
    private String partnerType;

    // Özet bakiye bilgileri
    private BigDecimal totalDebit;      // Toplam borç (fatura toplamları)
    private BigDecimal totalCredit;     // Toplam alacak (ödeme toplamları)
    private BigDecimal balance;         // Bakiye (borç - alacak, pozitif = borçlu)

    // Ekstre satırları
    private List<StatementLine> lines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatementLine {
        private Long id;
        private OffsetDateTime date;
        private String documentType;   // INVOICE, PAYMENT
        private String documentNumber; // Fatura/Ödeme numarası
        private String description;
        private BigDecimal debit;      // Borç tutarı (fatura ise)
        private BigDecimal credit;     // Alacak tutarı (ödeme ise)
        private BigDecimal runningBalance; // Kümülatif bakiye
        private String status;
        private String currency;
    }
}
