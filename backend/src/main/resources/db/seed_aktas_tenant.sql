-- ============================================================================
-- AKTAŞ HOLDİNG A.Ş. - TEKNOLOJİ & ÇÖZÜM PORTALI (tenant_aktas) TOHUMLAMA
-- ============================================================================

SET search_path TO tenant_aktas;

-- 1. KULLANICILAR (USERS)
-- Şifreler:
-- admin   : admin123
-- manager : manager123
-- user    : user123
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
VALUES 
('admin', 'admin@aktasholding.com.tr', '$2a$10$2cMGhgGuk.p9XkL7JkTJSONDFKQCmjDjdXsONYmEwJExtgxpZ7Kcq', 'Aktaş Holding Sistem Yöneticisi', 'ROLE_ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('manager', 'manager@aktasholding.com.tr', '$2a$10$./Pa7hfvv6CYVqxXSObUCuGX5np.DvFXRUnAYOQiAcPB8RidBLnwC', 'Çözüm Ortaklığı & Danışmanlık Direktörü', 'ROLE_MANAGER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user', 'user@aktasholding.com.tr', '$2a$10$GedzJmCeSTg06cJEMjoTQelxpNnwTHwlCol9Lu6UgkdXssgZjEhcK', 'Kıdemli ERP & Süreç Danışmanı', 'ROLE_USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- 2. KATEGORİLER (CATEGORIES)
INSERT INTO categories (name, code, description, created_at)
VALUES
('Kurumsal ERP & Danışmanlık', 'KAT-AKT-01', 'MiniERP çözüm ortaklığı, mimari danışmanlık ve implementasyon', CURRENT_TIMESTAMP),
('SaaS Bulut Hizmetleri & Altyapı', 'KAT-AKT-02', 'Yüksek erişilebilirlikli bulut altyapı barındırma ve veri güvenliği', CURRENT_TIMESTAMP),
('Özel Yazılım & Entegrasyon', 'KAT-AKT-03', 'API entegrasyonları, e-Fatura konnektörleri ve B2B köprüleri', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 3. ÜRÜN & HİZMETLER (SERVICES)
INSERT INTO products (name, code, category_id, base_unit, tax_rate, description, attributes, created_at)
SELECT 
    'MiniERP Kurumsal Çözüm Lisansı & Danışmanlık', 
    'PRD-AKT-01', 
    c.id, 
    'AY', 
    20.00, 
    'Çözüm ortaklığı kapsamında aylık ERP platform lisansı, mimari danışmanlık ve periyodik sistem iyileştirmeleri.',
    '{"hizmetTipi": "Yazılım & Danışmanlık", "kapsam": "Sınırsız Kullanıcı & Özel Destek"}'::jsonb,
    CURRENT_TIMESTAMP
FROM categories c WHERE c.code = 'KAT-AKT-01' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (name, code, category_id, base_unit, tax_rate, description, attributes, created_at)
SELECT 
    '7/24 SLA Sistem Destek ve Bakım Paketi', 
    'PRD-AKT-02', 
    c.id, 
    'AY', 
    20.00, 
    'Kesintisiz çalışma garantili (99.9% SLA) 7/24 acil müdahale, yedekleme yönetimi ve performans izleme.',
    '{"sla": "99.9%", "yanitSuresi": "15 Dakika"}'::jsonb,
    CURRENT_TIMESTAMP
FROM categories c WHERE c.code = 'KAT-AKT-02' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (name, code, category_id, base_unit, tax_rate, description, attributes, created_at)
SELECT 
    'Özel B2B API & Entegrasyon Hizmeti', 
    'PRD-AKT-03', 
    c.id, 
    'SAAT', 
    20.00, 
    'ERP ile dış sistemler (bankalar, pazaryerleri, e-fatura entegratörleri) arasında özel REST API geliştirme.',
    '{"protokol": "REST / JSON", "guvenlik": "OAuth2 / JWT"}'::jsonb,
    CURRENT_TIMESTAMP
FROM categories c WHERE c.code = 'KAT-AKT-03' LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- 4. VARYANTLAR (PRODUCT VARIANTS)
INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes, created_at)
SELECT 
    p.id, 
    'AKT-ERP-LIC-01', 
    '86890001001', 
    'Yıllık Sözleşmeli Kurumsal Lisans Paketi', 
    25000.00, 
    75000.00, 
    999, 
    0, 
    '{"donem": "Aylık", "kullaniciLimiti": "Limitsiz"}'::jsonb,
    CURRENT_TIMESTAMP
FROM products p WHERE p.code = 'PRD-AKT-01' LIMIT 1
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes, created_at)
SELECT 
    p.id, 
    'AKT-SLA-724-01', 
    '86890001002', 
    '7/24 Premium SLA Destek Paketi', 
    10000.00, 
    35000.00, 
    999, 
    0, 
    '{"oncelik": "Kritik", "haftalikSaat": "168 Saat"}'::jsonb,
    CURRENT_TIMESTAMP
FROM products p WHERE p.code = 'PRD-AKT-02' LIMIT 1
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes, created_at)
SELECT 
    p.id, 
    'AKT-INT-PKG-50', 
    '86890001003', 
    'B2B Entegrasyon Geliştirme (50 Saatlik Blok)', 
    15000.00, 
    45000.00, 
    999, 
    0, 
    '{"saat": "50", "uzmanSeviyesi": "Senior Architect"}'::jsonb,
    CURRENT_TIMESTAMP
FROM products p WHERE p.code = 'PRD-AKT-03' LIMIT 1
ON CONFLICT (sku) DO NOTHING;

-- 5. DEPO (WAREHOUSE - DİJİTAL SERVİS & MERKEZ OFİS)
INSERT INTO warehouses (code, name, location, address, is_active, created_at)
VALUES 
('WH-AKT-01', 'Maslak Genel Merkez & Dijital Hizmetler', 'İstanbul / Maslak', 'Büyükdere Caddesi Aktaş Plaza Kat:24 Maslak / Sarıyer / İstanbul', true, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Depo Stokları
INSERT INTO warehouse_stocks (warehouse_id, variant_id, quantity, reserved_stock, shelf_location, created_at)
SELECT w.id, v.id, 999, 0, 'DIJITAL-01', CURRENT_TIMESTAMP
FROM warehouses w, product_variants v
WHERE w.code = 'WH-AKT-01'
ON CONFLICT DO NOTHING;

-- 6. CARİ HESAPLAR (BUSINESS PARTNERS)
INSERT INTO business_partners (name, company_title, partner_type, tax_number, tax_office, email, phone, address, metadata, created_at)
VALUES 
('Atlas Tekstil & Dokuma Sanayi A.Ş.', 'Atlas Tekstil Sanayi ve Ticaret A.Ş.', 'CUSTOMER', '9876543210', 'Bursa Nilüfer VD', 'bilgi@atlastekstil.com.tr', '+90 224 441 50 00', 'Demirtaş Organize Sanayi Bölgesi Gül Cad. No:18 Bursa', '{"iliskiliKiraci": "tenant_tekstil", "sektor": "Tekstil & Dokuma", "hizmetSozlesmesi": true}'::jsonb, CURRENT_TIMESTAMP),
('Vogue Hazır Giyim & Konfeksiyon Ltd.', 'Vogue Hazır Giyim Sanayi ve Ticaret Ltd. Şti.', 'CUSTOMER', '3210459821', 'Konak VD', 'tedarik@voguegiyim.com.tr', '+90 232 444 88 00', 'Organize Sanayi Bölgesi 2. Cadde No:14 İzmir', '{"iliskiliKiraci": "tenant_moda", "sektor": "Giyim & İmalat", "hizmetSozlesmesi": true}'::jsonb, CURRENT_TIMESTAMP),
('Trendline Mağazacılık & E-Ticaret A.Ş.', 'Trendline Perakende Mağazacılık A.Ş.', 'CUSTOMER', '6129840291', 'İkitelli VD', 'satin_alma@trendline.com.tr', '+90 212 659 70 00', 'İkitelli OSB Aykosan Sanayi Sitesi 4. Blok No:12 İstanbul', '{"iliskiliKiraci": "tenant_perakende", "sektor": "Perakende & E-Ticaret", "hizmetSozlesmesi": true}'::jsonb, CURRENT_TIMESTAMP),
('Amazon Web Services EMEA SARL', 'Amazon Web Services EMEA SARL - Türkiye Şubesi', 'SUPPLIER', '0680876123', 'Büyük Mükellefler VD', 'aws-billing@amazon.com', '+90 212 999 80 00', 'Levent 199 Büyükdere Cad. No:199 Levent, İstanbul', '{"hizmet": "Bulut Sunucu & Veritabanı Barındırma", "paraBirimi": "USD"}'::jsonb, CURRENT_TIMESTAMP),
('Türk Telekom Kurumsal Çözümler A.Ş.', 'Türk Telekomünikasyon A.Ş. Genel Müdürlük', 'SUPPLIER', '8790012345', 'Ulus VD', 'kurumsal@turktelekom.com.tr', '+90 312 555 10 00', 'Turgut Özal Bulvarı Aydınlıkevler, Ankara', '{"hizmet": "Metro Ethernet & MPLS VPN Altyapısı"}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 7. TEKLİFLER (QUOTATIONS)
-- Atlas Tekstil'e Danışmanlık ve SLA Teklifi
INSERT INTO quotations (quotation_number, type, partner_id, status, issue_date, valid_until, currency, subtotal_amount, tax_amount, total_amount, notes, created_at)
SELECT 
    'QT-2026-AKT-001',
    'SALES',
    bp.id,
    'ACCEPTED',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '20 days',
    'TRY',
    110000.00,
    22000.00,
    132000.00,
    'Atlas Tekstil A.Ş. 2026 Yıllık ERP Çözüm Ortaklığı & 7/24 SLA Destek Sözleşmesi.',
    CURRENT_TIMESTAMP
FROM business_partners bp WHERE bp.name LIKE 'Atlas Tekstil%' LIMIT 1
ON CONFLICT (quotation_number) DO NOTHING;

-- Teklif Kalemleri
INSERT INTO quotation_items (quotation_id, variant_id, description, quantity, unit_price, tax_rate, subtotal, created_at)
SELECT 
    q.id,
    v.id,
    'Yıllık Sözleşmeli Kurumsal Lisans Paketi (Aylık)',
    1,
    75000.00,
    20.00,
    75000.00,
    CURRENT_TIMESTAMP
FROM quotations q, product_variants v
WHERE q.quotation_number = 'QT-2026-AKT-001' AND v.sku = 'AKT-ERP-LIC-01' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO quotation_items (quotation_id, variant_id, description, quantity, unit_price, tax_rate, subtotal, created_at)
SELECT 
    q.id,
    v.id,
    '7/24 Premium SLA Destek Paketi (Aylık)',
    1,
    35000.00,
    20.00,
    35000.00,
    CURRENT_TIMESTAMP
FROM quotations q, product_variants v
WHERE q.quotation_number = 'QT-2026-AKT-001' AND v.sku = 'AKT-SLA-724-01' LIMIT 1
ON CONFLICT DO NOTHING;

-- 8. SİPARİŞLER (ORDERS)
INSERT INTO orders (order_number, order_type, partner_id, quotation_id, status, order_date, currency, subtotal_amount, tax_amount, total_amount, notes, created_at)
SELECT 
    'SIP-SAT-2026-AKT-001',
    'SALES_ORDER',
    bp.id,
    q.id,
    'CONFIRMED',
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    'TRY',
    110000.00,
    22000.00,
    132000.00,
    'QT-2026-AKT-001 nolu sözleşmeye istinaden onaylanan aylık çözüm danışmanlığı siparişi.',
    CURRENT_TIMESTAMP
FROM quotations q
JOIN business_partners bp ON bp.id = q.partner_id
WHERE q.quotation_number = 'QT-2026-AKT-001' LIMIT 1
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO order_items (order_id, variant_id, description, quantity, unit_price, tax_rate, subtotal, created_at)
SELECT 
    o.id,
    v.id,
    'Yıllık Sözleşmeli Kurumsal Lisans Paketi (Aylık)',
    1,
    75000.00,
    20.00,
    75000.00,
    CURRENT_TIMESTAMP
FROM orders o, product_variants v
WHERE o.order_number = 'SIP-SAT-2026-AKT-001' AND v.sku = 'AKT-ERP-LIC-01' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, variant_id, description, quantity, unit_price, tax_rate, subtotal, created_at)
SELECT 
    o.id,
    v.id,
    '7/24 Premium SLA Destek Paketi (Aylık)',
    1,
    35000.00,
    20.00,
    35000.00,
    CURRENT_TIMESTAMP
FROM orders o, product_variants v
WHERE o.order_number = 'SIP-SAT-2026-AKT-001' AND v.sku = 'AKT-SLA-724-01' LIMIT 1
ON CONFLICT DO NOTHING;

-- 9. FATURALAR (INVOICES)
INSERT INTO invoices (invoice_number, invoice_type, partner_id, order_id, status, invoice_date, due_date, currency, exchange_rate, subtotal_amount, tax_amount, total_amount, paid_amount, remaining_amount, notes, created_at)
SELECT 
    'FTR-HZM-2026-AKT-01',
    'SALES_INVOICE',
    o.partner_id,
    o.id,
    'PARTIALLY_PAID',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '25 days',
    'TRY',
    1.0,
    110000.00,
    22000.00,
    132000.00,
    70000.00,
    62000.00,
    'Atlas Tekstil A.Ş. Mart 2026 Dönemi ERP Çözüm Ortaklığı ve SLA Hizmet Faturası.',
    CURRENT_TIMESTAMP
FROM orders o
WHERE o.order_number = 'SIP-SAT-2026-AKT-001' LIMIT 1
ON CONFLICT (invoice_number) DO NOTHING;

INSERT INTO invoice_items (invoice_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal, created_at)
SELECT 
    i.id,
    v.id,
    'Yıllık Sözleşmeli Kurumsal Lisans Paketi (Aylık)',
    1,
    75000.00,
    20.00,
    0.00,
    75000.00,
    CURRENT_TIMESTAMP
FROM invoices i, product_variants v
WHERE i.invoice_number = 'FTR-HZM-2026-AKT-01' AND v.sku = 'AKT-ERP-LIC-01' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO invoice_items (invoice_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal, created_at)
SELECT 
    i.id,
    v.id,
    '7/24 Premium SLA Destek Paketi (Aylık)',
    1,
    35000.00,
    20.00,
    0.00,
    35000.00,
    CURRENT_TIMESTAMP
FROM invoices i, product_variants v
WHERE i.invoice_number = 'FTR-HZM-2026-AKT-01' AND v.sku = 'AKT-SLA-724-01' LIMIT 1
ON CONFLICT DO NOTHING;

-- 10. ÖDEME & TAHSİLATLAR (PAYMENTS)
INSERT INTO payments (payment_number, payment_type, invoice_id, partner_id, amount, currency, exchange_rate, payment_method, payment_date, reference_number, status, notes, created_at)
SELECT 
    'ODM-2026-AKT-001',
    'INCOMING',
    i.id,
    i.partner_id,
    70000.00,
    'TRY',
    1.0,
    'BANK_TRANSFER',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'HAV-AKTAS-88912',
    'COMPLETED',
    'Garanti BBVA Kurumsal Hesaba Gelen Hizmet Bedeli Tahsilatı (Atlas Tekstil).',
    CURRENT_TIMESTAMP
FROM invoices i
WHERE i.invoice_number = 'FTR-HZM-2026-AKT-01' LIMIT 1
ON CONFLICT (payment_number) DO NOTHING;
