-- ============================================================================
-- Modül 9: Üretim Reçetesi (BOM) ve İş Emirleri (Manufacturing & Work Orders)
-- 10 Farklı Sektörün (Tekstil, Gıda, Otomotiv, Mobilya, Elektronik, Kimya vb.)
-- Üretim, Montaj ve Sarfiyat Süreçlerini Kapsayan Esnek Veritabanı Modeli
-- ============================================================================

-- 1. Üretim Reçeteleri (Bill of Materials - BOM)
CREATE TABLE IF NOT EXISTS bill_of_materials (
    id BIGSERIAL PRIMARY KEY,
    bom_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT, -- Üretilecek Mamul / Yarı Mamul
    quantity NUMERIC(15, 3) NOT NULL DEFAULT 1.000 CHECK (quantity > 0),           -- Bu reçetenin ürettiği mamul miktarı
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',                                      -- Ölçü Birimi (ADET, METRE, KG, LITRE, KOLI)
    description TEXT,
    industry_type VARCHAR(50) DEFAULT 'GENERIC',                                   -- TEXTILE, FOOD_BEVERAGE, AUTOMOTIVE, FURNITURE, ELECTRONICS vb.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,                                            -- Sektöre özel parametreler (işçilik saati, hat no, standart maliyet)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 2. Reçete Kalemleri / Sarf Malzemeleri (BOM Items / Ingredients)
CREATE TABLE IF NOT EXISTS bom_items (
    id BIGSERIAL PRIMARY KEY,
    bom_id BIGINT NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    component_variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT, -- Tüketilecek hammadde/parça
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),                                    -- 1 birim reçete için gereken miktar
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',                                                -- ADET, METRE, KG, GR, LITRE
    scrap_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (scrap_rate >= 0.00),               -- Fire / Hurda Payı Yüzdesi (%)
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 3. Üretim İş Emirleri (Work Orders)
CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    bom_id BIGINT NOT NULL REFERENCES bill_of_materials(id) ON DELETE RESTRICT,
    sales_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,                           -- Varsa bağlı satış siparişi
    source_warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,                  -- Hammadde çıkış deposu
    target_warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,                  -- Bitmiş ürün giriş deposu
    planned_quantity NUMERIC(15, 3) NOT NULL CHECK (planned_quantity > 0),
    produced_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0.000 CHECK (produced_quantity >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    start_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,                                                       -- Seri/Lot numarası, vardiya, operatör
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 4. İş Emri Gerçekleşen Sarfiyat Satırları (Work Order Items)
CREATE TABLE IF NOT EXISTS work_order_items (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    component_variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    planned_quantity NUMERIC(15, 3) NOT NULL CHECK (planned_quantity > 0),
    consumed_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0.000 CHECK (consumed_quantity >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_boms_variant ON bill_of_materials(variant_id);
CREATE INDEX IF NOT EXISTS idx_boms_industry ON bill_of_materials(industry_type);
CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_component ON bom_items(component_variant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_bom ON work_orders(bom_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status_date ON work_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_source_wh ON work_orders(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_target_wh ON work_orders(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_work_order_items_wo ON work_order_items(work_order_id);
