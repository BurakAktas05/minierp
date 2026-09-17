-- ============================================================================
-- Modül 11: Belge Numarası Serileri ve Cari Hesap Kodu İyileştirmeleri
-- ============================================================================

-- 1. Belge Numara Serisi Tablosu (Sıralı, boşluksuz belge numarası üretimi)
CREATE TABLE IF NOT EXISTS document_sequences (
    id BIGSERIAL PRIMARY KEY,
    document_type VARCHAR(30) NOT NULL,  -- INVOICE, ORDER, QUOTATION, WAYBILL, PAYMENT, PARTNER
    prefix VARCHAR(20) NOT NULL,          -- FTR-SAT, FTR-ALS, SIP-SAT, SIP-ALS, TEK-SAT, TEK-ALS, IRS, ODM, CAR
    year INTEGER NOT NULL,
    last_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_doc_seq_type_prefix_year UNIQUE (document_type, prefix, year)
);

-- Başlangıç seri kayıtları (2026 yılı)
INSERT INTO document_sequences (document_type, prefix, year, last_number) VALUES
    ('INVOICE',    'FTR-SAT', 2026, 0),
    ('INVOICE',    'FTR-ALS', 2026, 0),
    ('ORDER',      'SIP-SAT', 2026, 0),
    ('ORDER',      'SIP-ALS', 2026, 0),
    ('QUOTATION',  'TEK-SAT', 2026, 0),
    ('QUOTATION',  'TEK-ALS', 2026, 0),
    ('WAYBILL',    'IRS-SVK', 2026, 0),
    ('WAYBILL',    'IRS-ALS', 2026, 0),
    ('PAYMENT',    'ODM',     2026, 0),
    ('PARTNER',    'CAR',     2026, 0)
ON CONFLICT (document_type, prefix, year) DO NOTHING;

-- İndeks
CREATE INDEX IF NOT EXISTS idx_doc_seq_type_prefix ON document_sequences(document_type, prefix, year);

-- 2. Cari Hesap Kodu Kolonu Ekleme
ALTER TABLE business_partners
    ADD COLUMN IF NOT EXISTS code VARCHAR(20);

-- Mevcut cari hesaplara kod ata
UPDATE business_partners
SET code = 'CAR-' || LPAD(id::text, 5, '0')
WHERE code IS NULL;

-- Unique constraint ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_partner_code') THEN
        ALTER TABLE business_partners ADD CONSTRAINT uk_partner_code UNIQUE (code);
    END IF;
END$$;

-- 3. Stok Hareketleri tablosu için eksik entity desteği indeksleri (V3'te tablo zaten var)
-- Hareket numarası indeksi (zaten V3'te tanımlı, burada emin olmak için)
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_number ON stock_movements(movement_number);
