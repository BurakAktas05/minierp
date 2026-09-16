package com.minierp.modules.waybill.entity;

public enum WaybillStatus {
    DRAFT,      // Taslak
    DISPATCHED, // Sevk Edildi (Yola Çıktı -> RabbitMQ ile fiziksel stok düşümü/artırımı tetiklenir)
    DELIVERED,  // Teslim Edildi
    CANCELLED   // İptal Edildi
}
