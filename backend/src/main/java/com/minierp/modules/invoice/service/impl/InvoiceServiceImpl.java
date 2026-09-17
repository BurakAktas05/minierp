package com.minierp.modules.invoice.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.core.common.service.DocumentNumberService;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.invoice.dto.*;
import com.minierp.modules.invoice.entity.*;
import com.minierp.modules.invoice.mapper.InvoiceMapper;
import com.minierp.modules.invoice.mapper.PaymentMapper;
import com.minierp.modules.invoice.repository.InvoiceRepository;
import com.minierp.modules.invoice.repository.PaymentRepository;
import com.minierp.modules.invoice.service.InvoiceService;
import com.minierp.modules.order.entity.Order;
import com.minierp.modules.order.entity.OrderItem;
import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.order.repository.OrderRepository;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.waybill.entity.Waybill;
import com.minierp.modules.waybill.entity.WaybillItem;
import com.minierp.modules.waybill.entity.WaybillStatus;
import com.minierp.modules.waybill.entity.WaybillType;
import com.minierp.modules.waybill.repository.WaybillRepository;
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
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final BusinessPartnerRepository businessPartnerRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WaybillRepository waybillRepository;
    private final OrderRepository orderRepository;
    private final InvoiceMapper invoiceMapper;
    private final PaymentMapper paymentMapper;
    private final DocumentNumberService documentNumberService;
    private final com.minierp.modules.invoice.repository.TreasuryAccountRepository treasuryAccountRepository;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        BusinessPartner partner = businessPartnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", request.getPartnerId()));

        String prefix = request.getInvoiceType() == InvoiceType.SALES_INVOICE ? "FTR-SAT" : "FTR-ALS";
        String invoiceNumber = documentNumberService.generateNumber("INVOICE", prefix);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceType(request.getInvoiceType())
                .partner(partner)
                .orderId(request.getOrderId())
                .waybillId(request.getWaybillId())
                .status(InvoiceStatus.DRAFT)
                .invoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : OffsetDateTime.now())
                .dueDate(request.getDueDate())
                .currency(request.getCurrency() != null ? request.getCurrency() : "TRY")
                .exchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ONE)
                .notes(request.getNotes())
                .metadata(request.getMetadata())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (InvoiceItemRequest itemReq : request.getItems()) {
                ProductVariant variant = null;
                String description = itemReq.getDescription();

                if (itemReq.getVariantId() != null) {
                    variant = productVariantRepository.findById(itemReq.getVariantId())
                            .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", itemReq.getVariantId()));
                    if (description == null) {
                        description = variant.getVariantName();
                    }
                }

                BigDecimal lineGross = itemReq.getQuantity().multiply(itemReq.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);

                // İskonto hesabı (ERP best practice: kalem bazlı iskonto)
                BigDecimal discountRate = itemReq.getDiscountRate() != null ? itemReq.getDiscountRate() : BigDecimal.ZERO;
                BigDecimal lineDiscount = lineGross.multiply(discountRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                BigDecimal lineNet = lineGross.subtract(lineDiscount);

                // KDV hesabı (net tutar üzerinden)
                BigDecimal taxRate = itemReq.getTaxRate() != null ? itemReq.getTaxRate() : new BigDecimal("20.00");
                BigDecimal lineTax = lineNet.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                InvoiceItem item = InvoiceItem.builder()
                        .variant(variant)
                        .waybillItemId(itemReq.getWaybillItemId())
                        .description(description != null ? description : "Hizmet Kalemi")
                        .quantity(itemReq.getQuantity())
                        .unitPrice(itemReq.getUnitPrice())
                        .taxRate(taxRate)
                        .discountRate(discountRate)
                        .subtotal(lineNet)
                        .build();

                invoice.addItem(item);
                subtotal = subtotal.add(lineGross);
                totalDiscount = totalDiscount.add(lineDiscount);
                totalTax = totalTax.add(lineTax);
            }
        }

        invoice.setSubtotalAmount(subtotal);
        invoice.setDiscountAmount(totalDiscount);
        invoice.setTaxAmount(totalTax);
        invoice.setTotalAmount(subtotal.subtract(totalDiscount).add(totalTax));
        invoice.setRemainingAmount(subtotal.subtract(totalDiscount).add(totalTax));

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Yeni fatura oluşturuldu: No={}, Tür={}, Cari={}, Toplam={}",
                saved.getInvoiceNumber(), saved.getInvoiceType(), partner.getName(), saved.getTotalAmount());

        return invoiceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoiceFromWaybill(Long waybillId) {
        Waybill waybill = waybillRepository.findByIdWithDetails(waybillId)
                .orElseThrow(() -> new ResourceNotFoundException("İrsaliye", "id", waybillId));

        if (waybill.getStatus() != WaybillStatus.DISPATCHED && waybill.getStatus() != WaybillStatus.DELIVERED) {
            throw new BusinessException(String.format(
                    "Yalnızca sevk edilmiş veya teslim edilmiş irsaliyelerden fatura oluşturulabilir! Mevcut Durum: %s",
                    waybill.getStatus()));
        }

        // Aynı irsaliye için daha önce fatura kesilmiş mi kontrol et
        List<Invoice> existingInvoices = invoiceRepository.findByWaybillId(waybillId);
        if (!existingInvoices.isEmpty()) {
            throw new BusinessException("Bu irsaliye için zaten fatura kesilmiş: " + existingInvoices.get(0).getInvoiceNumber());
        }

        InvoiceType invoiceType = waybill.getType() == WaybillType.DISPATCH
                ? InvoiceType.SALES_INVOICE
                : InvoiceType.PURCHASE_INVOICE;

        String prefix = invoiceType == InvoiceType.SALES_INVOICE ? "FTR-SAT" : "FTR-ALS";
        String invoiceNumber = documentNumberService.generateNumber("INVOICE", prefix);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceType(invoiceType)
                .partner(waybill.getPartner())
                .orderId(waybill.getOrderId())
                .waybillId(waybill.getId())
                .status(InvoiceStatus.DRAFT)
                .invoiceDate(OffsetDateTime.now())
                .dueDate(OffsetDateTime.now().plusDays(30))
                .notes("İrsaliyeden faturalaştırıldı: " + waybill.getWaybillNumber())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (WaybillItem wItem : waybill.getItems()) {
            BigDecimal quantity = new BigDecimal(wItem.getQuantity());
            BigDecimal unitPrice = wItem.getUnitPrice();
            BigDecimal lineSubtotal = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            // KDV oranını ürün kartından al (ERP best practice: hardcoded KDV kullanma)
            BigDecimal taxRate = new BigDecimal("20.00"); // varsayılan
            if (wItem.getVariant() != null && wItem.getVariant().getProduct() != null) {
                taxRate = wItem.getVariant().getProduct().getTaxRate();
            }
            BigDecimal lineTax = lineSubtotal.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            InvoiceItem item = InvoiceItem.builder()
                    .variant(wItem.getVariant())
                    .waybillItemId(wItem.getId())
                    .description(wItem.getDescription())
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .taxRate(taxRate)
                    .discountRate(BigDecimal.ZERO)
                    .subtotal(lineSubtotal)
                    .build();

            invoice.addItem(item);
            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(lineTax);
        }

        invoice.setSubtotalAmount(subtotal);
        invoice.setTaxAmount(totalTax);
        invoice.setTotalAmount(subtotal.add(totalTax));
        invoice.setRemainingAmount(subtotal.add(totalTax));

        Invoice saved = invoiceRepository.save(invoice);
        log.info("İrsaliyeden fatura oluşturuldu: İrsaliyeNo={}, FaturaNo={}",
                waybill.getWaybillNumber(), saved.getInvoiceNumber());

        return invoiceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoiceFromOrder(Long orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sipariş", "id", orderId));

        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new BusinessException(String.format(
                    "Yalnızca onaylanmış veya tamamlanmış siparişlerden fatura oluşturulabilir! Mevcut Durum: %s",
                    order.getStatus()));
        }

        // Aynı sipariş için daha önce fatura kesilmiş mi kontrol et
        List<Invoice> existingInvoices = invoiceRepository.findByOrderId(orderId);
        if (!existingInvoices.isEmpty()) {
            throw new BusinessException("Bu sipariş için zaten fatura kesilmiş: " + existingInvoices.get(0).getInvoiceNumber());
        }

        InvoiceType invoiceType = order.getOrderType() == OrderType.SALES_ORDER
                ? InvoiceType.SALES_INVOICE
                : InvoiceType.PURCHASE_INVOICE;

        String prefix = invoiceType == InvoiceType.SALES_INVOICE ? "FTR-SAT" : "FTR-ALS";
        String invoiceNumber = documentNumberService.generateNumber("INVOICE", prefix);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceType(invoiceType)
                .partner(order.getPartner())
                .orderId(order.getId())
                .status(InvoiceStatus.DRAFT)
                .invoiceDate(OffsetDateTime.now())
                .dueDate(OffsetDateTime.now().plusDays(30))
                .currency(order.getCurrency())
                .exchangeRate(BigDecimal.ONE)
                .notes("Siparişten faturalaştırıldı: " + order.getOrderNumber())
                .metadata(order.getMetadata())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (OrderItem oItem : order.getItems()) {
            BigDecimal quantity = BigDecimal.valueOf(oItem.getQuantity());
            BigDecimal unitPrice = oItem.getUnitPrice();
            BigDecimal lineGross = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

            BigDecimal discountRate = oItem.getDiscountRate() != null ? oItem.getDiscountRate() : BigDecimal.ZERO;
            BigDecimal lineDiscount = lineGross.multiply(discountRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineNet = lineGross.subtract(lineDiscount);

            BigDecimal taxRate = oItem.getTaxRate() != null ? oItem.getTaxRate() : new BigDecimal("20.00");
            BigDecimal lineTax = lineNet.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            InvoiceItem item = InvoiceItem.builder()
                    .variant(oItem.getVariant())
                    .description(oItem.getDescription())
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .taxRate(taxRate)
                    .discountRate(discountRate)
                    .subtotal(lineNet)
                    .build();

            invoice.addItem(item);
            subtotal = subtotal.add(lineGross);
            totalDiscount = totalDiscount.add(lineDiscount);
            totalTax = totalTax.add(lineTax);
        }

        invoice.setSubtotalAmount(subtotal);
        invoice.setDiscountAmount(totalDiscount);
        invoice.setTaxAmount(totalTax);
        invoice.setTotalAmount(subtotal.subtract(totalDiscount).add(totalTax));
        invoice.setRemainingAmount(subtotal.subtract(totalDiscount).add(totalTax));

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Siparişten fatura oluşturuldu: SiparişNo={}, FaturaNo={}",
                order.getOrderNumber(), saved.getInvoiceNumber());

        return invoiceMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices(InvoiceType type) {
        List<Invoice> invoices = (type != null)
                ? invoiceRepository.findByInvoiceType(type)
                : invoiceRepository.findAll();
        return invoiceMapper.toResponseList(invoices);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fatura", "id", id));
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoice(Long id, CreateInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fatura", "id", id));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BusinessException("Sadece DRAFT durumundaki faturalar düzenlenebilir! Mevcut Durum: " + invoice.getStatus());
        }

        // Temel alanları güncelle
        if (request.getDueDate() != null) invoice.setDueDate(request.getDueDate());
        if (request.getCurrency() != null) invoice.setCurrency(request.getCurrency());
        if (request.getExchangeRate() != null) invoice.setExchangeRate(request.getExchangeRate());
        if (request.getNotes() != null) invoice.setNotes(request.getNotes());
        if (request.getMetadata() != null) invoice.setMetadata(request.getMetadata());

        // Kalemleri sıfırdan yeniden oluştur
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            invoice.getItems().clear();

            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            BigDecimal totalDiscount = BigDecimal.ZERO;

            for (InvoiceItemRequest itemReq : request.getItems()) {
                ProductVariant variant = null;
                String description = itemReq.getDescription();

                if (itemReq.getVariantId() != null) {
                    variant = productVariantRepository.findById(itemReq.getVariantId())
                            .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", itemReq.getVariantId()));
                    if (description == null) description = variant.getVariantName();
                }

                BigDecimal lineGross = itemReq.getQuantity().multiply(itemReq.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
                BigDecimal discountRate = itemReq.getDiscountRate() != null ? itemReq.getDiscountRate() : BigDecimal.ZERO;
                BigDecimal lineDiscount = lineGross.multiply(discountRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                BigDecimal lineNet = lineGross.subtract(lineDiscount);

                BigDecimal taxRate = itemReq.getTaxRate() != null ? itemReq.getTaxRate() : new BigDecimal("20.00");
                BigDecimal lineTax = lineNet.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                InvoiceItem item = InvoiceItem.builder()
                        .variant(variant)
                        .waybillItemId(itemReq.getWaybillItemId())
                        .description(description != null ? description : "Hizmet Kalemi")
                        .quantity(itemReq.getQuantity())
                        .unitPrice(itemReq.getUnitPrice())
                        .taxRate(taxRate)
                        .discountRate(discountRate)
                        .subtotal(lineNet)
                        .build();

                invoice.addItem(item);
                subtotal = subtotal.add(lineGross);
                totalDiscount = totalDiscount.add(lineDiscount);
                totalTax = totalTax.add(lineTax);
            }

            invoice.setSubtotalAmount(subtotal);
            invoice.setDiscountAmount(totalDiscount);
            invoice.setTaxAmount(totalTax);
            invoice.setTotalAmount(subtotal.subtract(totalDiscount).add(totalTax));
            invoice.setRemainingAmount(subtotal.subtract(totalDiscount).add(totalTax));
        }

        Invoice updated = invoiceRepository.save(invoice);
        log.info("Fatura güncellendi: No={}, Yeni Toplam={}", updated.getInvoiceNumber(), updated.getTotalAmount());

        return invoiceMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoiceStatus(Long id, InvoiceStatus newStatus) {
        Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fatura", "id", id));

        InvoiceStatus oldStatus = invoice.getStatus();
        if (oldStatus == newStatus) {
            return invoiceMapper.toResponse(invoice);
        }

        if (oldStatus == InvoiceStatus.PAID || oldStatus == InvoiceStatus.CANCELLED) {
            throw new BusinessException("Tamamen ödenmiş veya iptal edilmiş faturanın durumu değiştirilemez!");
        }

        invoice.setStatus(newStatus);
        Invoice updated = invoiceRepository.save(invoice);
        log.info("Fatura durumu güncellendi: No={}, Eski={}, Yeni={}",
                updated.getInvoiceNumber(), oldStatus, newStatus);

        // Fatura onaylandığında, bağlı sipariş varsa ve irsaliyesi de kesilmişse siparişi COMPLETED yap
        if (newStatus == InvoiceStatus.APPROVED && updated.getOrderId() != null) {
            orderRepository.findById(updated.getOrderId()).ifPresent(order -> {
                if (order.getStatus() == OrderStatus.CONFIRMED) {
                    // İrsaliye de kesilmiş mi kontrol et
                    boolean hasWaybill = updated.getWaybillId() != null;
                    if (hasWaybill) {
                        order.setStatus(OrderStatus.COMPLETED);
                        orderRepository.save(order);
                        log.info("Fatura onayı + irsaliye sevki tamamlandı, sipariş kapatıldı: SiparişNo={}",
                                order.getOrderNumber());
                    }
                }
            });
        }

        return invoiceMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public PaymentResponse addPayment(CreatePaymentRequest request) {
        Invoice invoice = invoiceRepository.findByIdWithDetails(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Fatura", "id", request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("Bu fatura zaten tamamen ödenmiş!");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException("İptal edilmiş faturaya ödeme yapılamaz!");
        }
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new BusinessException("Taslak durumundaki faturaya ödeme yapılamaz. Önce faturayı onaylayın!");
        }

        // Kalan bakiyeden fazla ödeme kontrolü
        if (request.getAmount().compareTo(invoice.getRemainingAmount()) > 0) {
            throw new BusinessException(String.format(
                    "Ödeme tutarı (%.2f) kalan bakiyeyi (%.2f) aşıyor!",
                    request.getAmount(), invoice.getRemainingAmount()));
        }

        PaymentType paymentType = invoice.getInvoiceType() == InvoiceType.SALES_INVOICE
                ? PaymentType.INCOMING
                : PaymentType.OUTGOING;

        String paymentNumber = documentNumberService.generateNumber("PAYMENT", "ODM");

        Payment payment = Payment.builder()
                .paymentNumber(paymentNumber)
                .paymentType(paymentType)
                .invoice(invoice)
                .partner(invoice.getPartner())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : invoice.getCurrency())
                .exchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : invoice.getExchangeRate())
                .paymentMethod(request.getPaymentMethod())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : OffsetDateTime.now())
                .referenceNumber(request.getReferenceNumber())
                .status(PaymentStatus.COMPLETED)
                .notes(request.getNotes())
                .build();

        // Kasa / Banka Hesabını Belirle ve Bakiyesini Güncelle
        TreasuryAccount account = null;
        if (request.getAccountId() != null) {
            account = treasuryAccountRepository.findById(request.getAccountId()).orElse(null);
        } else {
            TreasuryAccountType accType = request.getPaymentMethod() == PaymentMethod.CASH ? TreasuryAccountType.CASH : TreasuryAccountType.BANK;
            List<TreasuryAccount> activeAccs = treasuryAccountRepository.findByAccountTypeAndActiveTrue(accType);
            if (!activeAccs.isEmpty()) {
                account = activeAccs.get(0);
            }
        }

        if (account != null) {
            if (paymentType == PaymentType.INCOMING) {
                account.deposit(request.getAmount());
            } else {
                account.withdraw(request.getAmount());
            }
            treasuryAccountRepository.save(account);
            payment.setAccount(account);
            log.info("Kasa/Banka bakiyesi güncellendi: Hesap={}, Yeni Bakiye={}", account.getAccountName(), account.getCurrentBalance());
        }

        Payment savedPayment = paymentRepository.save(payment);

        // Fatura bakiye ve durumunu otomatik güncelle
        invoice.getPayments().add(savedPayment);
        invoice.recalculatePaymentStatus();
        invoiceRepository.save(invoice);

        log.info("Ödeme kaydedildi: No={}, Fatura={}, Tutar={}, Yöntem={}, Yeni Kalan={}",
                savedPayment.getPaymentNumber(), invoice.getInvoiceNumber(),
                savedPayment.getAmount(), savedPayment.getPaymentMethod(), invoice.getRemainingAmount());

        return paymentMapper.toResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId) {
        List<Payment> payments = paymentRepository.findByInvoiceId(invoiceId);
        return paymentMapper.toResponseList(payments);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        List<Payment> payments = paymentRepository.findAllWithDetails();
        return paymentMapper.toResponseList(payments);
    }
}
