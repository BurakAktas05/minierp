package com.minierp.modules.quotation.mapper;

import com.minierp.modules.quotation.dto.QuotationItemResponse;
import com.minierp.modules.quotation.entity.QuotationItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface QuotationItemMapper {

    @Mapping(target = "variantId", source = "variant.id")
    @Mapping(target = "variantName", source = "variant.variantName")
    @Mapping(target = "sku", source = "variant.sku")
    QuotationItemResponse toResponse(QuotationItem entity);

    List<QuotationItemResponse> toResponseList(List<QuotationItem> entities);
}
