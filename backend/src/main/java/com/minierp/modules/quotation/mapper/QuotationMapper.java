package com.minierp.modules.quotation.mapper;

import com.minierp.modules.partner.mapper.BusinessPartnerMapper;
import com.minierp.modules.quotation.dto.QuotationResponse;
import com.minierp.modules.quotation.entity.Quotation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {BusinessPartnerMapper.class, QuotationItemMapper.class})
public interface QuotationMapper {

    @Mapping(target = "partner", source = "partner")
    @Mapping(target = "items", source = "items")
    QuotationResponse toResponse(Quotation entity);

    List<QuotationResponse> toResponseList(List<Quotation> entities);
}
