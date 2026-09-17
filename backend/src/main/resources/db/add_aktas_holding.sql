SET search_path = tenant_tekstil, public;

DO $$
DECLARE
    v_partner_id BIGINT;
    v_inv_1_id BIGINT;
    v_inv_2_id BIGINT;
    v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- 1. Aktaş Holding Cari Kartı
    INSERT INTO business_partners (
        partner_type, name, company_title, tax_number, tax_office,
        email, phone, address, is_active, metadata, created_at, updated_at, version
    ) VALUES (
        'BOTH',
        'Aktaş Holding A.Ş.',
        'Aktaş Holding Anonim Şirketi',
        '0380918234',
        'Büyük Mükellefler VD',
        'cozum.ortagi@aktasholding.com.tr',
        '+90 212 988 50 00',
        'Levent 199 Plaza Kat:24 Büyükdere Cad. No:199 Şişli / İstanbul',
        true,
        jsonb_build_object(
            'erp_kodu', 'CAR-AKTAS-01',
            'partner_rolu', 'STRATEJIK_COZUM_ORTAGI',
            'fiziki_urun_satisi', false,
            'hizmet_carisi', true,
            'hizmet_kapsami', jsonb_build_array(
                'ERP Sistem Mimarisi & Danışmanlığı',
                'Özel Yazılım Geliştirme & Entegrasyon',
                'Bulut Sunucu & Veritabanı Yönetimi',
                'Kurumsal Eğitim & 7/24 Teknik Destek'
            ),
            'sozlesme', jsonb_build_object(
                'sozlesme_no', 'SOZ-2026-AKT-01',
                'baslangic', '2026-01-01',
                'bitis', '2028-12-31',
                'para_birimi', 'TRY',
                'periyot', 'Yıllık Bakım & Aylık Hizmet'
            ),
            'finans', jsonb_build_object(
                'kredi_limiti', 10000000.0,
                'vade_gun', 30,
                'risk_skoru', 'AAA',
                'para_birimi', 'TRY',
                'banka_adi', 'Garanti BBVA - Levent Ticari Şube',
                'iban', 'TR340006200000199000000199',
                'varsayilan_iskonto_orani', 0.0
            ),
            'e_fatura', jsonb_build_object(
                'mukellef', true,
                'senaryo', 'TICARIFATURA',
                'gib_posta_kutusu', 'urn:mail:defaultpk@aktasholding.com.tr',
                'gib_gonderici_birim', 'urn:mail:defaultgb@aktasholding.com.tr'
            ),
            'crm', jsonb_build_object(
                'segment', 'STRATEJIK_PARTNER',
                'yonetici_kontak', 'Murat Aktaş (Yönetim Kurulu Üyesi)',
                'etiketler', jsonb_build_array('Çözüm Ortağı', 'Yazılım & Danışmanlık', 'VIP Stratejik Partner', 'Hizmet Carisi')
            )
        ),
        v_now - INTERVAL '90 days',
        v_now,
        0
    ) RETURNING id INTO v_partner_id;

    -- 2. Hizmet Faturası 1: ERP Mimari & Yazılım Danışmanlığı Hizmet Bedeli (Tamamı Ödendi - PAID)
    INSERT INTO invoices (
        invoice_number, invoice_type, partner_id, status, invoice_date, due_date,
        currency, exchange_rate, subtotal_amount, tax_amount, discount_amount, total_amount,
        paid_amount, remaining_amount, notes, metadata
    ) VALUES (
        'FTR-HZM-2026-001',
        'SALES_INVOICE',
        v_partner_id,
        'PAID',
        v_now - INTERVAL '45 days',
        v_now - INTERVAL '15 days',
        'TRY',
        1.0000,
        250000.00,
        50000.00,
        0.00,
        300000.00,
        300000.00,
        0.00,
        'Aktaş Holding ERP Çözüm Ortaklığı Q1 Yazılım & Mimari Danışmanlık Hizmet Faturası.',
        jsonb_build_object(
            'hizmet_turu', 'YAZILIM_DANISMANLIK',
            'gib_ettn', gen_random_uuid(),
            'gib_durum', '1200 - Başarıyla İşlendi',
            'e_arsiv', false
        )
    ) RETURNING id INTO v_inv_1_id;

    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
    VALUES 
        (v_inv_1_id, 'ERP Sistem Mimarisi & Backend Çekirdek Danışmanlık Hizmeti', 1.000, 150000.00, 20.00, 0.00, 150000.00),
        (v_inv_1_id, 'Özel Multi-Tenancy & Veritabanı Optimizasyon Hizmeti', 1.000, 100000.00, 20.00, 0.00, 100000.00);

    -- Tahsilat (Payment 1)
    INSERT INTO payments (
        payment_number, payment_type, invoice_id, partner_id, amount,
        currency, exchange_rate, payment_method, payment_date, reference_number,
        status, notes, metadata
    ) VALUES (
        'ODM-AKT-2026-001',
        'INCOMING',
        v_inv_1_id,
        v_partner_id,
        300000.00,
        'TRY',
        1.0000,
        'BANK_TRANSFER',
        v_now - INTERVAL '20 days',
        'HAV-AKT-9920194',
        'COMPLETED',
        'Aktaş Holding Garanti BBVA Ticari Hesaptan gelen danışmanlık hizmet bedeli havalesi.',
        jsonb_build_object('dekontNo', 'DKT-AKT-01', 'islemTuru', 'Hizmet Bedeli Tahsilatı')
    );

    -- 3. Hizmet Faturası 2: Q2 Bulut Bakım & SLA Destek Hizmet Bedeli (Kısmen Ödendi - PARTIALLY_PAID)
    INSERT INTO invoices (
        invoice_number, invoice_type, partner_id, status, invoice_date, due_date,
        currency, exchange_rate, subtotal_amount, tax_amount, discount_amount, total_amount,
        paid_amount, remaining_amount, notes, metadata
    ) VALUES (
        'FTR-HZM-2026-002',
        'SALES_INVOICE',
        v_partner_id,
        'PARTIALLY_PAID',
        v_now - INTERVAL '10 days',
        v_now + INTERVAL '20 days',
        'TRY',
        1.0000,
        150000.00,
        30000.00,
        0.00,
        180000.00,
        100000.00,
        80000.00,
        'Aktaş Holding 7/24 Kesintisiz Bulut SLA ve Bakım Hizmet Bedeli (Q2-2026).',
        jsonb_build_object(
            'hizmet_turu', 'SLA_BAKIM_DESTEK',
            'gib_ettn', gen_random_uuid(),
            'gib_durum', '1200 - Başarıyla İşlendi'
        )
    ) RETURNING id INTO v_inv_2_id;

    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, discount_rate, subtotal)
    VALUES (v_inv_2_id, 'Kurumsal Bulut SLA Altyapı ve Lisans Destek Hizmeti (3 Aylık)', 1.000, 150000.00, 20.00, 0.00, 150000.00);

    -- Tahsilat (Payment 2 - Kısmi)
    INSERT INTO payments (
        payment_number, payment_type, invoice_id, partner_id, amount,
        currency, exchange_rate, payment_method, payment_date, reference_number,
        status, notes, metadata
    ) VALUES (
        'ODM-AKT-2026-002',
        'INCOMING',
        v_inv_2_id,
        v_partner_id,
        100000.00,
        'TRY',
        1.0000,
        'BANK_TRANSFER',
        v_now - INTERVAL '3 days',
        'HAV-AKT-9920245',
        'COMPLETED',
        'Aktaş Holding Q2 SLA peşin avansı.',
        jsonb_build_object('dekontNo', 'DKT-AKT-02', 'kalanBakiye', 80000.00)
    );

    RAISE NOTICE '>>> [Aktaş Holding] Çözüm Ortağı Carisi ve Hizmet Faturaları Başarıyla Oluşturuldu!';
END $$;
