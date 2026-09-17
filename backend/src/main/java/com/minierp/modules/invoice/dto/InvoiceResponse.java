package com.minierp.modules.invoice.dto;

import com.minierp.modules.invoice.entity.InvoiceStatus;
import com.minierp.modules.invoice.entity.InvoiceType;
import com.minierp.modules.partner.dto.BusinessPartnerDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private InvoiceType invoiceType;
    private BusinessPartnerDto partner;
    private Long orderId;
    private Long waybillId;
    private InvoiceStatus status;
    private OffsetDateTime invoiceDate;
    private OffsetDateTime dueDate;
    private String currency;
    private BigDecimal exchangeRate;
    private BigDecimal subtotalAmount;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String notes;
    private Map<String, Object> metadata;
    private List<InvoiceItemResponse> items;
    private List<PaymentResponse> payments;
    private OffsetDateTime createdAt;
}
