-- ============================================================================
-- Modül 4: Cari Hesaplar (Business Partners: Müşteri & Tedarikçi)
-- ============================================================================

-- 1. Cari Hesaplar
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
