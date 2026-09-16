package com.minierp.modules.order.event;

import com.minierp.core.event.BaseEvent;
import com.minierp.modules.order.entity.OrderType;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

/**
 * Onaylanmış bir sipariş iptal edildiğinde (CANCELLED) rezerve stoğu serbest bırakmak için fırlatılan olay.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OrderCancelledEvent extends BaseEvent {

    private Long orderId;
    private String orderNumber;
    private OrderType orderType;
    private List<OrderItemEventPayload> items;
}
