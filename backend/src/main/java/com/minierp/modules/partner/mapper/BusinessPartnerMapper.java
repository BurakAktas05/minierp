package com.minierp.modules.partner.mapper;

import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.entity.BusinessPartner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, builder = @org.mapstruct.Builder(disableBuilder = true))
public interface BusinessPartnerMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    BusinessPartner toEntity(BusinessPartnerDto dto);

    BusinessPartnerDto toDto(BusinessPartner entity);

    List<BusinessPartnerDto> toDtoList(List<BusinessPartner> entities);
}
