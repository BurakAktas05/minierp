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
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ ve Spring dahili domain olayları üzerinden gelen Sipariş ve İrsaliye olaylarını dinleyen servis.
 * Multi-tenancy context'ini yükleyerek doğru kiracı şemasında Rezerve ve Fiili stok işlemlerini yürütür.
 * RabbitMQ olmadığında da Spring ApplicationEventPublisher ile yerel ortamda %100 dayanıklılık (resilience) sağlar.
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

    @EventListener
    public void handleInternalOrderConfirmed(OrderConfirmedEvent event) {
        log.info("Dahili Spring Domain Olayı alındı: Sipariş Onaylandı -> {}", event.getOrderNumber());
        processOrderConfirmed(event);
    }

    @EventListener
    public void handleInternalOrderCancelled(OrderCancelledEvent event) {
        log.info("Dahili Spring Domain Olayı alındı: Sipariş İptal Edildi -> {}", event.getOrderNumber());
        processOrderCancelled(event);
    }

    private void processOrderConfirmed(OrderConfirmedEvent event) {
        log.info("Sipariş Onay Olayı İşleniyor -> Stok Rezerve Ediliyor: SiparişNo={}, Kiracı={}",
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
        log.info("Sipariş İptal Olayı İşleniyor -> Rezerve Stok İade Ediliyor: SiparişNo={}, Kiracı={}",
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
        processWaybillDispatched(event);
    }

    @EventListener
    public void handleInternalWaybillDispatched(WaybillDispatchedEvent event) {
        log.info("Dahili Spring Domain Olayı alındı: İrsaliye Sevk Edildi -> {}", event.getWaybillNumber());
        processWaybillDispatched(event);
    }

    private void processWaybillDispatched(WaybillDispatchedEvent event) {
        log.info("İrsaliye Sevk Olayı İşleniyor -> Depo Çıkışı/Girişi: İrsaliyeNo={}, Tür={}, Kiracı={}",
                event.getWaybillNumber(), event.getType(), event.getTenantId());

        TenantContext.setTenantId(event.getTenantId());
        try {
            Long warehouseId = event.getType() == WaybillType.DISPATCH ? event.getSourceWarehouseId() : event.getTargetWarehouseId();
            for (WaybillItemEventPayload item : event.getItems()) {
                if (event.getType() == WaybillType.DISPATCH) {
                    // Sevk İrsaliyesi: Mal depodan çıktı -> Hem fiili hem rezerve stok düşer (Depo ve Lot bazlı)
                    productVariantService.fulfillStock(item.getVariantId(), item.getQuantity(), warehouseId, item.getLotNumber());
                } else if (event.getType() == WaybillType.RECEIPT) {
                    // Alış İrsaliyesi: Mal depoya girdi -> Fiili stok artar (Depo ve Lot bazlı)
                    productVariantService.addPhysicalStock(item.getVariantId(), item.getQuantity(), warehouseId, item.getLotNumber());
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

    // ==========================================
    // 3. İRSALİYE İPTAL (TERS STOK HAREKETİ & İADE)
    // ==========================================

    @EventListener
    public void handleInternalWaybillCancelled(com.minierp.modules.waybill.event.WaybillCancelledEvent event) {
        log.info("Dahili Spring Domain Olayı alındı: İrsaliye İptal Edildi (Stok İadesi) -> {}", event.getWaybillNumber());
        processWaybillCancelled(event);
    }

    private void processWaybillCancelled(com.minierp.modules.waybill.event.WaybillCancelledEvent event) {
        log.info("İrsaliye İptal Olayı İşleniyor -> Depoya Ters Stok Hareketi: İrsaliyeNo={}, Tür={}, Kiracı={}",
                event.getWaybillNumber(), event.getType(), event.getTenantId());

        TenantContext.setTenantId(event.getTenantId());
        try {
            Long warehouseId = event.getType() == WaybillType.DISPATCH ? event.getSourceWarehouseId() : event.getTargetWarehouseId();
            for (WaybillItemEventPayload item : event.getItems()) {
                if (event.getType() == WaybillType.DISPATCH) {
                    // Sevk İrsaliyesi İptali: Sevk edilen mal depoya geri girer (Fiili stok artar)
                    productVariantService.addPhysicalStock(item.getVariantId(), item.getQuantity(), warehouseId);
                } else if (event.getType() == WaybillType.RECEIPT) {
                    // Alış İrsaliyesi İptali: Depoya alınan mal geri iade edilir (Fiili stok düşer)
                    productVariantService.updateStock(item.getVariantId(), -item.getQuantity(), warehouseId);
                }
            }
            log.info("İrsaliye iptaline istinaden ters stok iadesi başarıyla tamamlandı: İrsaliyeNo={}", event.getWaybillNumber());
        } catch (Exception e) {
            log.error("İrsaliye iptal stok iadesi sırasında hata: İrsaliyeNo={}, Hata={}",
                    event.getWaybillNumber(), e.getMessage(), e);
            throw e;
        } finally {
            TenantContext.clear();
        }
    }
}
