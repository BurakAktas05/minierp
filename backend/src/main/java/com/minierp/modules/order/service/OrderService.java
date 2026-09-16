package com.minierp.modules.order.service;

import com.minierp.modules.order.dto.CreateOrderRequest;
import com.minierp.modules.order.dto.OrderResponse;
import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse createOrderFromQuotation(Long quotationId);

    List<OrderResponse> getAllOrders(OrderType type);

    OrderResponse getOrderById(Long id);

    OrderResponse updateOrderStatus(Long id, OrderStatus newStatus);
}
