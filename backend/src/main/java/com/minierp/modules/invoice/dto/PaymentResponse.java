package com.minierp.modules.invoice.dto;

import com.minierp.modules.invoice.entity.PaymentMethod;
import com.minierp.modules.invoice.entity.PaymentStatus;
import com.minierp.modules.invoice.entity.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private String paymentNumber;
    private PaymentType paymentType;
    private Long invoiceId;
    private String invoiceNumber;
    private Long partnerId;
    private String partnerName;
    private BigDecimal amount;
    private String currency;
    private BigDecimal exchangeRate;
    private PaymentMethod paymentMethod;
    private OffsetDateTime paymentDate;
    private String referenceNumber;
    private Long accountId;
    private String accountName;
    private PaymentStatus status;
    private String notes;
    private OffsetDateTime createdAt;
}
