package com.minierp.modules.quotation.service;

import com.minierp.modules.quotation.dto.CreateQuotationRequest;
import com.minierp.modules.quotation.dto.QuotationResponse;
import com.minierp.modules.quotation.entity.QuotationStatus;
import com.minierp.modules.quotation.entity.QuotationType;

import java.util.List;

public interface QuotationService {

    QuotationResponse createQuotation(CreateQuotationRequest request);

    List<QuotationResponse> getAllQuotations(QuotationType type);

    QuotationResponse getQuotationById(Long id);

    QuotationResponse updateQuotation(Long id, CreateQuotationRequest request);

    QuotationResponse updateQuotationStatus(Long id, QuotationStatus newStatus);
}
