package com.minierp.modules.waybill.mapper;

import com.minierp.modules.partner.mapper.BusinessPartnerMapper;
import com.minierp.modules.waybill.dto.WaybillResponse;
import com.minierp.modules.waybill.entity.Waybill;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {BusinessPartnerMapper.class, WaybillItemMapper.class})
public interface WaybillMapper {

    @Mapping(target = "partner", source = "partner")
    @Mapping(target = "items", source = "items")
    WaybillResponse toResponse(Waybill entity);

    List<WaybillResponse> toResponseList(List<Waybill> entities);
}
