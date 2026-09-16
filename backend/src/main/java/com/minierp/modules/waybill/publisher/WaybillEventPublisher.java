package com.minierp.modules.waybill.publisher;

import com.minierp.modules.waybill.event.WaybillDispatchedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * İrsaliye olaylarını RabbitMQ Topic Exchange üzerinden yayınlayan bileşen.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WaybillEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${minierp.events.exchange:minierp.events.exchange}")
    private String exchangeName;

    @Value("${minierp.events.waybill-dispatched-key:waybill.dispatched}")
    private String waybillDispatchedKey;

    public void publishWaybillDispatched(WaybillDispatchedEvent event) {
        log.info("RabbitMQ'ya İrsaliye Sevk Olayı gönderiliyor: İrsaliyeNo={}, Kiracı={}, KalemAdedi={}",
                event.getWaybillNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, waybillDispatchedKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı, irsaliye sevk olayı kuyruğa iletilemedi (RabbitMQ çevrimdışı olabilir): {}", e.getMessage());
        }
    }
}
