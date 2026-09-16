package com.minierp.modules.quotation.dto;

import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.quotation.entity.QuotationStatus;
import com.minierp.modules.quotation.entity.QuotationType;
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
public class QuotationResponse {

    private Long id;
    private String quotationNumber;
    private QuotationType type;
    private BusinessPartnerDto partner;
    private QuotationStatus status;
    private OffsetDateTime issueDate;
    private OffsetDateTime validUntil;
    private String currency;
    private BigDecimal subtotalAmount;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String notes;
    private Map<String, Object> metadata;
    private List<QuotationItemResponse> items;
    private OffsetDateTime createdAt;
}
