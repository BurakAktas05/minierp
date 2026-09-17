-- ============================================================================
-- Modül 1: Çekirdek Kullanıcı Yönetimi & Denetim Günlüğü (Auth & Audit)
-- ============================================================================

-- 1. Kullanıcılar (Users - Kiracı İçi Kullanıcı Yönetimi)
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

-- 2. Merkezi Denetim Günlüğü (Centralized Generic Audit Logs)
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
