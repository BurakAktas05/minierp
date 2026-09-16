package com.minierp.modules.order.entity;

public enum OrderStatus {
    DRAFT,      // Taslak (İnceleme aşamasında, stok rezerve edilmedi)
    CONFIRMED,  // Onaylandı (İşletme teyit etti -> RabbitMQ ile stok REZERVE edilir)
    CANCELLED,  // İptal Edildi (Onaylı sipariş iptal edilirse -> Rezerve stok serbest kalır)
    COMPLETED   // Tamamlandı (Sevkiyat ve irsaliyesi tamamlandı)
}
