package com.minierp.modules.waybill.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.core.multitenancy.TenantContext;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.order.entity.Order;
import com.minierp.modules.order.entity.OrderItem;
import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.order.repository.OrderRepository;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.waybill.dto.CreateWaybillRequest;
import com.minierp.modules.waybill.dto.WaybillItemRequest;
import com.minierp.modules.waybill.dto.WaybillResponse;
import com.minierp.modules.waybill.entity.Waybill;
import com.minierp.modules.waybill.entity.WaybillItem;
import com.minierp.modules.waybill.entity.WaybillStatus;
import com.minierp.modules.waybill.entity.WaybillType;
import com.minierp.modules.waybill.event.WaybillDispatchedEvent;
import com.minierp.modules.waybill.event.WaybillItemEventPayload;
import com.minierp.modules.waybill.mapper.WaybillMapper;
import com.minierp.modules.waybill.publisher.WaybillEventPublisher;
import com.minierp.modules.waybill.repository.WaybillRepository;
import com.minierp.modules.waybill.service.WaybillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaybillServiceImpl implements WaybillService {

    private final WaybillRepository waybillRepository;
    private final BusinessPartnerRepository businessPartnerRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderRepository orderRepository;
    private final WaybillMapper waybillMapper;
    private final WaybillEventPublisher waybillEventPublisher;

    @Override
    @Transactional
    public WaybillResponse createWaybill(CreateWaybillRequest request) {
        BusinessPartner partner = businessPartnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", request.getPartnerId()));

        String prefix = request.getType() == WaybillType.DISPATCH ? "IRS-SVK-" : "IRS-ALS-";
        String waybillNumber = prefix + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Waybill waybill = Waybill.builder()
                .waybillNumber(waybillNumber)
                .type(request.getType())
                .partner(partner)
                .orderId(request.getOrderId())
                .status(WaybillStatus.DRAFT)
                .dispatchDate(request.getDispatchDate() != null ? request.getDispatchDate() : OffsetDateTime.now())
                .deliveryDate(request.getDeliveryDate())
                .carrierCompany(request.getCarrierCompany())
                .trackingNumber(request.getTrackingNumber())
                .vehiclePlate(request.getVehiclePlate())
                .notes(request.getNotes())
                .metadata(request.getMetadata())
                .build();

        for (WaybillItemRequest itemReq : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", itemReq.getVariantId()));

            WaybillItem item = WaybillItem.builder()
                    .variant(variant)
                    .description(itemReq.getDescription() != null ? itemReq.getDescription() : variant.getVariantName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO)
                    .build();

            waybill.addItem(item);
        }

        Waybill saved = waybillRepository.save(waybill);
        log.info("Yeni irsaliye taslak olarak oluşturuldu: No={}, Tür={}, Cari={}",
                saved.getWaybillNumber(), saved.getType(), partner.getName());

        return waybillMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public WaybillResponse createWaybillFromOrder(Long orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş", "id", orderId));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException(String.format(
                    "Yalnızca onaylanmış (CONFIRMED) siparişlerden irsaliye oluşturulabilir! Mevcut Durum: %s",
                    order.getStatus()));
        }

        WaybillType waybillType = order.getOrderType() == OrderType.SALES_ORDER ? WaybillType.DISPATCH : WaybillType.RECEIPT;
        String prefix = waybillType == WaybillType.DISPATCH ? "IRS-SVK-" : "IRS-ALS-";
        String waybillNumber = prefix + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Waybill waybill = Waybill.builder()
                .waybillNumber(waybillNumber)
                .type(waybillType)
                .partner(order.getPartner())
                .orderId(order.getId())
                .status(WaybillStatus.DRAFT)
                .dispatchDate(OffsetDateTime.now())
                .deliveryDate(order.getDeliveryDate())
                .notes("Siparişten türetildi: " + order.getOrderNumber())
                .metadata(order.getMetadata())
                .build();

        for (OrderItem oItem : order.getItems()) {
            WaybillItem item = WaybillItem.builder()
                    .variant(oItem.getVariant())
                    .description(oItem.getDescription())
                    .quantity(oItem.getQuantity())
                    .unitPrice(oItem.getUnitPrice())
                    .build();
            waybill.addItem(item);
        }

        Waybill saved = waybillRepository.save(waybill);
        log.info("Siparişten irsaliye türetildi: SiparişNo={}, İrsaliyeNo={}",
                order.getOrderNumber(), saved.getWaybillNumber());

        return waybillMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WaybillResponse> getAllWaybills(WaybillType type) {
        List<Waybill> waybills = (type != null)
                ? waybillRepository.findByType(type)
                : waybillRepository.findAll();
        return waybillMapper.toResponseList(waybills);
    }

    @Override
    @Transactional(readOnly = true)
    public WaybillResponse getWaybillById(Long id) {
        Waybill waybill = waybillRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("İrsaliye", "id", id));
        return waybillMapper.toResponse(waybill);
    }

    @Override
    @Transactional
    public WaybillResponse updateWaybillStatus(Long id, WaybillStatus newStatus) {
        Waybill waybill = waybillRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("İrsaliye", "id", id));

        WaybillStatus oldStatus = waybill.getStatus();
        if (oldStatus == newStatus) {
            return waybillMapper.toResponse(waybill);
        }

        if (oldStatus == WaybillStatus.DELIVERED || oldStatus == WaybillStatus.CANCELLED) {
            throw new BusinessException("Teslim edilmiş veya iptal edilmiş bir irsaliyenin durumu değiştirilemez!");
        }

        waybill.setStatus(newStatus);
        Waybill updated = waybillRepository.save(waybill);
        log.info("İrsaliye durumu güncellendi: No={}, Eski Durum={}, Yeni Durum={}",
                updated.getWaybillNumber(), oldStatus, newStatus);

        // İrsaliye SEVK EDİLDİĞİNDE (DISPATCHED): RabbitMQ ile fiziki stok çıkışını/girişini tetikle!
        if (newStatus == WaybillStatus.DISPATCHED) {
            List<WaybillItemEventPayload> itemPayloads = updated.getItems().stream()
                    .map(item -> WaybillItemEventPayload.builder()
                            .variantId(item.getVariant().getId())
                            .sku(item.getVariant().getSku())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .build())
                    .toList();

            WaybillDispatchedEvent event = WaybillDispatchedEvent.builder()
                    .tenantId(TenantContext.getTenantId())
                    .waybillId(updated.getId())
                    .waybillNumber(updated.getWaybillNumber())
                    .type(updated.getType())
                    .orderId(updated.getOrderId())
                    .items(itemPayloads)
                    .build();

            waybillEventPublisher.publishWaybillDispatched(event);
        }

        return waybillMapper.toResponse(updated);
    }
}
