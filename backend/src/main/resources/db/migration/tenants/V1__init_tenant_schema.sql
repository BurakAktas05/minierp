-- Kiracı Şeması Başlangıç Tabloları (Varyant, B2B Teklif, Sipariş & İrsaliye Modülü)

-- 1. Kategoriler
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
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
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    description TEXT,
    attributes JSONB DEFAULT '{}'::jsonb, -- Dinamik ürün özellikleri (örn: marka, menşei, kumaş tipi)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 3. Ürün Varyantları (Stok Birimi - SKU)
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50),
    variant_name VARCHAR(150) NOT NULL, -- Örn: "Kırmızı - M"
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0, -- Depodaki fiziksel fiili stok
    reserved_stock INTEGER NOT NULL DEFAULT 0, -- Onaylı siparişler için rezerve stok
    attributes JSONB DEFAULT '{}'::jsonb, -- Dinamik varyant özellikleri (örn: {"renk": "Kırmızı", "beden": "M"})
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- JSONB indeksleri
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING gin (attributes);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING gin (attributes);

-- 4. Cari Hesaplar (Business Partners: Müşteri / Tedarikçi)
CREATE TABLE IF NOT EXISTS business_partners (
    id BIGSERIAL PRIMARY KEY,
    partner_type VARCHAR(30) NOT NULL, -- CUSTOMER, SUPPLIER, BOTH
    name VARCHAR(100) NOT NULL,
    company_title VARCHAR(150),
    tax_number VARCHAR(20),
    tax_office VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 5. B2B Teklifler (Quotations)
CREATE TABLE IF NOT EXISTS quotations (
    id BIGSERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL, -- PURCHASE (Alış), SALES (Satış)
    partner_id BIGINT NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 6. Teklif Kalemleri (Quotation Items)
CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    description VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 7. Resmi Siparişler (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL, -- SALES_ORDER, PURCHASE_ORDER
    partner_id BIGINT NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
    quotation_id BIGINT REFERENCES quotations(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, CONFIRMED, CANCELLED, COMPLETED
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 8. Sipariş Kalemleri (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    description VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 9. İrsaliyeler (Waybills / Shipments)
CREATE TABLE IF NOT EXISTS waybills (
    id BIGSERIAL PRIMARY KEY,
    waybill_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL, -- DISPATCH (Sevk İrsaliyesi), RECEIPT (Alış/Tesellüm İrsaliyesi)
    partner_id BIGINT NOT NULL REFERENCES business_partners(id) ON DELETE RESTRICT,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, DISPATCHED, DELIVERED, CANCELLED
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

-- 10. İrsaliye Kalemleri (Waybill Items)
CREATE TABLE IF NOT EXISTS waybill_items (
    id BIGSERIAL PRIMARY KEY,
    waybill_id BIGINT NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    description VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 11. Kullanıcılar (Users - Kiracı Bazında Kimlik Doğrulama)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ROLE_USER', -- ROLE_ADMIN, ROLE_MANAGER, ROLE_USER
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 12. Denetim Günlükleri (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(30) NOT NULL,          -- CREATE, UPDATE, DELETE, LOGIN, STATUS_CHANGE
    entity_type VARCHAR(50) NOT NULL,     -- Product, Order, Quotation, vb.
    entity_id BIGINT,
    performed_by VARCHAR(50) NOT NULL,    -- İşlemi yapan kullanıcı adı
    details JSONB DEFAULT '{}'::jsonb,    -- Ek detaylar (eski değer, yeni değer vs.)
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs (performed_at);
