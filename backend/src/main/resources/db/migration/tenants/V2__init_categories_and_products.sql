-- ============================================================================
-- Modül 2: Kategoriler, Ürünler ve Varyantlar (Katalog & SKU)
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
