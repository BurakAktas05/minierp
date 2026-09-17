package com.minierp.modules.manufacturing.mapper;

import com.minierp.modules.manufacturing.dto.BomDto;
import com.minierp.modules.manufacturing.dto.BomItemDto;
import com.minierp.modules.manufacturing.entity.BillOfMaterials;
import com.minierp.modules.manufacturing.entity.BomItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface BomMapper {

    @Mapping(target = "variantId", source = "variant.id")
    @Mapping(target = "variantSku", source = "variant.sku")
    @Mapping(target = "variantName", source = "variant.variantName")
    @Mapping(target = "items", source = "items")
    BomDto toDto(BillOfMaterials entity);

    List<BomDto> toDtoList(List<BillOfMaterials> entities);

    @Mapping(target = "componentVariantId", source = "componentVariant.id")
    @Mapping(target = "componentSku", source = "componentVariant.sku")
    @Mapping(target = "componentName", source = "componentVariant.variantName")
    BomItemDto toItemDto(BomItem entity);

    List<BomItemDto> toItemDtoList(List<BomItem> entities);
}
