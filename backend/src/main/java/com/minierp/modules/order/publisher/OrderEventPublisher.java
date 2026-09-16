package com.minierp.modules.order.publisher;

import com.minierp.modules.order.event.OrderCancelledEvent;
import com.minierp.modules.order.event.OrderConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Sipariş onay ve iptal olaylarını RabbitMQ Topic Exchange üzerinden yayınlayan bileşen.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${minierp.events.exchange:minierp.events.exchange}")
    private String exchangeName;

    @Value("${minierp.events.order-confirmed-key:order.confirmed}")
    private String orderConfirmedKey;

    @Value("${minierp.events.order-cancelled-key:order.cancelled}")
    private String orderCancelledKey;

    public void publishOrderConfirmed(OrderConfirmedEvent event) {
        log.info("RabbitMQ'ya Sipariş Onay Olayı gönderiliyor: SiparişNo={}, Kiracı={}, KalemAdedi={}",
                event.getOrderNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, orderConfirmedKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı, sipariş onay olayı kuyruğa iletilemedi (RabbitMQ çevrimdışı olabilir): {}", e.getMessage());
        }
    }

    public void publishOrderCancelled(OrderCancelledEvent event) {
        log.info("RabbitMQ'ya Sipariş İptal Olayı gönderiliyor: SiparişNo={}, Kiracı={}, KalemAdedi={}",
                event.getOrderNumber(), event.getTenantId(), event.getItems().size());
        try {
            rabbitTemplate.convertAndSend(exchangeName, orderCancelledKey, event);
        } catch (Exception e) {
            log.warn("RabbitMQ bağlantısı kurulamadı, sipariş iptal olayı kuyruğa iletilemedi (RabbitMQ çevrimdışı olabilir): {}", e.getMessage());
        }
    }
}
