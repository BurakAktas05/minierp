package com.minierp.modules.invoice.controller;

import com.minierp.core.common.response.ApiResponse;
import com.minierp.modules.invoice.dto.*;
import com.minierp.modules.invoice.entity.InvoiceStatus;
import com.minierp.modules.invoice.entity.InvoiceType;
import com.minierp.modules.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fatura taslak olarak oluşturuldu", response));
    }

    @PostMapping("/from-waybill/{waybillId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoiceFromWaybill(@PathVariable Long waybillId) {
        InvoiceResponse response = invoiceService.createInvoiceFromWaybill(waybillId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("İrsaliyeden fatura başarıyla oluşturuldu", response));
    }

    @PostMapping("/from-order/{orderId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoiceFromOrder(@PathVariable Long orderId) {
        InvoiceResponse response = invoiceService.createInvoiceFromOrder(orderId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Siparişten fatura başarıyla oluşturuldu", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAllInvoices(
            @RequestParam(required = false) InvoiceType type) {
        List<InvoiceResponse> invoices = invoiceService.getAllInvoices(type);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long id) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(
            @PathVariable Long id,
            @Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.updateInvoice(id, request);
        return ResponseEntity.ok(ApiResponse.success("Fatura başarıyla güncellendi", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam InvoiceStatus status) {
        InvoiceResponse response = invoiceService.updateInvoiceStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Fatura durumu güncellendi", response));
    }

    // === ÖDEME ENDPOINTLERİ (Fatura üzerinden) ===

    @PostMapping("/{invoiceId}/payments")
    public ResponseEntity<ApiResponse<PaymentResponse>> addPayment(
            @PathVariable Long invoiceId,
            @Valid @RequestBody CreatePaymentRequest request) {
        request.setInvoiceId(invoiceId);
        PaymentResponse response = invoiceService.addPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ödeme başarıyla kaydedildi", response));
    }

    @GetMapping("/{invoiceId}/payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByInvoice(@PathVariable Long invoiceId) {
        List<PaymentResponse> payments = invoiceService.getPaymentsByInvoiceId(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        List<PaymentResponse> payments = invoiceService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.success(payments));
    }
}
