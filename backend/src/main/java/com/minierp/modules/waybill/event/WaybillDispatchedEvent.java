package com.minierp.modules.waybill.event;

import com.minierp.core.event.BaseEvent;
import com.minierp.modules.waybill.entity.WaybillType;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

/**
 * İrsaliye sevk edildiğinde (DISPATCHED) RabbitMQ'ya fırlatılan asenkron olay.
 * Depodan fiziki mal çıkışını veya depoya fiziki mal girişini tetikler.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WaybillDispatchedEvent extends BaseEvent {

    private Long waybillId;
    private String waybillNumber;
    private WaybillType type;
    private Long orderId;
    private List<WaybillItemEventPayload> items;
}
