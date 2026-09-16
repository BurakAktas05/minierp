package com.minierp.modules.order.mapper;

import com.minierp.modules.order.dto.OrderItemResponse;
import com.minierp.modules.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OrderItemMapper {

    @Mapping(target = "variantId", source = "variant.id")
    @Mapping(target = "variantName", source = "variant.variantName")
    @Mapping(target = "sku", source = "variant.sku")
    OrderItemResponse toResponse(OrderItem entity);

    List<OrderItemResponse> toResponseList(List<OrderItem> entities);
}
