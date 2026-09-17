package com.minierp.modules.waybill.event;

import com.minierp.core.event.BaseEvent;
import com.minierp.modules.waybill.entity.WaybillType;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

/**
 * Sevk edilmiş bir irsaliye iptal edildiğinde (CANCELLED) fırlatılan asenkron olay.
 * Depodan çıkmış malların depoya iadesini veya depoya girmiş malların çıkışını (ters stok hareketi) tetikler.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class WaybillCancelledEvent extends BaseEvent {

    private Long waybillId;
    private String waybillNumber;
    private WaybillType type;
    private Long orderId;
    private Long sourceWarehouseId;
    private Long targetWarehouseId;
    private List<WaybillItemEventPayload> items;
}
