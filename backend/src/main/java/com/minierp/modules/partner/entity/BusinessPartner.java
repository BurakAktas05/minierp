package com.minierp.modules.partner.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

/**
 * Kiracı şemasında saklanan Cari Hesap (Business Partner) entity'si.
 * B2B sistemde Müşteri veya Tedarikçi (veya her ikisi) olabilir.
 */
@Entity
@Table(name = "business_partners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessPartner extends BaseEntity {

    @Column(length = 20, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "partner_type", nullable = false, length = 30)
    private PartnerType partnerType;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "company_title", length = 150)
    private String companyTitle;

    @Column(name = "tax_number", length = 20)
    private String taxNumber;

    @Column(name = "tax_office", length = 50)
    private String taxOffice;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    /**
     * Cari hesaba özel dinamik alanlar (örn: {"krediLimiti": 100000, "vadeGunu": 45, "yetkiliKisi": "Mehmet Bey"})
     */
    @Builder.Default
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();
}
