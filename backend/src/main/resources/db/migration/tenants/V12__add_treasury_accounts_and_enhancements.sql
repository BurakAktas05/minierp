-- ============================================================================
-- Modül 12: Kasa & Banka (Hazine / Nakit Akışı), Kısmi Sevkiyat ve Sistem İyileştirmeleri
-- ============================================================================

-- 1. Kasa ve Banka Hesapları Tablosu (Treasury / Financial Accounts)
CREATE TABLE IF NOT EXISTS treasury_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_code VARCHAR(50) NOT NULL UNIQUE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(100),
    branch_code VARCHAR(50),
    iban VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_type ON treasury_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_treasury_accounts_currency ON treasury_accounts(currency);

-- 2. Ödemeler Tablosuna Kasa/Banka Hesap Bağlantısı Ekleme
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES treasury_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_account ON payments(account_id);

-- 3. Sipariş Kalemlerine Teslim Edilen Miktar (Kısmi Sevkiyat Takibi)
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0);

-- 4. Başlangıç Kasa ve Banka Hesaplarının Tohumlanması
INSERT INTO treasury_accounts (account_code, account_name, account_type, currency, current_balance, bank_name, iban, notes)
VALUES
    ('KASA-TR-01', 'Merkez Nakit TL Kasası', 'CASH', 'TRY', 125000.00, NULL, NULL, 'Merkez ofis ana kasası'),
    ('BNK-GAR-01', 'Garanti BBVA Ticari Mevduat', 'BANK', 'TRY', 850000.00, 'Garanti BBVA', 'TR120006200012345678901234', 'Şirket ana operasyonel banka hesabı'),
    ('BNK-IS-USD', 'Türkiye İş Bankası USD Hesabı', 'BANK', 'USD', 45000.00, 'Türkiye İş Bankası', 'TR550006400098765432109876', 'Dövizli hammadde ve ihracat ödemeleri')
ON CONFLICT (account_code) DO NOTHING;

-- Mevcut tamamlanmış ödemeleri varsayılan hesapla eşleştir
UPDATE payments p
SET account_id = (SELECT id FROM treasury_accounts WHERE account_code = 'BNK-GAR-01' LIMIT 1)
WHERE p.account_id IS NULL AND p.payment_method = 'BANK_TRANSFER';

UPDATE payments p
SET account_id = (SELECT id FROM treasury_accounts WHERE account_code = 'KASA-TR-01' LIMIT 1)
WHERE p.account_id IS NULL AND p.payment_method = 'CASH';
