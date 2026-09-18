package com.minierp.core.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Topic Exchange, Kuyruklar, Binding'ler ve JSON mesaj dönüştürücü yapılandırması.
 */
@Configuration
public class RabbitMqConfig {

    @Value("${minierp.events.exchange:minierp.events.exchange}")
    private String exchangeName;

    @Value("${minierp.events.order-reservation-queue:minierp.inventory.order-reservation.queue}")
    private String orderReservationQueueName;

    @Value("${minierp.events.waybill-fulfillment-queue:minierp.inventory.waybill-fulfillment.queue}")
    private String waybillFulfillmentQueueName;

    @Value("${minierp.events.order-confirmed-key:order.confirmed}")
    private String orderConfirmedKey;

    @Value("${minierp.events.order-cancelled-key:order.cancelled}")
    private String orderCancelledKey;

    @Value("${minierp.events.waybill-dispatched-key:waybill.dispatched}")
    private String waybillDispatchedKey;

    @Bean
    public TopicExchange eventsExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    // 1. Sipariş Onay & İptal Kuyruğu (Stok Rezervasyonu / İadesi)
    @Bean
    public Queue orderReservationQueue() {
        return QueueBuilder.durable(orderReservationQueueName).build();
    }

    @Bean
    public Binding orderConfirmedBinding(Queue orderReservationQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(orderReservationQueue).to(eventsExchange).with(orderConfirmedKey);
    }

    @Bean
    public Binding orderCancelledBinding(Queue orderReservationQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(orderReservationQueue).to(eventsExchange).with(orderCancelledKey);
    }

    // 2. İrsaliye Sevk Kuyruğu (Fiziki Stok Tamamlama / Fulfillment)
    @Bean
    public Queue waybillFulfillmentQueue() {
        return QueueBuilder.durable(waybillFulfillmentQueueName).build();
    }

    @Bean
    public Binding waybillDispatchedBinding(Queue waybillFulfillmentQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(waybillFulfillmentQueue).to(eventsExchange).with(waybillDispatchedKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper typeMapper =
                new org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper();
        typeMapper.setTrustedPackages("*");
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
