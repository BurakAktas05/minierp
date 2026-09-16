package com.minierp.modules.partner.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.entity.PartnerType;
import com.minierp.modules.partner.mapper.BusinessPartnerMapper;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.partner.service.BusinessPartnerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessPartnerServiceImpl implements BusinessPartnerService {

    private final BusinessPartnerRepository businessPartnerRepository;
    private final BusinessPartnerMapper businessPartnerMapper;

    @Override
    @Transactional
    public BusinessPartnerDto createPartner(BusinessPartnerDto dto) {
        if (dto.getTaxNumber() != null && !dto.getTaxNumber().isBlank()
                && businessPartnerRepository.existsByTaxNumber(dto.getTaxNumber())) {
            throw new BusinessException("Bu vergi numarası ile kayıtlı cari hesap zaten var: " + dto.getTaxNumber());
        }

        BusinessPartner partner = businessPartnerMapper.toEntity(dto);
        BusinessPartner saved = businessPartnerRepository.save(partner);
        log.info("Yeni cari hesap kaydedildi: ID={}, Ad={}, Tür={}", saved.getId(), saved.getName(), saved.getPartnerType());
        return businessPartnerMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusinessPartnerDto> getAllPartners(PartnerType partnerType) {
        List<BusinessPartner> partners = (partnerType != null)
                ? businessPartnerRepository.findByPartnerType(partnerType)
                : businessPartnerRepository.findAll();
        return businessPartnerMapper.toDtoList(partners);
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessPartnerDto getPartnerById(Long id) {
        BusinessPartner partner = businessPartnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", id));
        return businessPartnerMapper.toDto(partner);
    }
}
