package com.minierp.modules.quotation.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.quotation.dto.CreateQuotationRequest;
import com.minierp.modules.quotation.dto.QuotationItemRequest;
import com.minierp.modules.quotation.dto.QuotationResponse;
import com.minierp.modules.quotation.entity.Quotation;
import com.minierp.modules.quotation.entity.QuotationItem;
import com.minierp.modules.quotation.entity.QuotationStatus;
import com.minierp.modules.quotation.entity.QuotationType;
import com.minierp.modules.quotation.mapper.QuotationMapper;
import com.minierp.modules.quotation.repository.QuotationRepository;
import com.minierp.modules.quotation.service.QuotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationServiceImpl implements QuotationService {

    private final QuotationRepository quotationRepository;
    private final BusinessPartnerRepository businessPartnerRepository;
    private final ProductVariantRepository productVariantRepository;
    private final QuotationMapper quotationMapper;

    @Override
    @Transactional
    public QuotationResponse createQuotation(CreateQuotationRequest request) {
        BusinessPartner partner = businessPartnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", request.getPartnerId()));

        String prefix = request.getType() == QuotationType.SALES ? "TEK-SAT-" : "TEK-ALS-";
        String quotationNumber = prefix + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Quotation quotation = Quotation.builder()
                .quotationNumber(quotationNumber)
                .type(request.getType())
                .partner(partner)
                .status(QuotationStatus.DRAFT)
                .issueDate(OffsetDateTime.now())
                .validUntil(request.getValidUntil())
                .currency(request.getCurrency() != null ? request.getCurrency() : "TRY")
                .notes(request.getNotes())
                .metadata(request.getMetadata())
                .build();

        BigDecimal subtotalSum = BigDecimal.ZERO;
        BigDecimal taxSum = BigDecimal.ZERO;
        BigDecimal discountSum = BigDecimal.ZERO;

        for (QuotationItemRequest itemReq : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı", "id", itemReq.getVariantId()));

            BigDecimal unitPrice = itemReq.getUnitPrice();
            BigDecimal quantity = BigDecimal.valueOf(itemReq.getQuantity());

            // İskonto hesabı
            BigDecimal discountRate = itemReq.getDiscountRate() != null ? itemReq.getDiscountRate() : BigDecimal.ZERO;
            BigDecimal lineGross = unitPrice.multiply(quantity);
            BigDecimal lineDiscount = lineGross.multiply(discountRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineNet = lineGross.subtract(lineDiscount);

            // KDV hesabı
            BigDecimal taxRate = itemReq.getTaxRate() != null ? itemReq.getTaxRate() : BigDecimal.valueOf(20);
            BigDecimal lineTax = lineNet.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            subtotalSum = subtotalSum.add(lineGross);
            discountSum = discountSum.add(lineDiscount);
            taxSum = taxSum.add(lineTax);

            QuotationItem item = QuotationItem.builder()
                    .variant(variant)
                    .description(itemReq.getDescription() != null ? itemReq.getDescription() : variant.getVariantName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .discountRate(discountRate)
                    .taxRate(taxRate)
                    .subtotal(lineNet.add(lineTax))
                    .build();

            quotation.addItem(item);
        }

        quotation.setSubtotalAmount(subtotalSum);
        quotation.setDiscountAmount(discountSum);
        quotation.setTaxAmount(taxSum);
        quotation.setTotalAmount(subtotalSum.subtract(discountSum).add(taxSum));

        Quotation saved = quotationRepository.save(quotation);
        log.info("Yeni B2B Teklif oluşturuldu: No={}, Tür={}, Cari={}, Tutar={}",
                saved.getQuotationNumber(), saved.getType(), partner.getName(), saved.getTotalAmount());

        return quotationMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuotationResponse> getAllQuotations(QuotationType type) {
        List<Quotation> quotations = (type != null)
                ? quotationRepository.findByType(type)
                : quotationRepository.findAll();
        return quotationMapper.toResponseList(quotations);
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationResponse getQuotationById(Long id) {
        Quotation quotation = quotationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teklif", "id", id));
        return quotationMapper.toResponse(quotation);
    }

    @Override
    @Transactional
    public QuotationResponse updateQuotationStatus(Long id, QuotationStatus newStatus) {
        Quotation quotation = quotationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teklif", "id", id));

        QuotationStatus oldStatus = quotation.getStatus();

        if (oldStatus == newStatus) {
            return quotationMapper.toResponse(quotation);
        }

        if (oldStatus == QuotationStatus.REJECTED || oldStatus == QuotationStatus.EXPIRED || oldStatus == QuotationStatus.CONVERTED) {
            throw new BusinessException("Kapanmış veya siparişe dönüştürülmüş teklif durumu değiştirilemez!");
        }

        quotation.setStatus(newStatus);
        Quotation updated = quotationRepository.save(quotation);
        log.info("Teklif durumu güncellendi: No={}, Eski Durum={}, Yeni Durum={}",
                updated.getQuotationNumber(), oldStatus, newStatus);

        return quotationMapper.toResponse(updated);
    }
}
