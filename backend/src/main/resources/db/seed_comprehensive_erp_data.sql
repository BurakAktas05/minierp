-- ============================================================================
-- MiniERP: Zengin Kurumsal Seed Data (100 Cari Hesap & Entegre B2B Ekosistemi)
-- Şema: tenant_tekstil
-- Kapsam:
--   1. Ek Depolar (Bursa, İzmir, Gaziantep Lojistik)
--   2. Ek Ürün Kategorileri, Ürünler ve Varyantlar
--   3. 100 Adet Gerçekçi ve Sektörel Dağıtımlı Cari Hesap (Müşteri, Tedarikçi, Her İkisi)
--      (GİB E-Fatura, Risk/Kredi Limiti, Vade, Banka IBAN, CRM Sektör & Bölge Metadatalı)
--   4. Çoklu Teklifler (Quotations & Items)
--   5. Bağlantılı B2B Siparişler (Orders & Items)
--   6. Sevk ve Alış İrsaliyeleri (Waybills & Items)
--   7. Satış ve Alış Faturaları (Invoices & Items)
--   8. Tahsilat ve Ödemeler (Payments - Fatura Bakiyeleri ile Uyumlu)
--   9. Üretim Reçeteleri (BOM) ve İş Emirleri (Work Orders)
--  10. Denetim Günlükleri (Audit Logs)
-- ============================================================================

SET search_path = tenant_tekstil, public;

DO $$
DECLARE
    -- Depo ID'leri
    v_wh_main_id BIGINT;
    v_wh_ege_id BIGINT;
    v_wh_bursa_id BIGINT;
    v_wh_gaziantep_id BIGINT;

    -- Kategori ID'leri
    v_cat_iplik_id BIGINT;
    v_cat_kumas_id BIGINT;
    v_cat_aksesuar_id BIGINT;
    v_cat_konfeksiyon_id BIGINT;
    v_cat_ambalaj_id BIGINT;

    -- Ürün & Varyant ID'leri
    v_prd_id BIGINT;
    v_var_id BIGINT;
    v_var_ids BIGINT[] := ARRAY[]::BIGINT[];

    -- Cari Hesap ID Dizileri
    v_partner_id BIGINT;
    v_customer_ids BIGINT[] := ARRAY[]::BIGINT[];
    v_supplier_ids BIGINT[] := ARRAY[]::BIGINT[];
    v_all_partner_ids BIGINT[] := ARRAY[]::BIGINT[];

    -- Belge Değişkenleri
    v_quot_id BIGINT;
    v_order_id BIGINT;
    v_order_item_id BIGINT;
    v_waybill_id BIGINT;
    v_invoice_id BIGINT;
    v_payment_id BIGINT;
    v_bom_id BIGINT;
    v_wo_id BIGINT;

    v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
    i INT;
    j INT;
    v_code_suffix VARCHAR;
    v_p_name VARCHAR;
    v_company_title VARCHAR;
    v_tax_no VARCHAR;
    v_tax_office VARCHAR;
    v_city VARCHAR;
    v_district VARCHAR;
    v_partner_type VARCHAR;
    v_sector VARCHAR;
    v_limit NUMERIC;
    v_term INT;
    v_rating VARCHAR;
    v_iban VARCHAR;
    v_subtotal NUMERIC;
    v_tax NUMERIC;
    v_total NUMERIC;
    v_paid NUMERIC;
BEGIN
    RAISE NOTICE '>>> [MiniERP Seed] Zengin Kurumsal Veri Yüklemesi Başlatılıyor...';

    -- ========================================================================
    -- 1. EK DEPOLAR (WAREHOUSES)
    -- ========================================================================
    SELECT id INTO v_wh_main_id FROM warehouses WHERE code = 'WH-ATLAS-01' LIMIT 1;
    IF v_wh_main_id IS NULL THEN
        INSERT INTO warehouses (code, name, location, address, is_active, created_at, updated_at)
        VALUES ('WH-ATLAS-01', 'Hadımköy Merkez Dokuma Deposu', 'İstanbul / Hadımköy', 'Dokumacılar Sanayi Sitesi A Blok No:12 Hadımköy/İstanbul', true, v_now, v_now)
        RETURNING id INTO v_wh_main_id;
    END IF;

    SELECT id INTO v_wh_ege_id FROM warehouses WHERE code = 'WH-ATLAS-02' LIMIT 1;
    IF v_wh_ege_id IS NULL THEN
        INSERT INTO warehouses (code, name, location, address, is_active, created_at, updated_at)
        VALUES ('WH-ATLAS-02', 'Ege Bölge Hammadde Deposu', 'İzmir / Gaziemir', 'Serbest Bölge 4. Cadde No:8 Gaziemir/İzmir', true, v_now, v_now)
        RETURNING id INTO v_wh_ege_id;
    END IF;

    -- Bursa Kumaş Dağıtım Deposu
    SELECT id INTO v_wh_bursa_id FROM warehouses WHERE code = 'WH-ATLAS-BURSA' LIMIT 1;
    IF v_wh_bursa_id IS NULL THEN
        INSERT INTO warehouses (code, name, location, address, is_active, created_at, updated_at)
        VALUES ('WH-ATLAS-BURSA', 'Bursa Nilüfer Lojistik ve İplik Deposu', 'Bursa / Nilüfer', 'Demirtaş OSB 12. Cad. No:4 Nilüfer/Bursa', true, v_now, v_now)
        RETURNING id INTO v_wh_bursa_id;
    END IF;

    -- Gaziantep Bölge İplik Deposu
    SELECT id INTO v_wh_gaziantep_id FROM warehouses WHERE code = 'WH-ATLAS-GAZ' LIMIT 1;
    IF v_wh_gaziantep_id IS NULL THEN
        INSERT INTO warehouses (code, name, location, address, is_active, created_at, updated_at)
        VALUES ('WH-ATLAS-GAZ', 'Gaziantep Güneydoğu İplik Transfer Deposu', 'Gaziantep / Şehitkamil', '4. Organize Sanayi Bölgesi 83414 Nolu Cad. No:6 Şehitkamil/Gaziantep', true, v_now, v_now)
        RETURNING id INTO v_wh_gaziantep_id;
    END IF;

    -- ========================================================================
    -- 2. EK KATEGORİLER, ÜRÜNLER VE VARYANTLAR (CATALOG & SKU)
    -- ========================================================================
    -- Kategoriler
    INSERT INTO categories (code, name, description, is_active)
    VALUES 
        ('KAT-IPLIK', 'Endüstriyel Dokuma & Triko İplikleri', 'Ring, kompakt, open-end ve melanj iplik bobinleri', true),
        ('KAT-KUMAS-DEN', 'Ağır Gramajlı Denim & Gabardin', 'Pantolonluk ve montluk pamuk-likra gabardinler', true),
        ('KAT-AKSESUAR', 'Tekstil Yan Malzeme & Aksesuar', 'Düğme, tela, astar, fermuar ve çıtçıt grupları', true),
        ('KAT-KONFEKSIYON', 'Kurumsal İş Kıyafeti & Üniforma', 'Endüstriyel antistatik iş önlükleri ve pantolonları', true),
        ('KAT-AMBALAJ', 'Lojistik Ambalaj & Koli Malzemesi', 'Kumaş naylonu, shrink rulo, kraft koli ve paletleme bandı', true)
    ON CONFLICT (code) DO NOTHING;

    SELECT id INTO v_cat_iplik_id FROM categories WHERE code = 'KAT-IPLIK';
    SELECT id INTO v_cat_kumas_id FROM categories WHERE code = 'KAT-KUMAS-DEN';
    SELECT id INTO v_cat_aksesuar_id FROM categories WHERE code = 'KAT-AKSESUAR';
    SELECT id INTO v_cat_konfeksiyon_id FROM categories WHERE code = 'KAT-KONFEKSIYON';
    SELECT id INTO v_cat_ambalaj_id FROM categories WHERE code = 'KAT-AMBALAJ';

    -- Ürün 1: Ne 30/1 Penye Pamuk İpliği
    INSERT INTO products (code, name, category_id, base_unit, tax_rate, description, attributes)
    VALUES ('PRD-IPL-301', 'Ne 30/1 Kompakt Penye Pamuk İplik Bobini', v_cat_iplik_id, 'KG', 10.00, 'Taranmış Ege pamuğundan yüksek mukavemetli bobin iplik.', '{"elyaf": "%100 Pamuk", "mukavemet": "18.5 cN/tex", "bukum": "780 T/m"}'::jsonb)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_id;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes)
    VALUES 
        (v_prd_id, 'IPL-301-EKRU', '868000400101', 'Bobin / Ekru Ham Renk', 120.00, 165.00, 1500, 200, '{"renk": "Ekru", "bobinAgirlik": "2.2kg"}'::jsonb),
        (v_prd_id, 'IPL-301-SIYAH', '868000400102', 'Bobin / Reaktif Siyah', 140.00, 195.00, 1200, 150, '{"renk": "Siyah", "bobinAgirlik": "2.2kg"}'::jsonb)
    ON CONFLICT (sku) DO UPDATE SET variant_name = EXCLUDED.variant_name;

    -- Ürün 2: 13.5 Oz Taşlanmış Ağır Denim Kumaş
    INSERT INTO products (code, name, category_id, base_unit, tax_rate, description, attributes)
    VALUES ('PRD-DEN-135', '13.5 Oz Premium Selvedge Denim Kumaş Topu', v_cat_kumas_id, 'TOP', 10.00, 'Klasik kırmızı kenarlı selvedge ağır pantolonluk kot kumaşı (100m).', '{"gramaj": "13.5 Oz", "en": "82 cm", "dokumaTipi": "3/1 Sağ Dimi"}'::jsonb)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_id;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes)
    VALUES 
        (v_prd_id, 'DEN-135-INDIGO', '868000400201', '100m Top / Derin İndigo Mavi', 6400.00, 8900.00, 80, 15, '{"renk": "Derin İndigo", "uzunluk": "100m"}'::jsonb),
        (v_prd_id, 'DEN-135-BLACK', '868000400202', '100m Top / Kükürt Siyah', 6200.00, 8600.00, 60, 10, '{"renk": "Kükürt Siyah", "uzunluk": "100m"}'::jsonb)
    ON CONFLICT (sku) DO UPDATE SET variant_name = EXCLUDED.variant_name;

    -- Ürün 3: Sedef & Boynuz Efektli Gömlek Düğmesi
    INSERT INTO products (code, name, category_id, base_unit, tax_rate, description, attributes)
    VALUES ('PRD-AKS-DGM', 'Doğal Efektli 4 Delikli Polyester Düğme (10.000 Adet)', v_cat_aksesuar_id, 'PAKET', 20.00, 'İtalyan stil takım elbise ve gömlek düğme toptan paketi.', '{"boyut": "18 Boy (11.5mm)", "malzeme": "Polyester Sedef", "delik": 4}'::jsonb)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_id;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes)
    VALUES 
        (v_prd_id, 'AKS-DGM-18SED', '868000400301', 'Paket / 18 Boy Sedef Beyaz', 450.00, 750.00, 300, 50, '{"renk": "Sedef Beyaz", "adet": 10000}'::jsonb),
        (v_prd_id, 'AKS-DGM-18KAH', '868000400302', 'Paket / 18 Boy Boynuz Kahve', 480.00, 790.00, 250, 40, '{"renk": "Boynuz Kahve", "adet": 10000}'::jsonb)
    ON CONFLICT (sku) DO UPDATE SET variant_name = EXCLUDED.variant_name;

    -- Ürün 4: Antistatik Gabardin İmalatçı İş Tulumu
    INSERT INTO products (code, name, category_id, base_unit, tax_rate, description, attributes)
    VALUES ('PRD-KONF-TLM', 'Reflektörlü Antistatik Endüstriyel İş Tulumu', v_cat_konfeksiyon_id, 'ADET', 10.00, 'Otomotiv ve kimya sanayi için alev geciktirici ve su itici tulum.', '{"kumas": "240 GSM Pamuk/Polyester", "standart": "EN ISO 11612", "reflektor": "3M Scotchlite"}'::jsonb)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_prd_id;

    INSERT INTO product_variants (product_id, sku, barcode, variant_name, purchase_price, sale_price, stock_quantity, reserved_stock, attributes)
    VALUES 
        (v_prd_id, 'TLM-ANT-L-LAC', '868000400401', 'L Beden / Lacivert-Turuncu', 380.00, 620.00, 400, 80, '{"beden": "L", "renk": "Lacivert/Turuncu"}'::jsonb),
        (v_prd_id, 'TLM-ANT-XL-LAC', '868000400402', 'XL Beden / Lacivert-Turuncu', 390.00, 640.00, 350, 60, '{"beden": "XL", "renk": "Lacivert/Turuncu"}'::jsonb)
    ON CONFLICT (sku) DO UPDATE SET variant_name = EXCLUDED.variant_name;

    -- Varyant ID'lerini topla
    SELECT array_agg(id) INTO v_var_ids FROM product_variants;

    -- ========================================================================
    -- 3. ÇOKLU DEPO STOK BAKİYELERİ (WAREHOUSE_STOCKS)
    -- ========================================================================
    FOREACH v_var_id IN ARRAY v_var_ids
    LOOP
        INSERT INTO warehouse_stocks (warehouse_id, variant_id, quantity, reserved_stock, shelf_location, version)
        VALUES 
            (v_wh_main_id, v_var_id, 250.000, 30.000, 'A-RAF-01', 0),
            (v_wh_ege_id, v_var_id, 120.000, 15.000, 'E-RAF-04', 0),
            (v_wh_bursa_id, v_var_id, 180.000, 20.000, 'B-RAF-02', 0),
            (v_wh_gaziantep_id, v_var_id, 90.000, 10.000, 'G-RAF-01', 0)
        ON CONFLICT (warehouse_id, variant_id) DO NOTHING;
    END LOOP;

    -- ========================================================================
    -- 4. 100 ADET DETAYLI CARİ HESAP (BUSINESS PARTNERS)
    -- Sektörel, E-Fatura, Finansal Risk Limiti, IBAN ve CRM Metadatalı
    -- ========================================================================
    FOR i IN 1..100 LOOP
        v_code_suffix := LPAD(i::TEXT, 3, '0');
        
        -- Tür dağılımı: 1-50 Müşteri (CUSTOMER), 51-85 Tedarikçi (SUPPLIER), 86-100 Her İkisi (BOTH)
        IF i <= 50 THEN
            v_partner_type := 'CUSTOMER';
            v_sector := CASE (i % 6)
                WHEN 0 THEN 'Hazır Giyim & Konfeksiyon'
                WHEN 1 THEN 'Zincir Perakende & Mağazacılık'
                WHEN 2 THEN 'E-Ticaret & Pazaryeri Satıcısı'
                WHEN 3 THEN 'Kurumsal İş Kıyafeti Alıcısı'
                WHEN 4 THEN 'Uluslararası Tekstil İhracatçısı'
                ELSE 'Boutique & Tasarım Markası'
            END;
            v_p_name := CASE (i % 10)
                WHEN 0 THEN 'Moda Trend Tekstil ve Konfeksiyon San. Tic. A.Ş.'
                WHEN 1 THEN 'Marmara Giyim ve Mağazacılık Hizmetleri Ltd. Şti.'
                WHEN 2 THEN 'Ege Denim İmalat ve İhracat Pazarlama A.Ş.'
                WHEN 3 THEN 'Zirve Kurumsal Kıyafet ve İş Güvenliği Ltd.'
                WHEN 4 THEN 'Anadolu Toptan Dokuma ve Konfeksiyon A.Ş.'
                WHEN 5 THEN 'Bosphorus Fashion & Apparel Dış Ticaret Ltd.'
                WHEN 6 THEN 'Akdeniz Perakende Zinciri ve Tekstil A.Ş.'
                WHEN 7 THEN 'Nova Stil Kadın & Erkek Giyim Sanayi Ltd.'
                WHEN 8 THEN 'Elit Dokuma ve Hazır Giyim Fabrikası A.Ş.'
                ELSE 'Koleksiyon Tasarım ve Tekstil İhracat Ticaret Ltd.'
            END || ' (Müşteri #' || v_code_suffix || ')';
        ELSIF i <= 85 THEN
            v_partner_type := 'SUPPLIER';
            v_sector := CASE (i % 5)
                WHEN 0 THEN 'Ham Lif & Pamuk Tedariki'
                WHEN 1 THEN 'İplik İmalatı & Büküm'
                WHEN 2 THEN 'Boya & Kimyasal Yardımcı Maddeler'
                WHEN 3 THEN 'Fermuar, Düğme & Aksesuar'
                ELSE 'Endüstriyel Koli & Ambalaj'
            END;
            v_p_name := CASE (i % 8)
                WHEN 0 THEN 'Toros Pamuk ve Elyaf Sanayi Ticaret A.Ş.'
                WHEN 1 THEN 'Gaziantep Ring İplik ve Elyaf Fabrikası Ltd.'
                WHEN 2 THEN 'Bursa Kimya Boya ve Tekstil Yardımcıları A.Ş.'
                WHEN 3 THEN 'Ege Aksesuar Fermuar ve Düğme Sanayi Ltd.'
                WHEN 4 THEN 'Denizli Dokuma İplik ve Ham Kumaş Pazarlama A.Ş.'
                WHEN 5 THEN 'Çukurova Tarım ve Pamuk Çırçır İşletmeleri A.Ş.'
                WHEN 6 THEN 'Özen Ambalaj Koli ve Shrink Film Sanayi Ltd.'
                ELSE 'Altın Mekik Düğme ve Metal Aksesuar A.Ş.'
            END || ' (Tedarikçi #' || v_code_suffix || ')';
        ELSE
            v_partner_type := 'BOTH';
            v_sector := CASE (i % 3)
                WHEN 0 THEN 'Fason Boyahane & Kumaş Ticareti'
                WHEN 1 THEN 'Örme İmalatı & İplik Distribütörü'
                ELSE 'Lojistik & Gümrüklü Antrepo Entegresi'
            END;
            v_p_name := CASE (i % 5)
                WHEN 0 THEN 'Avrasya Entegre Tekstil Boya ve Kumaş Sanayi A.Ş.'
                WHEN 1 THEN 'Kardeşler İplik Dokuma ve Konfeksiyon Ltd. Şti.'
                WHEN 2 THEN 'Mega Tekstil İthalat İhracat ve Pazarlama A.Ş.'
                WHEN 3 THEN 'Global Kumaşçılık ve Boyahane Hizmetleri Ltd.'
                ELSE 'Sentez Elyaf İplik ve Hazır Giyim Sanayi A.Ş.'
            END || ' (Partner #' || v_code_suffix || ')';
        END IF;

        -- Şehir ve Vergi Dairesi Çeşitliliği
        v_city := CASE (i % 8)
            WHEN 0 THEN 'İstanbul'
            WHEN 1 THEN 'Bursa'
            WHEN 2 THEN 'İzmir'
            WHEN 3 THEN 'Gaziantep'
            WHEN 4 THEN 'Adana'
            WHEN 5 THEN 'Denizli'
            WHEN 6 THEN 'Kahramanmaraş'
            ELSE 'Tekirdağ (Çorlu)'
        END;

        v_district := CASE v_city
            WHEN 'İstanbul' THEN CASE (i % 4) WHEN 0 THEN 'Güngören' WHEN 1 THEN 'Zeytinburnu' WHEN 2 THEN 'Hadımköy' ELSE 'İkitelli OSB' END
            WHEN 'Bursa' THEN 'Nilüfer OSB'
            WHEN 'İzmir' THEN 'Çiğli Atatürk OSB'
            WHEN 'Gaziantep' THEN 'Şehitkamil 4. OSB'
            WHEN 'Adana' THEN 'Seyhan Sanayi Sitesi'
            WHEN 'Denizli' THEN 'Merkezefendi Tekstilciler Sitesi'
            WHEN 'Kahramanmaraş' THEN 'Türkoğlu OSB'
            ELSE 'Çorlu Deri ve Tekstil İhtisas OSB'
        END;

        v_tax_office := CASE v_city
            WHEN 'İstanbul' THEN CASE (i % 3) WHEN 0 THEN 'Büyük Mükellefler VD' WHEN 1 THEN 'Merter VD' ELSE 'İkitelli VD' END
            WHEN 'Bursa' THEN 'Nilüfer VD'
            WHEN 'İzmir' THEN 'Konak VD'
            WHEN 'Gaziantep' THEN 'Şehitkamil VD'
            WHEN 'Adana' THEN 'Seyhan VD'
            WHEN 'Denizli' THEN 'Saraylar VD'
            WHEN 'Kahramanmaraş' THEN 'Aksu VD'
            ELSE 'Çorlu VD'
        END;

        v_tax_no := (1000000000 + i * 83719)::TEXT;
        v_limit := 500000.00 + (i * 25000.00);
        v_term := CASE (i % 4) WHEN 0 THEN 30 WHEN 1 THEN 45 WHEN 2 THEN 60 ELSE 90 END;
        v_rating := CASE (i % 4) WHEN 0 THEN 'A+' WHEN 1 THEN 'A' WHEN 2 THEN 'B+' ELSE 'A-' END;
        v_iban := 'TR620006200' || LPAD(i::TEXT, 5, '0') || '00006294' || LPAD((i * 13 % 10000)::TEXT, 4, '0');

        INSERT INTO business_partners (
            partner_type, name, company_title, tax_number, tax_office,
            email, phone, address, is_active, metadata, created_at, updated_at, version
        ) VALUES (
            v_partner_type,
            v_p_name,
            v_p_name || ' Anonim Şirketi',
            v_tax_no,
            v_tax_office,
            'muhasebe.cari' || v_code_suffix || '@' || LOWER(REPLACE(REPLACE(v_city, 'İ', 'i'), ' ', '')) || 'tekstil.com.tr',
            '+90 ' || (212 + (i % 40)) || ' ' || (400 + (i % 500)) || ' ' || LPAD((i * 37 % 10000)::TEXT, 4, '0'),
            v_district || ' Sanayi Cad. No:' || (i * 2 + 1) || ' ' || v_city || ' / TÜRKİYE',
            true,
            jsonb_build_object(
                'erp_kodu', 'CAR-' || v_code_suffix,
                'sektor', v_sector,
                'sehir', v_city,
                'ilce', v_district,
                'e_fatura', jsonb_build_object(
                    'mukellef', true,
                    'gib_posta_kutusu', 'urn:mail:defaultpk@' || v_code_suffix || '.com.tr',
                    'gib_gonderici_birim', 'urn:mail:defaultgb@' || v_code_suffix || '.com.tr',
                    'senaryo', 'TICARIFATURA'
                ),
                'finans', jsonb_build_object(
                    'kredi_limiti', v_limit,
                    'vade_gun', v_term,
                    'risk_skoru', v_rating,
                    'para_birimi', CASE (i % 5) WHEN 0 THEN 'EUR' WHEN 1 THEN 'USD' ELSE 'TRY' END,
                    'banka_adi', CASE (i % 5) WHEN 0 THEN 'Garanti BBVA' WHEN 1 THEN 'Türkiye İş Bankası' WHEN 2 THEN 'Yapı Kredi' WHEN 3 THEN 'Akbank' ELSE 'QNB Finansbank' END,
                    'iban', v_iban,
                    'varsayilan_iskonto_orani', (i % 8) * 1.5
                ),
                'crm', jsonb_build_object(
                    'segment', CASE (i % 3) WHEN 0 THEN 'STRATEJIK_VIP' WHEN 1 THEN 'BUYUK_OLCEKLI' ELSE 'STANDART_KOBI' END,
                    'musteri_temsilcisi', CASE (i % 4) WHEN 0 THEN 'Selin Kaya' WHEN 1 THEN 'Burak Demir' WHEN 2 THEN 'Canan Yılmaz' ELSE 'Mert Öztürk' END,
                    'etiketler', jsonb_build_array('B2B', v_sector, v_city, 'Aktif Cari')
                ),
                'lojistik', jsonb_build_object(
                    'anlasmali_kargo', CASE (i % 4) WHEN 0 THEN 'Aras Kargo Kurumsal' WHEN 1 THEN 'Yurtiçi Kargo' WHEN 2 THEN 'Horoz Lojistik' ELSE 'Borusan Lojistik' END,
                    'teslimat_saatleri', '08:30 - 17:30',
                    'ozel_sevk_notu', 'Kumaş topları çift kat naylonlu ve paletli sevk edilmelidir.'
                )
            ),
            v_now - (i || ' days')::INTERVAL,
            v_now,
            0
        ) RETURNING id INTO v_partner_id;

        -- Cari dizilerine ekle
        v_all_partner_ids := array_append(v_all_partner_ids, v_partner_id);
        IF v_partner_type IN ('CUSTOMER', 'BOTH') THEN
            v_customer_ids := array_append(v_customer_ids, v_partner_id);
        END IF;
        IF v_partner_type IN ('SUPPLIER', 'BOTH') THEN
            v_supplier_ids := array_append(v_supplier_ids, v_partner_id);
        END IF;
    END LOOP;

    RAISE NOTICE '>>> [MiniERP Seed] 100 Adet Kurumsal Cari Hesap ve Sektörel Metadata Eklendi.';

    -- ========================================================================
    -- 5. ENTEGRE TEKLİFLER (QUOTATIONS) - 40 ADET
    -- ========================================================================
    FOR i IN 1..40 LOOP
        v_partner_id := v_customer_ids[1 + (i % array_length(v_customer_ids, 1))];
        v_subtotal := 45000.00 + (i * 3850.00);
        v_tax := ROUND(v_subtotal * 0.10, 2);
        v_total := v_subtotal + v_tax;

        INSERT INTO quotations (
            quotation_number, type, partner_id, status, issue_date, valid_until,
            currency, subtotal_amount, tax_amount, discount_amount, total_amount, notes, metadata
        ) VALUES (
            'QT-2026-TK-' || LPAD(i::TEXT, 4, '0'),
            'SALES',
            v_partner_id,
            CASE (i % 5)
                WHEN 0 THEN 'ACCEPTED'
                WHEN 1 THEN 'CONVERTED'
                WHEN 2 THEN 'SENT'
                WHEN 3 THEN 'DRAFT'
                ELSE 'ACCEPTED'
            END,
            v_now - ((45 - i) || ' days')::INTERVAL,
            v_now + ((15 + i) || ' days')::INTERVAL,
            'TRY',
            v_subtotal,
            v_tax,
            0.00,
            v_total,
            '2026 Sezonu B2B toptan kumaş ve iplik tedarik teklifi.',
            jsonb_build_object('teslimSekli', 'DAP Adrese Teslim', 'odemeVadesi', '45 Gün Vadeli', 'hazirlayan', 'Satış Departmanı')
        ) RETURNING id INTO v_quot_id;

        -- Teklif Kalemleri
        INSERT INTO quotation_items (quotation_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
        VALUES 
            (v_quot_id, v_var_ids[1 + (i % array_length(v_var_ids, 1))], 'Kumaş / İplik Partisi A Kalite', 15 + i, ROUND(v_subtotal * 0.6 / (15 + i), 2), 10.00, 0.00, ROUND(v_subtotal * 0.6, 2)),
            (v_quot_id, v_var_ids[1 + ((i + 2) % array_length(v_var_ids, 1))], 'Tamamlayıcı Dokuma Kalemi', 20 + i, ROUND(v_subtotal * 0.4 / (20 + i), 2), 10.00, 0.00, ROUND(v_subtotal * 0.4, 2));
    END LOOP;

    -- ========================================================================
    -- 6. ENTEGRE RESMİ SİPARİŞLER (ORDERS) - 35 ADET
    -- ========================================================================
    FOR i IN 1..35 LOOP
        v_partner_id := v_customer_ids[1 + ((i * 3) % array_length(v_customer_ids, 1))];
        v_subtotal := 60000.00 + (i * 4200.00);
        v_tax := ROUND(v_subtotal * 0.10, 2);
        v_total := v_subtotal + v_tax;

        INSERT INTO orders (
            order_number, order_type, partner_id, status, order_date, delivery_date,
            currency, subtotal_amount, tax_amount, discount_amount, total_amount, notes, metadata
        ) VALUES (
            'SIP-SAT-2026-' || LPAD(i::TEXT, 4, '0'),
            'SALES_ORDER',
            v_partner_id,
            CASE (i % 4)
                WHEN 0 THEN 'CONFIRMED'
                WHEN 1 THEN 'COMPLETED'
                WHEN 2 THEN 'DRAFT'
                ELSE 'CONFIRMED'
            END,
            v_now - ((35 - i) || ' days')::INTERVAL,
            v_now + (i || ' days')::INTERVAL,
            'TRY',
            v_subtotal,
            v_tax,
            0.00,
            v_total,
            'Resmi sözleşmeye bağlı B2B satış siparişi. İrsaliye hazırlığı yapılabilir.',
            jsonb_build_object('siparisKanali', 'B2B Portal', 'onaylayanYetkili', 'Satış Direktörü', 'e_fatura_talep', true)
        ) RETURNING id INTO v_order_id;

        -- Sipariş Kalemleri
        INSERT INTO order_items (order_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
        VALUES 
            (v_order_id, v_var_ids[1 + ((i * 2) % array_length(v_var_ids, 1))], 'Sipariş Edilen Ürün Varyantı', 25 + i, ROUND(v_subtotal / (25 + i), 2), 10.00, 0.00, v_subtotal)
        RETURNING id INTO v_order_item_id;

        -- ====================================================================
        -- 7. SEVK İRSALİYELERİ (WAYBILLS) - İlk 25 Sipariş İçin
        -- ====================================================================
        IF i <= 25 THEN
            INSERT INTO waybills (
                waybill_number, type, partner_id, order_id, source_warehouse_id, status,
                dispatch_date, carrier_company, tracking_number, vehicle_plate, notes, metadata
            ) VALUES (
                'IRS-SVK-2026-' || LPAD(i::TEXT, 4, '0'),
                'DISPATCH',
                v_partner_id,
                v_order_id,
                CASE (i % 4)
                    WHEN 0 THEN v_wh_main_id
                    WHEN 1 THEN v_wh_ege_id
                    WHEN 2 THEN v_wh_bursa_id
                    ELSE v_wh_gaziantep_id
                END,
                CASE (i % 3)
                    WHEN 0 THEN 'DELIVERED'
                    WHEN 1 THEN 'DISPATCHED'
                    ELSE 'DELIVERED'
                END,
                v_now - ((28 - i) || ' days')::INTERVAL,
                CASE (i % 3) WHEN 0 THEN 'Borusan Lojistik' WHEN 1 THEN 'Aras Kargo Lojistik' ELSE 'Ekol Taşımacılık' END,
                'TRK-2026-' || (89000000 + i * 1173),
                (34 + (i % 47)) || ' TK ' || (1000 + i * 19),
                'Kumaş ruloları barkodlu ve paletli teslim edildi.',
                jsonb_build_object('ettn_uuid', gen_random_uuid(), 'surucuAdi', 'Ahmet Demirci', 'surucuTc', '12938471928')
            ) RETURNING id INTO v_waybill_id;

            INSERT INTO waybill_items (waybill_id, order_item_id, variant_id, description, quantity, unit_price)
            VALUES (v_waybill_id, v_order_item_id, v_var_ids[1 + ((i * 2) % array_length(v_var_ids, 1))], 'Sevk Edilen Malzeme Rulosu', 25 + i, ROUND(v_subtotal / (25 + i), 2));

            -- Stok Hareketi Kaydet
            INSERT INTO stock_movements (
                movement_number, movement_type, source_warehouse_id, variant_id,
                quantity, reference_type, reference_id, notes, performed_by, created_at
            ) VALUES (
                'SM-2026-OUT-' || LPAD(i::TEXT, 4, '0'),
                'GOODS_ISSUE',
                CASE (i % 4) WHEN 0 THEN v_wh_main_id WHEN 1 THEN v_wh_ege_id WHEN 2 THEN v_wh_bursa_id ELSE v_wh_gaziantep_id END,
                v_var_ids[1 + ((i * 2) % array_length(v_var_ids, 1))],
                25 + i,
                'WAYBILL',
                v_waybill_id,
                'İrsaliyeli sevkiyat çıkışı.',
                'admin',
                v_now - ((28 - i) || ' days')::INTERVAL
            );

            -- ================================================================
            -- 8. SATIŞ FATURALARI (INVOICES) - İlk 20 İrsaliye İçin
            -- ================================================================
            IF i <= 20 THEN
                v_paid := CASE (i % 3)
                    WHEN 0 THEN v_total -- Tamamen Ödendi (PAID)
                    WHEN 1 THEN ROUND(v_total * 0.4, 2) -- Kısmen Ödendi (PARTIALLY_PAID)
                    ELSE 0.00 -- Henüz Ödenmedi (APPROVED)
                END;

                INSERT INTO invoices (
                    invoice_number, invoice_type, partner_id, order_id, waybill_id, status,
                    invoice_date, due_date, currency, exchange_rate, subtotal_amount, tax_amount,
                    discount_amount, total_amount, paid_amount, remaining_amount, notes, metadata
                ) VALUES (
                    'FTR-SAT-2026-' || LPAD(i::TEXT, 4, '0'),
                    'SALES_INVOICE',
                    v_partner_id,
                    v_order_id,
                    v_waybill_id,
                    CASE 
                        WHEN v_paid >= v_total THEN 'PAID'
                        WHEN v_paid > 0 THEN 'PARTIALLY_PAID'
                        ELSE 'APPROVED'
                    END,
                    v_now - ((25 - i) || ' days')::INTERVAL,
                    v_now + ((30 - i) || ' days')::INTERVAL,
                    'TRY',
                    1.0000,
                    v_subtotal,
                    v_tax,
                    0.00,
                    v_total,
                    v_paid,
                    v_total - v_paid,
                    'IRS-SVK-2026-' || LPAD(i::TEXT, 4, '0') || ' irsaliyesine istinaden tanzim edilmiştir.',
                    jsonb_build_object(
                        'gib_ettn', gen_random_uuid(),
                        'gib_durum', '1200 - Başarıyla İşlendi',
                        'fatura_tipi', 'SATIS',
                        'vade_gunu', 30
                    )
                ) RETURNING id INTO v_invoice_id;

                INSERT INTO invoice_items (invoice_id, variant_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
                VALUES (v_invoice_id, v_var_ids[1 + ((i * 2) % array_length(v_var_ids, 1))], 'Faturalandırılan Kumaş/İplik Teslimatı', 25 + i, ROUND(v_subtotal / (25 + i), 2), 10.00, 0.00, v_subtotal);

                -- ============================================================
                -- 9. TAHSİLAT VE ÖDEMELER (PAYMENTS)
                -- ============================================================
                IF v_paid > 0 THEN
                    INSERT INTO payments (
                        payment_number, payment_type, invoice_id, partner_id, amount,
                        currency, exchange_rate, payment_method, payment_date, reference_number,
                        status, notes, metadata
                    ) VALUES (
                        'ODM-2026-' || LPAD(i::TEXT, 4, '0'),
                        'INCOMING',
                        v_invoice_id,
                        v_partner_id,
                        v_paid,
                        'TRY',
                        1.0000,
                        'BANK_TRANSFER',
                        v_now - ((20 - i) || ' days')::INTERVAL,
                        'HAV-2026-BNK-' || (1029384 + i * 47),
                        'COMPLETED',
                        'Garanti BBVA Kurumsal Ticari Hesaba B2B Havale Tahsilatı.',
                        jsonb_build_object('dekontNo', 'DKT-' || (981723 + i * 11), 'onayVeren', 'Finans Müdürü')
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- ========================================================================
    -- 10. ÜRETİM REÇETELERİ (BOM) VE İŞ EMİRLERİ (WORK ORDERS)
    -- ========================================================================
    -- Reçete 1: Ağır Denim Pantolon Dikim Reçetesi
    INSERT INTO bill_of_materials (bom_code, name, variant_id, quantity, unit, description, industry_type, metadata)
    VALUES (
        'BOM-DEN-PRM-01',
        '13.5 Oz Selvedge Denim Pantolon İmalat Reçetesi',
        v_var_ids[1],
        1.000,
        'ADET',
        'Kumaş kesim, yıkama, perçin montajı ve ütü paket adımları.',
        'TEXTILE',
        '{"standartMaliyetTRY": 320.00, "dikimSuresiDakika": 45, "hatNo": "Konfeksiyon-1"}'::jsonb
    ) RETURNING id INTO v_bom_id;

    INSERT INTO bom_items (bom_id, component_variant_id, quantity, unit, scrap_rate, description)
    VALUES 
        (v_bom_id, v_var_ids[2], 1.450, 'METRE', 3.00, 'Pantolon başına kumaş sarfiyatı'),
        (v_bom_id, v_var_ids[3], 0.001, 'PAKET', 0.00, 'Metal düğme ve perçin takımı');

    -- İş Emirleri
    INSERT INTO work_orders (
        order_number, bom_id, source_warehouse_id, target_warehouse_id,
        planned_quantity, produced_quantity, status, priority, start_date, due_date, completion_date, notes, metadata
    ) VALUES 
        ('WO-2026-TK-001', v_bom_id, v_wh_main_id, v_wh_main_id, 500.000, 500.000, 'COMPLETED', 'HIGH', v_now - INTERVAL '15 days', v_now - INTERVAL '5 days', v_now - INTERVAL '5 days', 'Müşteri siparişi için 500 adet kot dikimi başarıyla tamamlandı.', '{"operator": "Mehmet Usta", "vardiya": "Gündüz"}'::jsonb),
        ('WO-2026-TK-002', v_bom_id, v_wh_main_id, v_wh_main_id, 300.000, 120.000, 'IN_PROGRESS', 'URGENT', v_now - INTERVAL '2 days', v_now + INTERVAL '3 days', NULL, 'Bantta dikiş devam ediyor.', '{"operator": "Hasan Usta", "vardiya": "Gece"}'::jsonb),
        ('WO-2026-TK-003', v_bom_id, v_wh_bursa_id, v_wh_bursa_id, 1000.000, 0.000, 'PLANNED', 'NORMAL', v_now + INTERVAL '2 days', v_now + INTERVAL '12 days', NULL, 'Gelecek ay mağaza vitrini stok takviyesi.', '{"planlamaUzmani": "Zeynep Arslan"}'::jsonb);

    -- ========================================================================
    -- 11. DENETİM LOGLARI (AUDIT LOGS)
    -- ========================================================================
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, ip_address, details, performed_at)
    VALUES 
        ('SYSTEM_BULK_SEED', 'BusinessPartner', 100, 'SYSTEM', '127.0.0.1', '{"aciklama": "100 adet kurumsal cari hesap ve entegre B2B sipariş/irsaliye/fatura ekosistemi yüklendi."}'::jsonb, v_now),
        ('STOCK_INITIAL_LOAD', 'WarehouseStock', 4, 'admin', '192.168.1.10', '{"depoSayisi": 4, "islem": "Konsolide stok bakiyeleri güncellendi."}'::jsonb, v_now),
        ('FINANCIAL_LEDGER_SYNC', 'Invoice', 20, 'admin', '192.168.1.10', '{"faturaSayisi": 20, "tahsilatSayisi": 15}'::jsonb, v_now);

    RAISE NOTICE '>>> [MiniERP Seed] Tüm 100 Cari Hesap, Teklifler, Siparişler, İrsaliyeler, Faturalar, Ödemeler ve Üretim Reçeteleri Başarıyla Oluşturuldu!';
END $$;
