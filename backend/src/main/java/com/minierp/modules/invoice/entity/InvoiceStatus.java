package com.minierp.modules.invoice.entity;

public enum InvoiceStatus {
    DRAFT,          // Taslak
    APPROVED,       // Onaylandı
    SENT,           // Gönderildi (e-Fatura)
    PARTIALLY_PAID, // Kısmi Ödendi
    PAID,           // Tamamen Ödendi
    CANCELLED       // İptal Edildi
}
