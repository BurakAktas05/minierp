-- ============================================================================
-- Kiracı Şeması Başlangıç Tabloları (Varyant, B2B Teklif, Sipariş & İrsaliye)
-- Kurumsal Veri Bütünlüğü Kısıtları (CHECK), Normalizasyon ve İndeksler
-- ============================================================================

-- 1. Kategoriler
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 2. Ana Ürün Kartları (Product Template)
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    base_unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (tax_rate >= 0.00),
    description TEXT,
    attributes JSONB DEFAULT '{}'::jsonb, -- Dinamik ürün özellikleri (örn: marka, menşei, kumaş tipi)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 3. Ürün Varyantları (Stok Kartı Meta Verisi - SKU)
-- NOT: Varyant tablosunda doğrudan 'stock_quantity' tutulmaz (Anti-Pattern önlendi).
-- Gerçek ve depolara dağıtık stok bakiye bilgisi 'warehouse_stocks', hareketleri ise 'stock_movements' tablosundadır.
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50),
    variant_name VARCHAR(150) NOT NULL, -- Örn: "Kırmızı - M"
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0.00),
    sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (sale_price >= 0.00),
    attributes JSONB DEFAULT '{}'::jsonb, -- Dinamik varyant özellikleri (örn: {"renk": "Kırmızı", "beden": "M"})
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 4. Depolar (Warehouses - Çoklu Depo Yönetimi)
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

-- 5. Depo Bazlı Varyant Stok Bakiyeleri (Warehouse Stocks - Gerçek Stok Kaynağı)
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

-- 6. Stok Hareket Kütüğü (Stock Movements - Denetlenebilir Hareket Günlüğü / Ledger)
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

-- 7. Cari Hesaplar (Business Partners: Müşteri / Tedarikçi)
CREATE TABLE IF NOT EXISTS business_partners (
    id BIGSERIAL PRIMARY KEY,
    partner_type VARCHAR(30) NOT NULL CHECK (partner_type IN ('CUSTOMER', 'SUPPLIER', 'BOTH')),
    name VARCHAR(100) NOT NULL,
    company_title VARCHAR(150),
    tax_number VARCHAR(20),
    tax_office VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 8. B2B Teklifler (Quotations)
CREATE TABLE IF NOT EXISTS quotations (
    id BIGSERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PURCHASE', 'SALES')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED')),
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000 CHECK (exchange_rate > 0),
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0.00),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 9. Teklif Kalemleri (Quotation Items)
CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    description VARCHAR(255),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0.00),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (tax_rate >= 0.00),
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_rate >= 0.00),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 10. Resmi Siparişler (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('SALES_ORDER', 'PURCHASE_ORDER')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
    quotation_id BIGINT REFERENCES quotations(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000 CHECK (exchange_rate > 0),
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0.00),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 11. Sipariş Kalemleri (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    description VARCHAR(255),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0.00),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (tax_rate >= 0.00),
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_rate >= 0.00),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 12. İrsaliyeler (Waybills / Shipments - Depo Bağlantılı)
CREATE TABLE IF NOT EXISTS waybills (
    id BIGSERIAL PRIMARY KEY,
    waybill_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DISPATCH', 'RECEIPT')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    source_warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    target_warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
    dispatch_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP WITH TIME ZONE,
    carrier_company VARCHAR(100),
    tracking_number VARCHAR(100),
    vehicle_plate VARCHAR(30),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 13. İrsaliye Kalemleri (Waybill Items)
CREATE TABLE IF NOT EXISTS waybill_items (
    id BIGSERIAL PRIMARY KEY,
    waybill_id BIGINT NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    order_item_id BIGINT REFERENCES order_items(id) ON DELETE SET NULL, -- Kısmi sevk & sipariş kalemi eşleştirme
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    description VARCHAR(255),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 14. Kullanıcılar (Users - Kiracı İçi Kullanıcı Yönetimi)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ROLE_USER' CHECK (role IN ('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 15. Merkezi Denetim Günlüğü (Centralized Generic Audit Logs)
-- NOT: Her tablo için ayrı log tablosu açılmaz. Tek bir merkez log tablosu JSONB detaylarıyla tüm olayları saklar.
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(30) NOT NULL,          -- CREATE, UPDATE, DELETE, LOGIN, STATUS_CHANGE, STOCK_TRANSFER vb.
    entity_type VARCHAR(50) NOT NULL,     -- Product, Order, Quotation, Waybill, Partner vb.
    entity_id BIGINT,
    performed_by VARCHAR(50) NOT NULL,    -- İşlemi yapan kullanıcı adı veya SYSTEM
    ip_address VARCHAR(45),               -- İstemci IPv4 / IPv6 adresi
    user_agent VARCHAR(255),              -- Tarayıcı / API istemci bilgisi
    details JSONB DEFAULT '{}'::jsonb,    -- Değişiklik detayları (eski değer, yeni değer, payload diff)
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Kolaylık & Raporlama Görünümleri (Views)
-- ============================================================================

-- Varyantların tüm depolardaki konsolide stok durumunu veren SQL View
CREATE OR REPLACE VIEW v_variant_stock_summary AS
SELECT 
    pv.id AS variant_id,
    pv.product_id,
    pv.sku,
    pv.variant_name,
    COALESCE(SUM(ws.quantity), 0) AS total_physical_stock,
    COALESCE(SUM(ws.reserved_stock), 0) AS total_reserved_stock,
    COALESCE(SUM(ws.quantity), 0) - COALESCE(SUM(ws.reserved_stock), 0) AS total_available_stock
FROM product_variants pv
LEFT JOIN warehouse_stocks ws ON ws.variant_id = pv.id
GROUP BY pv.id, pv.product_id, pv.sku, pv.variant_name;

-- ============================================================================
-- Performans İndeksleri (Foreign Keys, JSONB & İş Filtreleme İndeksleri)
-- ============================================================================

-- JSONB indeksleri (Dinamik arama hızlandırma)
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING gin (attributes);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING gin (attributes);

-- Depo & Stok İndeksleri
CREATE INDEX IF NOT EXISTS idx_wh_stocks_warehouse ON warehouse_stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wh_stocks_variant ON warehouse_stocks(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_source_wh ON stock_movements(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_target_wh ON stock_movements(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Foreign Key B-Tree İndeksleri
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_quotations_partner ON quotations(partner_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_variant ON quotation_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_quotation ON orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_waybills_partner ON waybills(partner_id);
CREATE INDEX IF NOT EXISTS idx_waybills_order ON waybills(order_id);
CREATE INDEX IF NOT EXISTS idx_waybills_source_wh ON waybills(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_waybills_target_wh ON waybills(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_waybill ON waybill_items(waybill_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_order_item ON waybill_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_variant ON waybill_items(variant_id);

-- Durum ve Tarih Filtreleme İndeksleri (ERP Listeleme & Raporlama için)
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date);
CREATE INDEX IF NOT EXISTS idx_quotations_status_date ON quotations(status, issue_date);
CREATE INDEX IF NOT EXISTS idx_waybills_status_date ON waybills(status, dispatch_date);

-- Denetim Logu İndeksleri
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs (performed_at);
