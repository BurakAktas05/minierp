-- ============================================================================
-- MiniERP: Kiracı (Tenant) Şeması Veritabanı Mimarisi
-- 25 Tablo, İndeksler, Check Kısıtları ve Görünümler (Views)
-- ============================================================================

-- 1. KULLANICI & GÜVENLİK
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    performed_by VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    details JSONB,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_sequences (
    id BIGSERIAL PRIMARY KEY,
    document_type VARCHAR(30) NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    last_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doc_seq UNIQUE (document_type, prefix, year)
);

-- 2. KATEGORİ & ÜRÜN KÜTÜĞÜ
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS business_partners (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('CUSTOMER', 'SUPPLIER', 'BOTH')),
    name VARCHAR(150) NOT NULL,
    company_title VARCHAR(255),
    tax_number VARCHAR(20),
    tax_office VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(30),
    address TEXT,
    metadata JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    partner_id BIGINT REFERENCES business_partners(id) ON DELETE SET NULL,
    product_type VARCHAR(30) NOT NULL DEFAULT 'FINISHED_GOOD' CHECK (product_type IN ('FINISHED_GOOD', 'RAW_MATERIAL', 'SEMI_FINISHED', 'SERVICE', 'COMMERCIAL_GOOD')),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    base_unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (tax_rate >= 0),
    description TEXT,
    attributes JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50),
    variant_name VARCHAR(150) NOT NULL,
    purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (sale_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    attributes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 3. ÇOKLU DEPO & STOK HAREKETLERİ
CREATE TABLE IF NOT EXISTS warehouses (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS warehouse_stocks (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    shelf_location VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT uq_warehouse_variant UNIQUE (warehouse_id, variant_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    movement_number VARCHAR(50) NOT NULL UNIQUE,
    movement_type VARCHAR(30) NOT NULL,
    source_warehouse_id BIGINT REFERENCES warehouses(id),
    target_warehouse_id BIGINT REFERENCES warehouses(id),
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(30),
    reference_id BIGINT,
    lot_number VARCHAR(50),
    notes TEXT,
    performed_by VARCHAR(100),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TEKLİF (QUOTATION)
CREATE TABLE IF NOT EXISTS quotations (
    id BIGSERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('SALES', 'PURCHASE')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED')),
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGSERIAL PRIMARY KEY,
    quotation_id BIGINT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    description VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 6. SİPARİŞ (ORDER)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('SALES_ORDER', 'PURCHASE_ORDER')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id),
    quotation_id BIGINT REFERENCES quotations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED')),
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    description VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    delivered_quantity INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 7. SEVK İRSALİYESİ (WAYBILL)
CREATE TABLE IF NOT EXISTS waybills (
    id BIGSERIAL PRIMARY KEY,
    waybill_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DISPATCH', 'RECEIPT')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id),
    order_id BIGINT REFERENCES orders(id),
    source_warehouse_id BIGINT REFERENCES warehouses(id),
    target_warehouse_id BIGINT REFERENCES warehouses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
    dispatch_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    carrier_company VARCHAR(100),
    vehicle_plate VARCHAR(20),
    tracking_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS waybill_items (
    id BIGSERIAL PRIMARY KEY,
    waybill_id BIGINT NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    order_item_id BIGINT REFERENCES order_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2),
    lot_number VARCHAR(50),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 8. HAZİNE, KASA & BANKA
CREATE TABLE IF NOT EXISTS treasury_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_code VARCHAR(50) NOT NULL UNIQUE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(100),
    branch_code VARCHAR(50),
    iban VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 9. FATURA & ÖDEME (INVOICE & PAYMENT)
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('SALES_INVOICE', 'PURCHASE_INVOICE')),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id),
    order_id BIGINT REFERENCES orders(id),
    waybill_id BIGINT REFERENCES waybills(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES product_variants(id),
    waybill_item_id BIGINT REFERENCES waybill_items(id),
    description VARCHAR(255),
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('INCOMING', 'OUTGOING')),
    invoice_id BIGINT REFERENCES invoices(id),
    partner_id BIGINT NOT NULL REFERENCES business_partners(id),
    account_id BIGINT REFERENCES treasury_accounts(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
    reference_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 10. ÜRETİM REÇETESİ (BOM) & İŞ EMİRLERİ
CREATE TABLE IF NOT EXISTS bill_of_materials (
    id BIGSERIAL PRIMARY KEY,
    bom_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 1.000 CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    industry_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bom_items (
    id BIGSERIAL PRIMARY KEY,
    bom_id BIGINT NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    component_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    scrap_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    sequence_order INTEGER DEFAULT 1,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    bom_id BIGINT NOT NULL REFERENCES bill_of_materials(id),
    source_warehouse_id BIGINT REFERENCES warehouses(id),
    target_warehouse_id BIGINT REFERENCES warehouses(id),
    order_id BIGINT REFERENCES orders(id),
    planned_quantity NUMERIC(12, 3) NOT NULL CHECK (planned_quantity > 0),
    produced_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS work_order_items (
    id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    component_variant_id BIGINT NOT NULL REFERENCES product_variants(id),
    planned_quantity NUMERIC(12, 3) NOT NULL,
    consumed_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    unit VARCHAR(20) NOT NULL DEFAULT 'ADET',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 11. PERFORMANS İNDEKSLERİ
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_partner ON products(partner_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stocks_variant ON warehouse_stocks(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_lot ON stock_movements(lot_number);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_waybills_order ON waybills(order_id);
CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);
CREATE INDEX IF NOT EXISTS idx_waybill_items_waybill ON waybill_items(waybill_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner ON invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_partner ON payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_bom ON work_orders(bom_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- 12. GÖRÜNÜMLER (VIEWS)
CREATE OR REPLACE VIEW v_stock_status AS
SELECT 
    pv.id AS variant_id,
    p.id AS product_id,
    p.name AS product_name,
    p.code AS product_code,
    p.product_type,
    pv.sku,
    pv.variant_name,
    pv.stock_quantity AS total_physical_stock,
    pv.reserved_stock AS total_reserved_stock,
    (pv.stock_quantity - pv.reserved_stock) AS available_stock,
    pv.purchase_price,
    pv.sale_price,
    (pv.stock_quantity * pv.purchase_price) AS total_inventory_value
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.is_active = TRUE;

CREATE OR REPLACE VIEW v_partner_balance AS
SELECT 
    bp.id AS partner_id,
    bp.code,
    bp.name,
    bp.partner_type,
    COALESCE(SUM(CASE WHEN i.invoice_type = 'SALES_INVOICE' AND i.status != 'CANCELLED' THEN i.total_amount ELSE 0 END), 0) AS total_sales_invoiced,
    COALESCE(SUM(CASE WHEN i.invoice_type = 'PURCHASE_INVOICE' AND i.status != 'CANCELLED' THEN i.total_amount ELSE 0 END), 0) AS total_purchase_invoiced,
    COALESCE(SUM(CASE WHEN i.invoice_type = 'SALES_INVOICE' AND i.status != 'CANCELLED' THEN i.remaining_amount ELSE 0 END), 0) AS open_receivables,
    COALESCE(SUM(CASE WHEN i.invoice_type = 'PURCHASE_INVOICE' AND i.status != 'CANCELLED' THEN i.remaining_amount ELSE 0 END), 0) AS open_payables
FROM business_partners bp
LEFT JOIN invoices i ON bp.id = i.partner_id
GROUP BY bp.id, bp.code, bp.name, bp.partner_type;
