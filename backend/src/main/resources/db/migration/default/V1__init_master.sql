-- Master/Genel şema (public) için kiracı (Tenant) yönetim tablosu
CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(100) NOT NULL,
    schema_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- Örnek başlangıç kiracıları (Entegre B2B Tedarik Zinciri İşletmeleri)
INSERT INTO tenants (tenant_id, company_name, schema_name, is_active, version)
VALUES 
    ('tenant_tekstil', 'Atlas Tekstil & Dokuma Sanayi A.Ş.', 'tenant_tekstil', true, 0),
    ('tenant_moda', 'Vogue Hazır Giyim & Konfeksiyon Ltd.', 'tenant_moda', true, 0),
    ('tenant_perakende', 'Trendline Mağazacılık & E-Ticaret A.Ş.', 'tenant_perakende', true, 0)
ON CONFLICT (tenant_id) DO NOTHING;
