-- ============================================================================
-- Modül 13: İrsaliye Kalemleri ve Stok Hareketlerine Parti/Lot Numarası (Traceability) Desteği
-- ============================================================================

-- 1. İrsaliye Kalemleri Tablosuna lot_number Sütunu Ekleme
ALTER TABLE waybill_items
    ADD COLUMN IF NOT EXISTS lot_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_waybill_items_lot ON waybill_items(lot_number);

-- 2. Stok Hareket Kütüğü Tablosuna lot_number Sütunu Ekleme
ALTER TABLE stock_movements
    ADD COLUMN IF NOT EXISTS lot_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_stock_movements_lot ON stock_movements(lot_number);

-- 3. Mevcut İrsaliye Kalemleri için Gerçekçi Örnek Lot Numaraları Atama
UPDATE waybill_items wi
SET lot_number = 'LOT-2026-' || LPAD((wi.id % 40 + 101)::text, 4, '0')
WHERE wi.lot_number IS NULL;

-- 4. Mevcut Stok Hareketleri için Lot Numarası Atama
UPDATE stock_movements sm
SET lot_number = 'LOT-2026-' || LPAD((sm.id % 40 + 101)::text, 4, '0')
WHERE sm.lot_number IS NULL;
