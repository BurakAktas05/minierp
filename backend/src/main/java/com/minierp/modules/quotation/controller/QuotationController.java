package com.minierp.modules.quotation.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.quotation.dto.CreateQuotationRequest;
import com.minierp.modules.quotation.dto.QuotationResponse;
import com.minierp.modules.quotation.entity.QuotationStatus;
import com.minierp.modules.quotation.entity.QuotationType;
import com.minierp.modules.quotation.service.QuotationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;

    @PostMapping
    public ResponseEntity<ApiResponse<QuotationResponse>> createQuotation(@Valid @RequestBody CreateQuotationRequest request) {
        QuotationResponse response = quotationService.createQuotation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("B2B Teklif başarıyla oluşturuldu", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuotationResponse>>> getAllQuotations(
            @RequestParam(required = false) QuotationType type) {
        List<QuotationResponse> quotations = quotationService.getAllQuotations(type);
        return ResponseEntity.ok(ApiResponse.success(quotations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationResponse>> getQuotationById(@PathVariable Long id) {
        QuotationResponse quotation = quotationService.getQuotationById(id);
        return ResponseEntity.ok(ApiResponse.success(quotation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationResponse>> updateQuotation(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuotationRequest request) {
        QuotationResponse response = quotationService.updateQuotation(id, request);
        return ResponseEntity.ok(ApiResponse.success("Teklif başarıyla güncellendi", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<QuotationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam QuotationStatus status) {
        QuotationResponse response = quotationService.updateQuotationStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Teklif durumu başarıyla güncellendi", response));
    }
}
