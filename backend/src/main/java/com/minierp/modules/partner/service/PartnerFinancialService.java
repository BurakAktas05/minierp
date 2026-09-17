package com.minierp.modules.partner.service;

import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.dto.PartnerStatementResponse;

import java.util.List;

/**
 * Cari hesapların finansal bakiye hesaplamalarını, borç/alacak dağılımlarını
 * ve cari hesap ekstrelerini yöneten finansal servis arayüzü (SRP & SoC).
 */
public interface PartnerFinancialService {

    /**
     * Cari hesap DTO listesindeki her cari için toplam borç, alacak ve bakiye tutarlarını hesaplar ve set eder.
     */
    void calculateAndSetBalances(List<BusinessPartnerDto> dtos);

    /**
     * Tek bir cari hesap DTO'su için toplam borç, alacak ve bakiye tutarlarını hesaplar ve set eder.
     */
    void calculateAndSetBalance(BusinessPartnerDto dto);

    /**
     * Belirtilen cari hesap için kronolojik hareket ekstresi ve kümülatif bakiye üretir.
     */
    PartnerStatementResponse getPartnerStatement(Long partnerId);
}
