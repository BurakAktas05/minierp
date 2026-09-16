package com.minierp.modules.inventory.entity;

/**
 * Kurumsal Stok Hareket Tipleri (Stock Movement Types).
 */
public enum StockMovementType {
    GOODS_RECEIPT,  // Satın alma veya iade kaynaklı depoya mal kabulü (+)
    GOODS_ISSUE,    // Satış veya sevk irsaliyesi ile depodan çıkış (-)
    TRANSFER,       // İki depo arasında stok transferi (virman)
    ADJUSTMENT,     // Sayım fazlası veya eksiği düzeltme fişi (+ / -)
    RETURN          // Müşteriden depoya iade girişi (+)
}
