-- ============================================================================
-- MiniERP: Başlangıç Test ve Demo Verileri (Tek Seferde, Temiz ve Güvenli Tohumlama)
-- Tüm kayıtlar ON CONFLICT DO NOTHING ile eklenir; asla veri silmez (non-destructive).
-- ============================================================================

-- 1. KULLANICILAR (admin / manager / user - Şifreler: admin123 / manager123 / user123)
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES
    ('admin', 'admin@minierp.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Sistem Yöneticisi', 'ROLE_ADMIN', TRUE),
    ('manager', 'manager@minierp.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Operasyon Müdürü', 'ROLE_MANAGER', TRUE),
    ('user', 'user@minierp.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Standart Kullanıcı', 'ROLE_USER', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. BELGE NUMARATÖRLERİ (2026 Mali Yılı)
INSERT INTO document_sequences (document_type, prefix, year, last_number)
VALUES
    ('ORDER', 'SIP', 2026, 1),
    ('WAYBILL', 'IRS', 2026, 1),
    ('INVOICE', 'FTR', 2026, 1),
    ('PAYMENT', 'ODM', 2026, 1)
ON CONFLICT (document_type, prefix, year) DO NOTHING;

-- 3. HAZİNE, KASA VE BANKA HESAPLARI
INSERT INTO treasury_accounts (account_code, account_name, account_type, currency, current_balance, bank_name, branch_code, iban, is_active)
VALUES
    ('KSA-01', 'Merkez TL Kasası', 'CASH', 'TRY', 250000.00, NULL, NULL, NULL, TRUE),
    ('BNK-01', 'Garanti BBVA Ticari TL Hesabı', 'BANK', 'TRY', 1450000.00, 'Garanti BBVA', 'Maslak Ticari (890)', 'TR620006200000000123456789', TRUE)
ON CONFLICT (account_code) DO NOTHING;

-- 4. KATEGORİLER
INSERT INTO categories (code, name, description, is_active)
VALUES
    ('KAT-MBL', 'Ofis & Ahşap Mobilya', 'Ofis çalışma masaları, ergonomik koltuklar ve mobilya donanımları', TRUE),
    ('KAT-SRV', 'Bilişim & ERP Yazılım Hizmetleri', 'Yazılım lisanslama, bulut barındırma ve danışmanlık hizmetleri', TRUE),
    ('KAT-TEK', 'Tekstil & Dokuma Kumaş', 'Pamuk, denim ve dokuma kumaş ruloları', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 5. CARİ HESAPLAR (Müşteri & Tedarikçi)
INSERT INTO business_partners (code, partner_type, name, company_title, tax_number, tax_office, email, phone, address, metadata, is_active)
VALUES
    (
        'CAR-KMP-001',
        'BOTH',
        'Kompitürk ERP & Bilişim A.Ş.',
        'Kompitürk Bilişim Yazılım ve Danışmanlık Hizmetleri A.Ş.',
        '5810293841',
        'Boğaziçi VD',
        'iletisim@kompiturk.com',
        '+90 212 888 10 20',
        'Yıldız Teknik Üniversitesi Teknopark Bilişim Vadisi No:10 Esenler / İstanbul',
        '{"sektor": "Bilişim & Yazılım", "faaliyet": "Kurumsal ERP Lisans & Danışmanlık", "yetkili": "Burak Aktaş"}'::jsonb,
        TRUE
    ),
    (
        'CAR-MBL-001',
        'BOTH',
        'Artisan Ahşap & Mobilya Sanayi Ltd.',
        'Artisan Ahşap Mobilya Sanayi ve Ticaret Ltd. Şti.',
        '2910485712',
        'İnegöl VD',
        'siparis@artisanmobilya.com.tr',
        '+90 224 714 55 00',
        'Organize Sanayi Bölgesi Mobilyacılar Cad. No:18 İnegöl / Bursa',
        '{"sektor": "Mobilya & Ağaç İşleri", "faaliyet": "Ofis ve Ev Ahşap Mobilyaları İmalatı & Toptan Satışı", "yetkili": "Ahmet Usta"}'::jsonb,
        TRUE
    ),
    (
        'CAR-NOV-001',
        'CUSTOMER',
        'Nova Plaza & Kurumsal Ofis Çözümleri A.Ş.',
        'Nova Plaza İş Merkezi ve Yönetim Hizmetleri A.Ş.',
        '6320194851',
        'Maslak VD',
        'satinalma@novaplaza.com.tr',
        '+90 212 345 60 70',
        'Büyükdere Cad. Nova Plaza No:142 Kat:12 Maslak / İstanbul',
        '{"sektor": "Gayrimenkul & İş Merkezi Yönetimi", "faaliyet": "Kurumsal Ofis Yönetimi", "vade": "30 Gün", "yetkili": "Zeynep Hanım"}'::jsonb,
        TRUE
    ),
    (
        'CAR-ATLAS-001',
        'SUPPLIER',
        'Atlas Tekstil Sanayi A.Ş.',
        'Atlas Dokuma ve İplik Sanayi Ticaret A.Ş.',
        '8899001122',
        'Bursa VD',
        'info@atlastekstil.com.tr',
        '+90 224 444 11 22',
        'Demirtaş OSB 1. Sokak No:4 Bursa',
        '{"sektor": "Tekstil & Hammadde", "faaliyet": "Kumaş ve Döşeme Tedariği"}'::jsonb,
        TRUE
    )
ON CONFLICT (code) DO NOTHING;

-- 6. DEPOLAR
INSERT INTO warehouses (code, name, location, address, is_active)
VALUES
    ('WH-MRK-01', 'Merkez Ana Depo & Operasyon', 'İstanbul / Maslak', 'Maslak Sanayi Mah. Aktaş Plaza Lojistik Merkezi No:8 Maslak/İstanbul', TRUE),
    ('WH-FAB-01', 'Fabrika Hammadde & Üretim Deposu', 'Bursa / İnegöl', 'İnegöl OSB 3. Cadde No:22 İnegöl/Bursa', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 7. ÜRÜNLER, VARYANTLAR, FİYAT LİSTELERİ VE STOKLAR
DO $$
DECLARE
    v_cat_mbl BIGINT;
    v_cat_srv BIGINT;
    v_partner_kmp BIGINT;
    v_partner_mbl BIGINT;
    v_partner_nov BIGINT;
    v_wh_mrk BIGINT;
    v_wh_fab BIGINT;

    v_prd_erp BIGINT;
    v_prd_masa BIGINT;
    v_prd_koltuk BIGINT;
    v_prd_panel BIGINT;
    v_prd_ayak BIGINT;
    v_prd_civata BIGINT;
    v_prd_doseme BIGINT;
    v_prd_amortisor BIGINT;

    v_var_erp BIGINT;
    v_var_masa BIGINT;
    v_var_koltuk BIGINT;
    v_var_panel BIGINT;
    v_var_ayak BIGINT;
    v_var_civata BIGINT;
    v_var_doseme BIGINT;
    v_var_amortisor BIGINT;

    v_bom_masa BIGINT;
    v_bom_koltuk BIGINT;
    v_quote_id BIGINT;
    v_order_id BIGINT;
    v_waybill_id BIGINT;
    v_invoice_id BIGINT;
    v_acc_bnk BIGINT;
BEGIN
    SELECT id INTO v_cat_mbl FROM categories WHERE code = 'KAT-MBL' LIMIT 1;
    SELECT id INTO v_cat_srv FROM categories WHERE code = 'KAT-SRV' LIMIT 1;
    SELECT id INTO v_partner_kmp FROM business_partners WHERE code = 'CAR-KMP-001' LIMIT 1;
    SELECT id INTO v_partner_mbl FROM business_partners WHERE code = 'CAR-MBL-001' LIMIT 1;
    SELECT id INTO v_partner_nov FROM business_partners WHERE code = 'CAR-NOV-001' LIMIT 1;
    SELECT id INTO v_wh_mrk FROM warehouses WHERE code = 'WH-MRK-01' LIMIT 1;
    SELECT id INTO v_wh_fab FROM warehouses WHERE code = 'WH-FAB-01' LIMIT 1;
    SELECT id INTO v_acc_bnk FROM treasury_accounts WHERE account_code = 'BNK-01' LIMIT 1;

    -- A. ÜRÜN TANIMLARI
    -- 1. Hizmet: MiniERP Lisans & Danışmanlık
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('MiniERP Kurumsal Bulut Lisansı & Danışmanlık', 'PRD-ERP-01', v_cat_srv, v_partner_kmp, 'SERVICE', 'AY', 20.00, 'Kurumsal bulut ERP lisansı ve mimari SLA danışmanlık hizmeti.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_erp;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_erp, 'KMP-ERP-LIC-01', '86890001001', 'Yıllık Sözleşmeli Kurumsal Lisans Paketi', 20000.00, 65000.00, 999, 0)
    ON CONFLICT (sku) DO UPDATE SET variant_name = EXCLUDED.variant_name RETURNING id INTO v_var_erp;

    -- 2. Mamul: Yönetici Masası
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Artisan Masif Ahşap Yönetici Çalışma Masası', 'PRD-MBL-01', v_cat_mbl, v_partner_mbl, 'FINISHED_GOOD', 'ADET', 20.00, '180x90cm doğal ceviz masa üst tablalı yönetici ofis masası.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_masa;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_masa, 'ART-DSK-WNT', '86890002001', '180x90 Doğal Ceviz', 11000.00, 18500.00, 85, 10)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 85 RETURNING id INTO v_var_masa;

    -- 3. Mamul: Ergonomik Koltuk
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Ergonomik Fileli Ofis Çalışma Koltuğu', 'PRD-MBL-02', v_cat_mbl, v_partner_mbl, 'FINISHED_GOOD', 'ADET', 20.00, 'Bel destekli, nefes alan file kumaşlı ofis çalışma koltuğu.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_koltuk;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_koltuk, 'ART-CHR-BLK', '86890002002', 'Siyah Fileli / Başlıklı', 3400.00, 6200.00, 25, 5)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 25 RETURNING id INTO v_var_koltuk;

    -- 4. Hammadde: Masif Panel
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Masif Ahşap Panel (180x90 Ceviz)', 'HAM-MBL-01', v_cat_mbl, v_partner_mbl, 'RAW_MATERIAL', 'ADET', 10.00, '180x90x4cm fırınlanmış doğal ceviz masa tablası.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_panel;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_panel, 'RAW-PNL-01', '86890002003', '180x90 Ham Masif Ahşap Panel', 2500.00, 0.00, 20, 0)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 20 RETURNING id INTO v_var_panel;

    -- 5. Hammadde: Metal Profil Ayak
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Elektrostatik Boyalı Metal Ayak Profili', 'HAM-MBL-02', v_cat_mbl, v_partner_mbl, 'RAW_MATERIAL', 'TAKIM', 20.00, 'U-Tipi elektrostatik fırın boyalı metal taşıyıcı ayak.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_ayak;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_ayak, 'RAW-LEG-01', '86890002004', 'U-Tipi Statik Siyah Profil Ayak', 1200.00, 0.00, 30, 0)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 30 RETURNING id INTO v_var_ayak;

    -- 6. Hammadde: Civata Montaj Kiti
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Mobilya Bağlantı & Civata Montaj Kiti', 'HAM-MBL-03', v_cat_mbl, v_partner_mbl, 'RAW_MATERIAL', 'PAKET', 20.00, 'M8 çelik civata ve montaj pabuçları.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_civata;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_civata, 'RAW-BLT-01', '86890002005', 'M8 Civata & Çelik Dübel Seti', 150.00, 0.00, 50, 0)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 50 RETURNING id INTO v_var_civata;

    -- 7. Hammadde: File & Sünger
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Döşemelik File Kumaş & Sünger Kiti', 'HAM-MBL-04', v_cat_mbl, v_partner_mbl, 'RAW_MATERIAL', 'SET', 10.00, 'Nefes alabilir file kumaş ve 45 DNS dökme sünger.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_doseme;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_doseme, 'RAW-MSH-01', '86890002006', 'Döşemelik File & Dökme Sünger', 850.00, 0.00, 25, 0)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 25 RETURNING id INTO v_var_doseme;

    -- 8. Hammadde: Amortisör & Yıldız Ayak
    INSERT INTO products (name, code, category_id, partner_id, product_type, base_unit, tax_rate, description)
    VALUES ('Alüminyum Yıldız Ayak & Gazlı Amortisör', 'HAM-MBL-05', v_cat_mbl, v_partner_mbl, 'RAW_MATERIAL', 'ADET', 20.00, 'Alüminyum yıldız ayak ve Class 4 piston.')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_amortisor;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock)
    VALUES (v_prd_amortisor, 'RAW-GAS-01', '86890002007', 'Class 4 Gazlı Amortisör & Yıldız Ayak', 1450.00, 0.00, 5, 0)
    ON CONFLICT (sku) DO UPDATE SET stock_quantity = 5 RETURNING id INTO v_var_amortisor;

    -- B. DEPO STOKLARI
    IF v_wh_mrk IS NOT NULL THEN
        INSERT INTO warehouse_stocks (warehouse_id, variant_id, quantity, reserved_stock, shelf_location)
        VALUES
            (v_wh_mrk, v_var_erp, 999, 0, 'DIJITAL-01'),
            (v_wh_mrk, v_var_masa, 85, 10, 'RAF-MBL-A1'),
            (v_wh_mrk, v_var_koltuk, 25, 5, 'RAF-MBL-B1')
        ON CONFLICT (warehouse_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity;
    END IF;

    IF v_wh_fab IS NOT NULL THEN
        INSERT INTO warehouse_stocks (warehouse_id, variant_id, quantity, reserved_stock, shelf_location)
        VALUES
            (v_wh_fab, v_var_panel, 20, 0, 'HAM-A01'),
            (v_wh_fab, v_var_ayak, 30, 0, 'HAM-A02'),
            (v_wh_fab, v_var_civata, 50, 0, 'HAM-A03'),
            (v_wh_fab, v_var_doseme, 25, 0, 'HAM-B01'),
            (v_wh_fab, v_var_amortisor, 5, 0, 'HAM-B02')
        ON CONFLICT (warehouse_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity;
    END IF;

    -- C. ÜRETİM REÇETELERİ (BOM)
    IF v_var_masa IS NOT NULL THEN
        INSERT INTO bill_of_materials (bom_code, name, variant_id, quantity, unit, description, industry_type, is_active)
        VALUES ('BOM-ART-DSK-01', 'Artisan Masif Ahşap Yönetici Masası Reçetesi', v_var_masa, 1.000, 'ADET', '1 adet yönetici masası üretimi için panel, ayak ve civata montaj seti.', 'FURNITURE', TRUE)
        ON CONFLICT (bom_code) DO NOTHING RETURNING id INTO v_bom_masa;

        IF v_bom_masa IS NOT NULL THEN
            INSERT INTO bom_items (bom_id, component_variant_id, quantity, unit, scrap_rate, description)
            VALUES
                (v_bom_masa, v_var_panel, 1.000, 'ADET', 0.00, '180x90 Üst Tabla Ahşap Panel'),
                (v_bom_masa, v_var_ayak, 1.000, 'TAKIM', 0.00, 'Statik Siyah Metal U-Ayak (Takım)'),
                (v_bom_masa, v_var_civata, 1.000, 'PAKET', 0.00, 'Montaj Civata ve Dübel Takımı');
        END IF;
    END IF;

    IF v_var_koltuk IS NOT NULL THEN
        INSERT INTO bill_of_materials (bom_code, name, variant_id, quantity, unit, description, industry_type, is_active)
        VALUES ('BOM-ART-CHR-01', 'Ergonomik Fileli Ofis Koltuğu Reçetesi', v_var_koltuk, 1.000, 'ADET', '1 adet ergonomik çalışma koltuğu montajı için döşeme seti ve amortisör.', 'FURNITURE', TRUE)
        ON CONFLICT (bom_code) DO NOTHING RETURNING id INTO v_bom_koltuk;

        IF v_bom_koltuk IS NOT NULL THEN
            INSERT INTO bom_items (bom_id, component_variant_id, quantity, unit, scrap_rate, description)
            VALUES
                (v_bom_koltuk, v_var_doseme, 1.000, 'SET', 0.00, 'Döşemelik File Sırt ve Oturma Süngeri'),
                (v_bom_koltuk, v_var_amortisor, 1.000, 'ADET', 0.00, 'Class 4 Amortisör ve Alüminyum Yıldız Ayak');
        END IF;
    END IF;

    -- E. ÖRNEK TEKLİF & SİPARİŞ & İRSALİYE & FATURA
    IF v_partner_nov IS NOT NULL AND v_var_masa IS NOT NULL AND v_var_koltuk IS NOT NULL THEN
        -- 1. Teklif
        INSERT INTO quotations (quotation_number, type, partner_id, status, issue_date, valid_until, currency, exchange_rate, subtotal_amount, tax_amount, discount_amount, total_amount, notes)
        VALUES ('TEK-2026-001', 'SALES', v_partner_nov, 'ACCEPTED', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '15 days', 'TRY', 1.0, 154500.00, 30900.00, 0.00, 185400.00, 'Nova Plaza Maslak Yönetim Katı Ofis Yenileme Teklifi.')
        ON CONFLICT (quotation_number) DO NOTHING RETURNING id INTO v_quote_id;

        IF v_quote_id IS NOT NULL THEN
            INSERT INTO quotation_items (quotation_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
            VALUES
                (v_quote_id, v_var_masa, 'Artisan Masif Ahşap Yönetici Çalışma Masası', 5, 18500.00, 20.00, 0.00, 92500.00),
                (v_quote_id, v_var_koltuk, 'Ergonomik Fileli Ofis Çalışma Koltuğu', 10, 6200.00, 20.00, 0.00, 62000.00);
        END IF;

        -- 2. Sipariş (CONFIRMED -> Rezerve stok oluşturur)
        INSERT INTO orders (order_number, order_type, partner_id, quotation_id, status, order_date, delivery_date, currency, subtotal_amount, tax_amount, discount_amount, total_amount, notes)
        VALUES ('SIP-SAT-2026-001', 'SALES_ORDER', v_partner_nov, v_quote_id, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'TRY', 154500.00, 30900.00, 0.00, 185400.00, 'TEK-2026-001 teklifinden onaylanan sipariş. Maslak Merkez depodan sevk edilecek.')
        ON CONFLICT (order_number) DO NOTHING RETURNING id INTO v_order_id;

        IF v_order_id IS NOT NULL THEN
            INSERT INTO order_items (order_id, variant_id, description, quantity, delivered_quantity, unit_price, tax_rate, discount_rate, subtotal)
            VALUES
                (v_order_id, v_var_masa, 'Artisan Masif Ahşap Yönetici Masası', 5, 0, 18500.00, 20.00, 0.00, 92500.00),
                (v_order_id, v_var_koltuk, 'Ergonomik Fileli Ofis Çalışma Koltuğu', 10, 0, 6200.00, 20.00, 0.00, 62000.00);
        END IF;

        -- 3. İrsaliye (DISPATCHED)
        IF v_order_id IS NOT NULL AND v_wh_mrk IS NOT NULL THEN
            INSERT INTO waybills (waybill_number, type, partner_id, order_id, source_warehouse_id, status, dispatch_date, carrier_company, vehicle_plate, tracking_number, notes)
            VALUES ('IRS-SVK-2026-001', 'DISPATCH', v_partner_nov, v_order_id, v_wh_mrk, 'DISPATCHED', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Horoz Lojistik', '34 MBL 777', 'HRZ-981245', 'Nova Plaza 12. Kat teslimatı.')
            ON CONFLICT (waybill_number) DO NOTHING RETURNING id INTO v_waybill_id;

            IF v_waybill_id IS NOT NULL THEN
                INSERT INTO waybill_items (waybill_id, variant_id, quantity, unit_price, description)
                VALUES
                    (v_waybill_id, v_var_masa, 5, 18500.00, 'Artisan Masif Ahşap Masa (5 Adet Kolili)'),
                    (v_waybill_id, v_var_koltuk, 10, 6200.00, 'Ergonomik Fileli Ofis Koltuğu (10 Adet)');
            END IF;
        END IF;

        -- 4. Fatura (PARTIALLY_PAID)
        IF v_order_id IS NOT NULL THEN
            INSERT INTO invoices (invoice_number, invoice_type, partner_id, order_id, waybill_id, status, invoice_date, due_date, currency, exchange_rate, subtotal_amount, tax_amount, total_amount, paid_amount, remaining_amount, notes)
            VALUES ('FTR-SAT-2026-001', 'SALES_INVOICE', v_partner_nov, v_order_id, v_waybill_id, 'PARTIALLY_PAID', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '29 days', 'TRY', 1.0, 154500.00, 30900.00, 185400.00, 50000.00, 135400.00, 'IRS-SVK-2026-001 nolu irsaliyeden faturalaştırılmıştır.')
            ON CONFLICT (invoice_number) DO NOTHING RETURNING id INTO v_invoice_id;

            IF v_invoice_id IS NOT NULL THEN
                INSERT INTO invoice_items (invoice_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
                VALUES
                    (v_invoice_id, v_var_masa, 'Artisan Masif Ahşap Yönetici Masası', 5, 18500.00, 20.00, 0.00, 92500.00),
                    (v_invoice_id, v_var_koltuk, 'Ergonomik Fileli Ofis Çalışma Koltuğu', 10, 6200.00, 20.00, 0.00, 62000.00);

                -- 5. Tahsilat Makbuzu (50.000 TL Kısmi Ödeme)
                IF v_acc_bnk IS NOT NULL THEN
                    INSERT INTO payments (payment_number, payment_type, invoice_id, partner_id, account_id, amount, currency, exchange_rate, payment_method, reference_number, status, notes)
                    VALUES ('ODM-2026-001', 'INCOMING', v_invoice_id, v_partner_nov, v_acc_bnk, 50000.00, 'TRY', 1.0, 'BANK_TRANSFER', 'EFT-8910245', 'COMPLETED', 'Nova Plaza siparişine istinaden peşinat havalesi.')
                    ON CONFLICT (payment_number) DO NOTHING;
                END IF;
            END IF;
        END IF;
    END IF;

END $$;
