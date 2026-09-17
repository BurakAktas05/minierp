package com.minierp.modules.manufacturing.mapper;

import com.minierp.modules.manufacturing.dto.WorkOrderDto;
import com.minierp.modules.manufacturing.dto.WorkOrderItemDto;
import com.minierp.modules.manufacturing.entity.WorkOrder;
import com.minierp.modules.manufacturing.entity.WorkOrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface WorkOrderMapper {

    @Mapping(target = "bomId", source = "bom.id")
    @Mapping(target = "bomCode", source = "bom.bomCode")
    @Mapping(target = "bomName", source = "bom.name")
    @Mapping(target = "productVariantId", source = "bom.variant.id")
    @Mapping(target = "productVariantSku", source = "bom.variant.sku")
    @Mapping(target = "productVariantName", source = "bom.variant.variantName")
    @Mapping(target = "sourceWarehouseId", source = "sourceWarehouse.id")
    @Mapping(target = "sourceWarehouseName", source = "sourceWarehouse.name")
    @Mapping(target = "targetWarehouseId", source = "targetWarehouse.id")
    @Mapping(target = "targetWarehouseName", source = "targetWarehouse.name")
    @Mapping(target = "items", source = "items")
    WorkOrderDto toDto(WorkOrder entity);

    List<WorkOrderDto> toDtoList(List<WorkOrder> entities);

    @Mapping(target = "componentVariantId", source = "componentVariant.id")
    @Mapping(target = "componentSku", source = "componentVariant.sku")
    @Mapping(target = "componentName", source = "componentVariant.variantName")
    WorkOrderItemDto toItemDto(WorkOrderItem entity);

    List<WorkOrderItemDto> toItemDtoList(List<WorkOrderItem> entities);
}
