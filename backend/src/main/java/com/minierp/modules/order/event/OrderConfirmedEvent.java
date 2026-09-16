package com.minierp.modules.order.event;

import com.minierp.core.event.BaseEvent;
import com.minierp.modules.order.entity.OrderType;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

/**
 * İşletme siparişi teyit edip onayladığında (CONFIRMED) RabbitMQ'ya fırlatılan olay.
 * Stok rezervasyonu bu olayla tetiklenir.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OrderConfirmedEvent extends BaseEvent {

    private Long orderId;
    private String orderNumber;
    private OrderType orderType;
    private List<OrderItemEventPayload> items;
}
