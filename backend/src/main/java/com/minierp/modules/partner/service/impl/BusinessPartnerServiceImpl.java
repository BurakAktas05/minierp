package com.minierp.modules.partner.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.core.common.service.DocumentNumberService;
import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.dto.PartnerStatementResponse;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.entity.PartnerType;
import com.minierp.modules.partner.mapper.BusinessPartnerMapper;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.partner.service.BusinessPartnerService;
import com.minierp.modules.partner.service.PartnerFinancialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Cari hesap (müşteri ve tedarikçi) temel CRUD operasyonlarını yürüten servis.
 * Finansal bakiye hesaplamaları ve ekstre üretimi SRP uyarınca PartnerFinancialService'e devredilmiştir.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessPartnerServiceImpl implements BusinessPartnerService {

    private final BusinessPartnerRepository businessPartnerRepository;
    private final BusinessPartnerMapper businessPartnerMapper;
    private final PartnerFinancialService partnerFinancialService;
    private final DocumentNumberService documentNumberService;

    @Override
    @Transactional
    public BusinessPartnerDto createPartner(BusinessPartnerDto dto) {
        if (dto.getTaxNumber() != null && !dto.getTaxNumber().isBlank()
                && businessPartnerRepository.existsByTaxNumber(dto.getTaxNumber())) {
            throw new BusinessException("Bu vergi numarası ile kayıtlı cari hesap zaten var: " + dto.getTaxNumber());
        }

        BusinessPartner partner = businessPartnerMapper.toEntity(dto);
        if (partner.getCode() == null || partner.getCode().isBlank()) {
            partner.setCode(documentNumberService.generateNumber("PARTNER", "CAR"));
        } else if (businessPartnerRepository.existsByCode(partner.getCode())) {
            throw new BusinessException("Bu cari kodu zaten kullanılıyor: " + partner.getCode());
        }

        BusinessPartner saved = businessPartnerRepository.save(partner);
        log.info("Yeni cari hesap kaydedildi: ID={}, Kod={}, Ad={}, Tür={}", saved.getId(), saved.getCode(), saved.getName(), saved.getPartnerType());

        BusinessPartnerDto result = businessPartnerMapper.toDto(saved);
        result.setTotalDebit(BigDecimal.ZERO);
        result.setTotalCredit(BigDecimal.ZERO);
        result.setBalance(BigDecimal.ZERO);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusinessPartnerDto> getAllPartners(PartnerType partnerType) {
        List<BusinessPartner> partners = (partnerType != null)
                ? businessPartnerRepository.findByPartnerType(partnerType)
                : businessPartnerRepository.findAll();

        List<BusinessPartnerDto> dtos = businessPartnerMapper.toDtoList(partners);
        partnerFinancialService.calculateAndSetBalances(dtos);
        return dtos;
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessPartnerDto getPartnerById(Long id) {
        BusinessPartner partner = businessPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", id));

        BusinessPartnerDto dto = businessPartnerMapper.toDto(partner);
        partnerFinancialService.calculateAndSetBalance(dto);
        return dto;
    }

    @Override
    @Transactional
    public BusinessPartnerDto updatePartner(Long id, BusinessPartnerDto dto) {
        BusinessPartner partner = businessPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", id));

        // Vergi numarası değişmişse çakışma kontrolü yap
        if (dto.getTaxNumber() != null && !dto.getTaxNumber().isBlank()
                && !dto.getTaxNumber().equals(partner.getTaxNumber())
                && businessPartnerRepository.existsByTaxNumber(dto.getTaxNumber())) {
            throw new BusinessException("Bu vergi numarası başka bir cari hesap tarafından kullanılıyor: " + dto.getTaxNumber());
        }

        if (dto.getName() != null) partner.setName(dto.getName());
        if (dto.getCompanyTitle() != null) partner.setCompanyTitle(dto.getCompanyTitle());
        if (dto.getPartnerType() != null) partner.setPartnerType(dto.getPartnerType());
        if (dto.getTaxNumber() != null) partner.setTaxNumber(dto.getTaxNumber());
        if (dto.getTaxOffice() != null) partner.setTaxOffice(dto.getTaxOffice());
        if (dto.getEmail() != null) partner.setEmail(dto.getEmail());
        if (dto.getPhone() != null) partner.setPhone(dto.getPhone());
        if (dto.getAddress() != null) partner.setAddress(dto.getAddress());
        if (dto.getMetadata() != null) partner.setMetadata(dto.getMetadata());

        BusinessPartner updated = businessPartnerRepository.save(partner);
        log.info("Cari hesap güncellendi: ID={}, Ad={}", updated.getId(), updated.getName());

        BusinessPartnerDto result = businessPartnerMapper.toDto(updated);
        partnerFinancialService.calculateAndSetBalance(result);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerStatementResponse getPartnerStatement(Long id) {
        return partnerFinancialService.getPartnerStatement(id);
    }
}
