package com.minierp.modules.order.dto;

import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.partner.dto.BusinessPartnerDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private OrderType orderType;
    private BusinessPartnerDto partner;
    private Long quotationId;
    private OrderStatus status;
    private OffsetDateTime orderDate;
    private OffsetDateTime deliveryDate;
    private String currency;
    private BigDecimal subtotalAmount;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String notes;
    private Map<String, Object> metadata;
    private List<OrderItemResponse> items;
    private OffsetDateTime createdAt;
}
