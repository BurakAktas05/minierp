package com.minierp.modules.waybill.entity;

public enum WaybillType {
    DISPATCH, // Sevk İrsaliyesi (Müşteriye mal çıkışı - fiili & rezerve stok düşer)
    RECEIPT   // Alış / Tesellüm İrsaliyesi (Tedarikçiden mal kabulü - fiili stok artar)
}
