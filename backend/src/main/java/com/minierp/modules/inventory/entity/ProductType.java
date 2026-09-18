package com.minierp.modules.inventory.entity;

/**
 * Ürün ve hizmet kartı sınıflandırma tipleri.
 * Kurumsal ERP standartlarında hammadde, mamul ve hizmet izolasyonunu sağlar.
 */
public enum ProductType {
    FINISHED_GOOD,   // Üretilen nihai mamul (Satılabilir, BOM başlığı)
    RAW_MATERIAL,    // Üretimde tüketilen hammadde (BOM sarfiyat kalemi, doğrudan üretilemez)
    SEMI_FINISHED,   // Ara ürün / Yarı mamul (Hem üretilebilir hem sarf edilebilir)
    SERVICE,         // Hizmet / Danışmanlık / Lisans (Fiziksel stok ve BOM dışı)
    COMMERCIAL_GOOD  // Alınıp doğrudan satılan ticari mal (Üretim dışı)
}
