package com.minierp.modules.partner.service;

import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.entity.PartnerType;

import java.util.List;

public interface BusinessPartnerService {

    BusinessPartnerDto createPartner(BusinessPartnerDto dto);

    List<BusinessPartnerDto> getAllPartners(PartnerType partnerType);

    BusinessPartnerDto getPartnerById(Long id);
}
