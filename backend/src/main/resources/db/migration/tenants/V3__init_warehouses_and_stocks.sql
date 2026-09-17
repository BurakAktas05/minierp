-- ============================================================================
-- Modül 3: Çoklu Depo ve Stok Yönetimi (Warehouse & Stocks Ledger)
-- ============================================================================

-- 1. Depolar (Warehouses - Çoklu Depo Yönetimi)
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 2. Depo Bazlı Varyant Stok Bakiyeleri (Warehouse Stocks - Gerçek Stok Kaynağı)
CREATE TABLE IF NOT EXISTS warehouse_stocks (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 0.000 CHECK (quantity >= 0),
    reserved_stock NUMERIC(15, 3) NOT NULL DEFAULT 0.000 CHECK (reserved_stock >= 0),
    shelf_location VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT uk_warehouse_variant UNIQUE (warehouse_id, variant_id)
);

-- 3. Stok Hareket Kütüğü (Stock Movements - Denetlenebilir Hareket Günlüğü / Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    movement_number VARCHAR(50) NOT NULL UNIQUE,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('GOODS_RECEIPT', 'GOODS_ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN')),
    source_warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    target_warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    reference_type VARCHAR(30), -- WAYBILL, ORDER, INVENTORY_COUNT, MANUAL
    reference_id BIGINT,
    notes TEXT,
    performed_by VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);
