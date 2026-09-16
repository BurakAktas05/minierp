package com.minierp.modules.quotation.entity;

public enum QuotationStatus {
    DRAFT,      // Taslak
    SENT,       // Müşteriye/Tedarikçiye Gönderildi
    ACCEPTED,   // Karşı Taraf Şartları Kabul Etti (Henüz stok rezerve edilmedi)
    REJECTED,   // Reddedildi
    EXPIRED,    // Süresi Doldu
    CONVERTED   // İşletme Tarafından Resmi Siparişe Dönüştürüldü
}
