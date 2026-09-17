package com.minierp.modules.waybill.publisher;

import com.minierp.modules.waybill.event.WaybillDispatchedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * İrsaliye olaylarını RabbitMQ Topic Exchange üzerinden yayınlayan bileşen.
 * RabbitMQ çevrimdışı olduğunda Spring ApplicationEventPublisher ile dahili domain event yayınlayarak
 * stok fulfillment sürecinin aksamamasını sağlar.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WaybillEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Value("${minierp.events.exchange:minierp.events.exchange}")
    private String exchangeName;

    @Value("${minierp.events.waybill-dispatched-key:waybill.dispatched}")
    private String waybillDispatchedKey;

    @Value("${minierp.events.waybill-cancelled-key:waybill.cancelled}")
    private String waybillCancelledKey;

    public void publishWaybillDispatched(WaybillDispatchedEvent event) {
        log.info("İrsaliye Sevk Olayı iletiliyor: İrsaliyeNo={}, Kiracı={}, KalemAdedi={}",
                event.getWaybillNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, waybillDispatchedKey, event);
            log.info("RabbitMQ'ya başarıyla iletildi: İrsaliyeNo={}", event.getWaybillNumber());
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı ({}), dahili Spring Domain Event devreye alınıyor...", e.getMessage());
            applicationEventPublisher.publishEvent(event);
        }
    }

    public void publishWaybillCancelled(com.minierp.modules.waybill.event.WaybillCancelledEvent event) {
        log.info("İrsaliye İptal Olayı (Stok İadesi) iletiliyor: İrsaliyeNo={}, Kiracı={}, KalemAdedi={}",
                event.getWaybillNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, waybillCancelledKey, event);
            log.info("RabbitMQ'ya başarıyla iletildi: İrsaliyeNo={}", event.getWaybillNumber());
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı ({}), dahili Spring Domain Event devreye alınıyor...", e.getMessage());
            applicationEventPublisher.publishEvent(event);
        }
    }
}
