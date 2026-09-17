package com.minierp.modules.order.publisher;

import com.minierp.modules.order.event.OrderCancelledEvent;
import com.minierp.modules.order.event.OrderConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Sipariş onay ve iptal olaylarını RabbitMQ Topic Exchange üzerinden yayınlayan bileşen.
 * RabbitMQ çevrimdışı olduğunda (örn. yerel geliştirme veya kısıtlı kaynaklı sistemlerde)
 * Spring ApplicationEventPublisher ile dahili domain event yayınlayarak dayanıklılık (resilience) sağlar.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Value("${minierp.events.exchange:minierp.events.exchange}")
    private String exchangeName;

    @Value("${minierp.events.order-confirmed-key:order.confirmed}")
    private String orderConfirmedKey;

    @Value("${minierp.events.order-cancelled-key:order.cancelled}")
    private String orderCancelledKey;

    public void publishOrderConfirmed(OrderConfirmedEvent event) {
        log.info("Sipariş Onay Olayı iletiliyor: SiparişNo={}, Kiracı={}, KalemAdedi={}",
                event.getOrderNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, orderConfirmedKey, event);
            log.info("RabbitMQ'ya başarıyla iletildi: SiparişNo={}", event.getOrderNumber());
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı ({}), dahili Spring Domain Event devreye alınıyor...", e.getMessage());
            applicationEventPublisher.publishEvent(event);
        }
    }

    public void publishOrderCancelled(OrderCancelledEvent event) {
        log.info("Sipariş İptal Olayı iletiliyor: SiparişNo={}, Kiracı={}, KalemAdedi={}",
                event.getOrderNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, orderCancelledKey, event);
            log.info("RabbitMQ'ya başarıyla iletildi: SiparişNo={}", event.getOrderNumber());
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı ({}), dahili Spring Domain Event devreye alınıyor...", e.getMessage());
            applicationEventPublisher.publishEvent(event);
        }
    }
}
