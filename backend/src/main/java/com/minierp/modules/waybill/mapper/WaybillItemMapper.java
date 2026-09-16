package com.minierp.modules.waybill.mapper;

import com.minierp.modules.waybill.dto.WaybillItemResponse;
import com.minierp.modules.waybill.entity.WaybillItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface WaybillItemMapper {

    @Mapping(target = "variantId", source = "variant.id")
    @Mapping(target = "variantName", source = "variant.variantName")
    @Mapping(target = "sku", source = "variant.sku")
    WaybillItemResponse toResponse(WaybillItem entity);

    List<WaybillItemResponse> toResponseList(List<WaybillItem> entities);
}
