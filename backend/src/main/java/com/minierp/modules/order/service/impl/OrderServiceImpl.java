package com.minierp.modules.order.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.core.common.service.DocumentNumberService;
import com.minierp.core.multitenancy.TenantContext;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.order.dto.CreateOrderRequest;
import com.minierp.modules.order.dto.OrderItemRequest;
import com.minierp.modules.order.dto.OrderResponse;
import com.minierp.modules.order.entity.Order;
import com.minierp.modules.order.entity.OrderItem;
import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.order.event.OrderCancelledEvent;
import com.minierp.modules.order.event.OrderConfirmedEvent;
import com.minierp.modules.order.event.OrderItemEventPayload;
import com.minierp.modules.order.mapper.OrderMapper;
import com.minierp.modules.order.publisher.OrderEventPublisher;
import com.minierp.modules.order.repository.OrderRepository;
import com.minierp.modules.order.service.OrderService;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.quotation.entity.Quotation;
import com.minierp.modules.quotation.entity.QuotationItem;
import com.minierp.modules.quotation.entity.QuotationStatus;
import com.minierp.modules.quotation.entity.QuotationType;
import com.minierp.modules.quotation.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final BusinessPartnerRepository businessPartnerRepository;
    private final ProductVariantRepository productVariantRepository;
    private final QuotationRepository quotationRepository;
    private final OrderMapper orderMapper;
    private final OrderEventPublisher orderEventPublisher;
    private final DocumentNumberService documentNumberService;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        BusinessPartner partner = businessPartnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", request.getPartnerId()));

        String prefix = request.getOrderType() == OrderType.SALES_ORDER ? "SIP-SAT" : "SIP-ALS";
        String orderNumber = documentNumberService.generateNumber("ORDER", prefix);

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .orderType(request.getOrderType())
                .partner(partner)
                .quotationId(request.getQuotationId())
                .status(OrderStatus.DRAFT)
                .orderDate(OffsetDateTime.now())
                .deliveryDate(request.getDeliveryDate())
                .currency(request.getCurrency() != null ? request.getCurrency() : "TRY")
                .notes(request.getNotes())
                .metadata(request.getMetadata())
                .build();

        processOrderItems(order, request.getItems(), partner.getId(), request.getOrderType());
        Order saved = orderRepository.save(order);
        log.info("Yeni resmi sipariş taslak olarak oluşturuldu: No={}, Tür={}, Cari={}",
                saved.getOrderNumber(), saved.getOrderType(), partner.getName());

        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse createOrderFromQuotation(Long quotationId) {
        Quotation quotation = quotationRepository.findByIdWithDetails(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Teklif", "id", quotationId));

        if (quotation.getStatus() != QuotationStatus.ACCEPTED) {
            throw new BusinessException(String.format(
                    "Yalnızca karşı tarafça kabul edilmiş (ACCEPTED) teklifler siparişe dönüştürülebilir! Mevcut Durum: %s",
                    quotation.getStatus()));
        }

        OrderType orderType = quotation.getType() == QuotationType.SALES ? OrderType.SALES_ORDER : OrderType.PURCHASE_ORDER;
        String prefix = orderType == OrderType.SALES_ORDER ? "SIP-SAT" : "SIP-ALS";
        String orderNumber = documentNumberService.generateNumber("ORDER", prefix);

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .orderType(orderType)
                .partner(quotation.getPartner())
                .quotationId(quotation.getId())
                .status(OrderStatus.DRAFT)
                .orderDate(OffsetDateTime.now())
                .deliveryDate(quotation.getValidUntil())
                .currency(quotation.getCurrency())
                .notes("Tekliften türetildi: " + quotation.getQuotationNumber())
                .metadata(quotation.getMetadata())
                .subtotalAmount(quotation.getSubtotalAmount())
                .taxAmount(quotation.getTaxAmount())
                .discountAmount(quotation.getDiscountAmount())
                .totalAmount(quotation.getTotalAmount())
                .build();

        for (QuotationItem qItem : quotation.getItems()) {
            OrderItem orderItem = OrderItem.builder()
                    .variant(qItem.getVariant())
                    .description(qItem.getDescription())
                    .quantity(qItem.getQuantity())
                    .unitPrice(qItem.getUnitPrice())
                    .taxRate(qItem.getTaxRate())
                    .discountRate(qItem.getDiscountRate())
                    .subtotal(qItem.getSubtotal())
                    .build();
            order.addItem(orderItem);
        }

        quotation.setStatus(QuotationStatus.CONVERTED);
        quotationRepository.save(quotation);

        Order saved = orderRepository.save(order);
        log.info("Teklif resmi siparişe dönüştürüldü: TeklifNo={}, SiparişNo={}",
                quotation.getQuotationNumber(), saved.getOrderNumber());

        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderType type) {
        List<Order> orders = (type != null)
                ? orderRepository.findByOrderType(type)
                : orderRepository.findAll();
        return orderMapper.toResponseList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş", "id", id));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrder(Long id, CreateOrderRequest request) {
        Order order = orderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş", "id", id));

        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessException("Sadece DRAFT durumundaki siparişler güncellenebilir! Mevcut Durum: " + order.getStatus());
        }

        if (request.getDeliveryDate() != null) order.setDeliveryDate(request.getDeliveryDate());
        if (request.getCurrency() != null) order.setCurrency(request.getCurrency());
        if (request.getNotes() != null) order.setNotes(request.getNotes());
        if (request.getMetadata() != null) order.setMetadata(request.getMetadata());

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            order.getItems().clear();
            processOrderItems(order, request.getItems(), order.getPartner().getId(), order.getOrderType());
        }

        Order updated = orderRepository.save(order);
        log.info("Sipariş güncellendi: No={}, Yeni Toplam={}", updated.getOrderNumber(), updated.getTotalAmount());

        return orderMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş", "id", id));

        OrderStatus oldStatus = order.getStatus();
        if (oldStatus == newStatus) {
            return orderMapper.toResponse(order);
        }

        if (oldStatus == OrderStatus.COMPLETED) {
            throw new BusinessException("Tamamlanmış bir siparişin durumu değiştirilemez!");
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        log.info("Sipariş durumu güncellendi: No={}, Eski Durum={}, Yeni Durum={}",
                updated.getOrderNumber(), oldStatus, newStatus);

        List<OrderItemEventPayload> itemPayloads = updated.getItems().stream()
                .map(item -> OrderItemEventPayload.builder()
                        .variantId(item.getVariant().getId())
                        .sku(item.getVariant().getSku())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .build())
                .toList();

        // 1. İşletme siparişi ONAYLADIĞINDA (CONFIRMED): RabbitMQ ile stok rezerve et
        if (newStatus == OrderStatus.CONFIRMED) {
            OrderConfirmedEvent event = OrderConfirmedEvent.builder()
                    .tenantId(TenantContext.getTenantId())
                    .orderId(updated.getId())
                    .orderNumber(updated.getOrderNumber())
                    .orderType(updated.getOrderType())
                    .items(itemPayloads)
                    .build();
            orderEventPublisher.publishOrderConfirmed(event);
        }
        // 2. Onaylanmış bir sipariş İPTAL EDİLDİĞİNDE: RabbitMQ ile rezerve stoğu iade et
        else if (newStatus == OrderStatus.CANCELLED && oldStatus == OrderStatus.CONFIRMED) {
            OrderCancelledEvent event = OrderCancelledEvent.builder()
                    .tenantId(TenantContext.getTenantId())
                    .orderId(updated.getId())
                    .orderNumber(updated.getOrderNumber())
                    .orderType(updated.getOrderType())
                    .items(itemPayloads)
                    .build();
            orderEventPublisher.publishOrderCancelled(event);
        }

        return orderMapper.toResponse(updated);
    }

    private void processOrderItems(Order order, List<OrderItemRequest> itemRequests, Long partnerId, OrderType orderType) {
        BigDecimal subtotalSum = BigDecimal.ZERO;
        BigDecimal taxSum = BigDecimal.ZERO;
        BigDecimal discountSum = BigDecimal.ZERO;

        for (OrderItemRequest req : itemRequests) {
            ProductVariant variant = productVariantRepository.findById(req.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", req.getVariantId()));

            // Birim fiyat: İstekte belirtildiyse onu kullan, yoksa ürün varyantının standart fiyatını al
            BigDecimal unitPrice;
            if (req.getUnitPrice() != null && req.getUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
                unitPrice = req.getUnitPrice();
            } else {
                BigDecimal defaultPrice = (orderType == OrderType.SALES_ORDER)
                        ? variant.getSalePrice()
                        : variant.getPurchasePrice();
                unitPrice = defaultPrice != null ? defaultPrice : BigDecimal.ZERO;
            }

            BigDecimal quantity = BigDecimal.valueOf(req.getQuantity());

            BigDecimal discountRate = req.getDiscountRate() != null ? req.getDiscountRate() : BigDecimal.ZERO;
            BigDecimal lineGross = unitPrice.multiply(quantity);
            BigDecimal lineDiscount = lineGross.multiply(discountRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineNet = lineGross.subtract(lineDiscount);

            BigDecimal taxRate = req.getTaxRate() != null ? req.getTaxRate() : BigDecimal.valueOf(20);
            BigDecimal lineTax = lineNet.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            subtotalSum = subtotalSum.add(lineGross);
            discountSum = discountSum.add(lineDiscount);
            taxSum = taxSum.add(lineTax);

            OrderItem item = OrderItem.builder()
                    .variant(variant)
                    .description(req.getDescription() != null ? req.getDescription() : variant.getVariantName())
                    .quantity(req.getQuantity())
                    .unitPrice(unitPrice)
                    .discountRate(discountRate)
                    .taxRate(taxRate)
                    .subtotal(lineNet.add(lineTax))
                    .build();

            order.addItem(item);
        }

        order.setSubtotalAmount(subtotalSum);
        order.setDiscountAmount(discountSum);
        order.setTaxAmount(taxSum);
        order.setTotalAmount(subtotalSum.subtract(discountSum).add(taxSum));
    }
}
