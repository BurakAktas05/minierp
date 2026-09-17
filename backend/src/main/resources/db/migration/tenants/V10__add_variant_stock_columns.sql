-- ============================================================================
-- Modül 10: Ürün Varyantları Konsolide ve Rezerve Stok Kolonları
-- ============================================================================

ALTER TABLE product_variants 
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0);
