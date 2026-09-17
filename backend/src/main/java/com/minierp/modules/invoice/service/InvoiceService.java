package com.minierp.modules.invoice.service;

import com.minierp.modules.invoice.dto.*;
import com.minierp.modules.invoice.entity.InvoiceStatus;
import com.minierp.modules.invoice.entity.InvoiceType;

import java.util.List;

public interface InvoiceService {

    InvoiceResponse createInvoice(CreateInvoiceRequest request);

    InvoiceResponse createInvoiceFromWaybill(Long waybillId);

    InvoiceResponse createInvoiceFromOrder(Long orderId);

    List<InvoiceResponse> getAllInvoices(InvoiceType type);

    InvoiceResponse getInvoiceById(Long id);

    InvoiceResponse updateInvoice(Long id, CreateInvoiceRequest request);

    InvoiceResponse updateInvoiceStatus(Long id, InvoiceStatus newStatus);

    // Ödeme işlemleri (fatura üzerinden - Yaklaşım 1)
    PaymentResponse addPayment(CreatePaymentRequest request);

    List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId);

    List<PaymentResponse> getAllPayments();
}
