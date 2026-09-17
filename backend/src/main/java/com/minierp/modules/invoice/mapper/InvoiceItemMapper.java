package com.minierp.modules.invoice.mapper;

import com.minierp.modules.invoice.dto.InvoiceItemResponse;
import com.minierp.modules.invoice.entity.InvoiceItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface InvoiceItemMapper {

    @Mapping(target = "variantId", source = "variant.id")
    @Mapping(target = "variantName", source = "variant.variantName")
    @Mapping(target = "sku", source = "variant.sku")
    InvoiceItemResponse toResponse(InvoiceItem entity);

    List<InvoiceItemResponse> toResponseList(List<InvoiceItem> entities);
}
