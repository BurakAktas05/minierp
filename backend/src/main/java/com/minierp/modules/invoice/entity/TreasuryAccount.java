package com.minierp.modules.invoice.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Kiracı bazlı Kasa ve Banka Hesapları Entity'si.
 * Nakit akışı ve tahsilat/tediye bakiyelerini tutar.
 */
@Entity
@Table(name = "treasury_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreasuryAccount extends BaseEntity {

    @Column(name = "account_code", nullable = false, length = 50, unique = true)
    private String accountCode;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    private TreasuryAccountType accountType;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "TRY";

    @Builder.Default
    @Column(name = "current_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "branch_code", length = 50)
    private String branchCode;

    @Column(length = 50)
    private String iban;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    public void deposit(BigDecimal amount) {
        if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
            this.currentBalance = this.currentBalance.add(amount);
        }
    }

    public void withdraw(BigDecimal amount) {
        if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
            this.currentBalance = this.currentBalance.subtract(amount);
        }
    }
}
