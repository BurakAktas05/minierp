package com.minierp.modules.order.mapper;

import com.minierp.modules.order.dto.OrderResponse;
import com.minierp.modules.order.entity.Order;
import com.minierp.modules.partner.mapper.BusinessPartnerMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {BusinessPartnerMapper.class, OrderItemMapper.class})
public interface OrderMapper {

    @Mapping(target = "partner", source = "partner")
    @Mapping(target = "items", source = "items")
    OrderResponse toResponse(Order entity);

    List<OrderResponse> toResponseList(List<Order> entities);
}
