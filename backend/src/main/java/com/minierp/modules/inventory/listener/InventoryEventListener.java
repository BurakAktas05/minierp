package com.minierp.modules.inventory.listener;

import com.minierp.core.multitenancy.TenantContext;
import com.minierp.modules.inventory.service.ProductVariantService;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.order.event.OrderCancelledEvent;
import com.minierp.modules.order.event.OrderConfirmedEvent;
import com.minierp.modules.order.event.OrderItemEventPayload;
import com.minierp.modules.waybill.entity.WaybillType;
import com.minierp.modules.waybill.event.WaybillDispatchedEvent;
import com.minierp.modules.waybill.event.WaybillItemEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ üzerinden gelen Sipariş ve İrsaliye olaylarını dinleyen servis.
 * Multi-tenancy context'ini yükleyerek doğru kiracı şemasında Rezerve ve Fiili stok işlemlerini yürütür.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryEventListener {

    private final ProductVariantService productVariantService;

    // ==========================================
    // 1. SİPARİŞ ONAY & İPTAL (REZERVE STOK)
    // ==========================================

    @RabbitListener(queues = "${minierp.events.order-reservation-queue:minierp.inventory.order-reservation.queue}")
    public void handleOrderEvents(Object event) {
        if (event instanceof OrderConfirmedEvent confirmedEvent) {
            processOrderConfirmed(confirmedEvent);
        } else if (event instanceof OrderCancelledEvent cancelledEvent) {
            processOrderCancelled(cancelledEvent);
        }
    }

    private void processOrderConfirmed(OrderConfirmedEvent event) {
        log.info("RabbitMQ: Sipariş Onay Olayı alındı -> Stok Rezerve Ediliyor: SiparişNo={}, Kiracı={}",
                event.getOrderNumber(), event.getTenantId());

        TenantContext.setTenantId(event.getTenantId());
        try {
            if (event.getOrderType() == OrderType.SALES_ORDER) {
                for (OrderItemEventPayload item : event.getItems()) {
                    productVariantService.reserveStock(item.getVariantId(), item.getQuantity());
                }
                log.info("Sipariş onayına istinaden stoklar rezerve edildi: SiparişNo={}", event.getOrderNumber());
            }
        } catch (Exception e) {
            log.error("Stok rezerve etme sırasında hata oluştu: SiparişNo={}, Hata={}",
                    event.getOrderNumber(), e.getMessage(), e);
            throw e;
        } finally {
            TenantContext.clear();
        }
    }

    private void processOrderCancelled(OrderCancelledEvent event) {
        log.info("RabbitMQ: Sipariş İptal Olayı alındı -> Rezerve Stok İade Ediliyor: SiparişNo={}, Kiracı={}",
                event.getOrderNumber(), event.getTenantId());

        TenantContext.setTenantId(event.getTenantId());
        try {
            if (event.getOrderType() == OrderType.SALES_ORDER) {
                for (OrderItemEventPayload item : event.getItems()) {
                    productVariantService.releaseReservedStock(item.getVariantId(), item.getQuantity());
                }
                log.info("Sipariş iptaline istinaden rezerve stoklar serbest bırakıldı: SiparişNo={}", event.getOrderNumber());
            }
        } catch (Exception e) {
            log.error("Rezerve stok iadesi sırasında hata oluştu: SiparişNo={}, Hata={}",
                    event.getOrderNumber(), e.getMessage(), e);
            throw e;
        } finally {
            TenantContext.clear();
        }
    }

    // ==========================================
    // 2. İRSALİYE SEVKİYAT (FİZİKİ STOK FULFILLMENT)
    // ==========================================

    @RabbitListener(queues = "${minierp.events.waybill-fulfillment-queue:minierp.inventory.waybill-fulfillment.queue}")
    public void handleWaybillDispatched(WaybillDispatchedEvent event) {
        log.info("RabbitMQ: İrsaliye Sevk Olayı alındı -> Depo Çıkışı/Girişi yapılıyor: İrsaliyeNo={}, Tür={}, Kiracı={}",
                event.getWaybillNumber(), event.getType(), event.getTenantId());

        TenantContext.setTenantId(event.getTenantId());
        try {
            for (WaybillItemEventPayload item : event.getItems()) {
                if (event.getType() == WaybillType.DISPATCH) {
                    // Sevk İrsaliyesi: Mal depodan çıktı -> Hem fiili hem rezerve stok düşer
                    productVariantService.fulfillStock(item.getVariantId(), item.getQuantity());
                } else if (event.getType() == WaybillType.RECEIPT) {
                    // Alış İrsaliyesi: Mal depoya girdi -> Fiili stok artar
                    productVariantService.addPhysicalStock(item.getVariantId(), item.getQuantity());
                }
            }
            log.info("İrsaliye sevkine istinaden fiziki stok güncellemesi tamamlandı: İrsaliyeNo={}", event.getWaybillNumber());
        } catch (Exception e) {
            log.error("İrsaliye stok düşümü/artırımı sırasında hata: İrsaliyeNo={}, Hata={}",
                    event.getWaybillNumber(), e.getMessage(), e);
            throw e;
        } finally {
            TenantContext.clear();
        }
    }
}
