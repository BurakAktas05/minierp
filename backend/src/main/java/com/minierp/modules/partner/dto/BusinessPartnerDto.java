package com.minierp.modules.partner.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.minierp.modules.partner.entity.PartnerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessPartnerDto {

    private Long id;

    @NotNull(message = "Cari türü (CUSTOMER, SUPPLIER, BOTH) seçilmelidir")
    @JsonAlias({"type", "partner_type"})
    private PartnerType partnerType;

    @NotBlank(message = "Cari adı boş bırakılamaz")
    @Size(max = 100, message = "Cari adı en fazla 100 karakter olabilir")
    @JsonAlias({"title", "company_title"})
    private String name;

    private String companyTitle;
    private String taxNumber;
    private String taxOffice;
    private String email;
    private String phone;
    private String address;

    /**
     * JSONB dinamik cari bilgileri (örn: kredi limiti, vade günü)
     */
    private Map<String, Object> metadata;

    /**
     * Finansal bakiye özetleri
     */
    private java.math.BigDecimal totalDebit;
    private java.math.BigDecimal totalCredit;
    private java.math.BigDecimal balance;

    private String code;
    private OffsetDateTime createdAt;

    @JsonProperty("code")
    public String getCode() {
        if (code != null && !code.isBlank()) {
            return code;
        }
        return "CAR-" + String.format("%04d", id != null ? id : 0);
    }

    @JsonProperty("title")
    public String getTitle() {
        return companyTitle != null && !companyTitle.isBlank() ? companyTitle : name;
    }

    @JsonProperty("type")
    public PartnerType getType() {
        return partnerType;
    }
}

