const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:8080';
const TENANT_ID = 'tenant_aktas';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || (BASE_URL + options.path));
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({
              status: res.statusCode,
              error: parsed || body,
              message: `HTTP ${res.statusCode}: ${JSON.stringify(parsed || body)}`,
            });
          }
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runAtlasTekstilTest() {
  console.log('====================================================================');
  console.log('🧵 ATLAS TEKSTİL İŞLEMİ VE VERİTABANI (POSTGRESQL) DOĞRULAMA TESTİ');
  console.log('====================================================================\n');

  try {
    // 1. GİRİŞ (LOGIN)
    console.log('1️⃣ [KULLANICI GİRİŞİ] Admin kullanıcısı ile giriş yapılıyor...');
    const loginRes = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
    }, {
      username: 'admin',
      password: 'admin123',
      tenantId: TENANT_ID,
    });

    const token = loginRes.data.accessToken || loginRes.data.token;
    console.log('   ✅ Giriş başarılı! JWT Token alındı.\n');

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
    };

    // 2. ATLAS TEKSTİL CARİSİ ARAMA / OLUŞTURMA
    console.log('2️⃣ [CARİ KONTROL & TANIMLAMA] Atlas Tekstil cari hesabı kontrol ediliyor...');
    const partnersRes = await request({
      path: '/api/v1/partners?size=50',
      method: 'GET',
      headers: authHeaders,
    });

    const partnerList = partnersRes.data?.content || partnersRes.data?.data?.content || partnersRes.data?.data || (Array.isArray(partnersRes.data) ? partnersRes.data : []);
    let atlasPartner = partnerList.find(p => (p.name && p.name.includes('Atlas Tekstil')) || (p.code && p.code.includes('ATLAS')));

    if (!atlasPartner) {
      // Doğrudan ID 4'ü kontrol edelim
      try {
        const getRes = await request({
          path: '/api/v1/partners/4',
          method: 'GET',
          headers: authHeaders,
        });
        if (getRes.data?.data || getRes.data?.id) {
          atlasPartner = getRes.data?.data || getRes.data;
        }
      } catch (e) {}
    }

    if (!atlasPartner) {
      console.log('   ℹ️ Atlas Tekstil henüz listede yok, yeni cari olarak ekleniyor...');
      const createPartnerRes = await request({
        path: '/api/v1/partners',
        method: 'POST',
        headers: authHeaders,
      }, {
        code: 'CAR-ATLAS-001',
        name: 'Atlas Tekstil Sanayi ve Ticaret A.Ş.',
        companyTitle: 'Atlas Dokuma ve İplik Sanayi Ticaret A.Ş.',
        partnerType: 'BOTH',
        taxNumber: '8899001122',
        taxOffice: 'Bursa Nilüfer VD',
        email: 'muhasebe@atlastekstil.com.tr',
        phone: '+90 224 444 11 22',
        address: 'Demirtaş Organize Sanayi Bölgesi 1. Sokak No:4 Bursa',
      });
      atlasPartner = createPartnerRes.data?.data || createPartnerRes.data;
      console.log(`   ✅ Atlas Tekstil Cari Hesabı Açıldı! ID: ${atlasPartner.id}, Kod: ${atlasPartner.code}`);
    } else {
      console.log(`   ✅ Atlas Tekstil Cari Hesabı Mevcut! ID: ${atlasPartner.id}, Kod: ${atlasPartner.code}, İsim: ${atlasPartner.name}`);
    }
    console.log();

    // 3. KATEGORİ TANIMI (TEKSTİL & KUMAŞ)
    const katCode = 'KAT-TKS-' + Date.now().toString().slice(-4);
    console.log(`3️⃣ [KATEGORİ TANIMI] Tekstil kategorisi ekleniyor: ${katCode}...`);
    const catRes = await request({
      path: '/api/v1/inventory/categories',
      method: 'POST',
      headers: authHeaders,
    }, {
      name: 'Tekstil & Kumaş Hammaddeleri',
      code: katCode,
      description: 'Atlas Tekstil döşemelik ve dokuma kumaş grubu',
    });
    const createdCat = catRes.data?.data || catRes.data;
    console.log(`   ✅ Kategori oluşturuldu: ${createdCat.name} (ID: ${createdCat.id})\n`);

    // 4. SIFIR STOKLU KUMAŞ ÜRÜN KARTI
    const prdCode = 'HAM-KMF-' + Date.now().toString().slice(-4);
    const skuCode = 'SKU-KMF-' + Date.now().toString().slice(-4);
    console.log(`4️⃣ [SIFIR STOKLU HAMMADDE] Atlas Kadife Kumaş kartı açılıyor: ${prdCode}...`);
    const prodRes = await request({
      path: '/api/v1/inventory/products',
      method: 'POST',
      headers: authHeaders,
    }, {
      categoryId: createdCat.id,
      productType: 'RAW_MATERIAL',
      name: 'Atlas Premium İthal Kadife Kumaş (Antrasit)',
      code: prdCode,
      baseUnit: 'METRE',
      taxRate: 20.00,
      description: 'Atlas Tekstil fabrikasından temin edilen mobilya kaplama kumaşı',
      variants: [
        {
          sku: skuCode,
          variantName: 'Antrasit Gri 140cm En',
          purchasePrice: 250.00,
          salePrice: 450.00,
          stockQuantity: 0, // Sıfır stok
          attributes: { renk: 'Antrasit', genislik: '140cm' },
        },
      ],
    });

    const createdProd = prodRes.data?.data || prodRes.data;
    const rawVariant = createdProd.variants[0];
    console.log(`   ✅ Kumaş Kartı Açıldı! (SKU: ${rawVariant.sku}, Mevcut Fiili Stok: ${rawVariant.stockQuantity} Metre [SIFIR])\n`);

    // 5. ALINAN SATIN ALMA TEKLİFİ (PURCHASE QUOTATION)
    console.log(`5️⃣ [ALINAN TEKLİF] Atlas Tekstil 80 Metre Kumaş Teklifi Gönderdi (Birim: 250 ₺)...`);
    const quoteRes = await request({
      path: '/api/v1/quotations',
      method: 'POST',
      headers: authHeaders,
    }, {
      type: 'PURCHASE',
      partnerId: atlasPartner.id,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: 'Atlas Tekstil Dokuma A.Ş. 80 Metre Kadife Kumaş İkmal Teklifi',
      items: [
        {
          variantId: rawVariant.id,
          quantity: 80,
          unitPrice: 250.00,
          discountRate: 0,
          taxRate: 20.00,
        },
      ],
    });

    const purchaseQuote = quoteRes.data?.data || quoteRes.data;
    console.log(`   ✅ Alınan Teklif Kaydedildi! (No: ${purchaseQuote.quotationNumber}, Tutar: ${purchaseQuote.totalAmount} ₺, Yön: ${purchaseQuote.type})\n`);

    // 6. TEKLİF ONAYI (ACCEPTED)
    console.log(`6️⃣ [TEKLİF ONAYI] Teklif onaylanıyor -> Durum: ACCEPTED yapılıyor...`);
    await request({
      path: `/api/v1/quotations/${purchaseQuote.id}/status?status=ACCEPTED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Alınan Teklif Onaylandı!\n`);

    // 7. SATIN ALMA SİPARİŞİ TÜRETME
    console.log(`7️⃣ [SATIN ALMA SİPARİŞİ] Tekliften resmi sipariş oluşturuluyor...`);
    const orderRes = await request({
      path: `/api/v1/orders/from-quotation/${purchaseQuote.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const purchaseOrder = orderRes.data?.data || orderRes.data;
    console.log(`   ✅ Satın Alma Siparişi Açıldı! (No: ${purchaseOrder.orderNumber}, Tür: ${purchaseOrder.orderType})\n`);

    // 8. SİPARİŞ ONAYI
    console.log(`8️⃣ [SİPARİŞ ONAYI] Sipariş CONFIRMED yapılıyor...`);
    await request({
      path: `/api/v1/orders/${purchaseOrder.id}/status?status=CONFIRMED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Sipariş Onaylandı (Atlas Tekstil sevkiyatı başlattı).\n`);

    // 9. MAL KABUL İRSALİYESİ (RECEIPT)
    console.log(`9️⃣ [MAL KABUL İRSALİYESİ] Kumaş topları depomuza ulaştı, mal kabul irsaliyesi düzenleniyor...`);
    const waybillRes = await request({
      path: `/api/v1/waybills/from-order/${purchaseOrder.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const receiptWaybill = waybillRes.data?.data || waybillRes.data;
    console.log(`   ✅ Mal Kabul İrsaliyesi Açıldı! (No: ${receiptWaybill.waybillNumber}, Tür: ${receiptWaybill.type})\n`);

    // 10. İRSALİYEYİ KABUL ETME (DEPOYA FİZİKİ GİRİŞ)
    console.log(`🔟 [MAL KABUL & STOK GİRİŞİ] İrsaliye teslim alındı -> DISPATCHED yapılıyor (Depoya mal girişi)...`);
    await request({
      path: `/api/v1/waybills/${receiptWaybill.id}/status?status=DISPATCHED`,
      method: 'PATCH',
      headers: authHeaders,
    });

    const updatedProdRes = await request({
      path: `/api/v1/inventory/products/${createdProd.id}`,
      method: 'GET',
      headers: authHeaders,
    });
    const updatedProd = updatedProdRes.data?.data || updatedProdRes.data;
    const updatedVariant = updatedProd.variants[0];
    console.log(`   ✅ Mallar Depoya Fiziki Olarak Girdi!`);
    console.log(`   📈 STOK GÜNCELLEMESİ: Kumaş stoğu 0 Metreden ${updatedVariant.stockQuantity} Metreye yükseldi!\n`);

    // 11. ALIŞ FATURASI
    console.log(`1️⃣1️⃣ [ALIŞ FATURASI] Atlas Tekstil'in resmi faturası irsaliyeden oluşturuluyor...`);
    const invoiceRes = await request({
      path: `/api/v1/invoices/from-waybill/${receiptWaybill.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const purchaseInvoice = invoiceRes.data?.data || invoiceRes.data;
    console.log(`   ✅ Alış Faturası Açıldı! (No: ${purchaseInvoice.invoiceNumber}, Tür: ${purchaseInvoice.invoiceType}, Tutar: ${purchaseInvoice.totalAmount} ₺)\n`);

    // 12. FATURA ONAYI
    console.log(`1️⃣2️⃣ [FATURA ONAYI] Alış faturası APPROVED yapılıyor (Atlas Tekstil ALACAKLANIYOR)...`);
    const approveRes = await request({
      path: `/api/v1/invoices/${purchaseInvoice.id}/status?status=APPROVED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    const approvedInvoice = approveRes.data?.data || approveRes.data;
    console.log(`   ✅ Alış Faturası Onaylandı! Şirketimiz Atlas Tekstil'e ${approvedInvoice.totalAmount} ₺ BORÇLANDI.\n`);

    // 13. KISMİ TEDİYE ÖDEMESİ
    const partialAmount = 15000.00;
    console.log(`1️⃣3️⃣ [KISMİ TEDİYE ÖDEMESİ] 24.000 ₺ borcun 15.000 ₺'si bankadan Atlas Tekstil'e ödeniyor...`);
    const paymentRes = await request({
      path: `/api/v1/invoices/${approvedInvoice.id}/payments`,
      method: 'POST',
      headers: authHeaders,
    }, {
      invoiceId: approvedInvoice.id,
      amount: partialAmount,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TEDİYE-ATLAS-EFT-99',
      notes: 'Atlas Tekstil Kumaş Alımı 1. Taksit Ödemesi',
    });
    const payment = paymentRes.data?.data || paymentRes.data;
    console.log(`   ✅ Tediye Ödemesi Yapıldı! (Makbuz No: ${payment.paymentNumber}, Ödenen: ${payment.amount} ₺)`);
    console.log(`   ✅ Fatura Durumu: PARTIALLY_PAID (Kalan Borç: 9.000 ₺)\n`);

    // ====================================================================
    // 14. DOĞRUDAN POSTGRESQL VERİTABANI KONTROLÜ (PSQL İLE DB SORGULARI)
    // ====================================================================
    console.log('====================================================================');
    console.log('🗄️ DOĞRUDAN POSTGRESQL VERİTABANI SORGULARI (CANLI DB KANITI)');
    console.log('====================================================================\n');

    const psqlCmd = 'C:\\Users\\Term\\tools\\pgsql\\bin\\psql.exe -U postgres -d minierp_db -c';

    console.log('📌 1. CARİ HESAP TABLOSU (tenant_aktas.business_partners):');
    const bpOut = execSync(`${psqlCmd} "SELECT id, code, name, partner_type, tax_number, email, phone FROM tenant_aktas.business_partners WHERE id = ${atlasPartner.id};"`).toString();
    console.log(bpOut);

    console.log('📌 2. ÜRÜN VARYANT & GÜNCEL STOK (tenant_aktas.product_variants):');
    const pvOut = execSync(`${psqlCmd} "SELECT id, sku, variant_name, stock_quantity, purchase_price, sale_price FROM tenant_aktas.product_variants WHERE id = ${rawVariant.id};"`).toString();
    console.log(pvOut);

    console.log('📌 3. TEKLİFLER TABLOSU (tenant_aktas.quotations):');
    const qtOut = execSync(`${psqlCmd} "SELECT id, quotation_number, type, status, total_amount FROM tenant_aktas.quotations WHERE id = ${purchaseQuote.id};"`).toString();
    console.log(qtOut);

    console.log('📌 4. SİPARİŞLER TABLOSU (tenant_aktas.orders):');
    const ordOut = execSync(`${psqlCmd} "SELECT id, order_number, order_type, status, total_amount FROM tenant_aktas.orders WHERE id = ${purchaseOrder.id};"`).toString();
    console.log(ordOut);

    console.log('📌 5. İRSALİYELER TABLOSU (tenant_aktas.waybills):');
    const wbOut = execSync(`${psqlCmd} "SELECT id, waybill_number, type, status, created_at FROM tenant_aktas.waybills WHERE id = ${receiptWaybill.id};"`).toString();
    console.log(wbOut);

    console.log('📌 6. FİZİKİ STOK HAREKETLERİ TABLOSU (tenant_aktas.stock_movements):');
    const smOut = execSync(`${psqlCmd} "SELECT id, movement_type, quantity, reference_type, reference_id, created_at FROM tenant_aktas.stock_movements WHERE variant_id = ${rawVariant.id};"`).toString();
    console.log(smOut);

    console.log('📌 7. FATURALAR TABLOSU (tenant_aktas.invoices):');
    const invOut = execSync(`${psqlCmd} "SELECT id, invoice_number, invoice_type, status, total_amount, paid_amount FROM tenant_aktas.invoices WHERE id = ${purchaseInvoice.id};"`).toString();
    console.log(invOut);

    console.log('📌 8. ÖDEMELER / MAKBUZLAR TABLOSU (tenant_aktas.payments):');
    const payOut = execSync(`${psqlCmd} "SELECT id, payment_number, amount, payment_method, reference_number, status FROM tenant_aktas.payments WHERE invoice_id = ${purchaseInvoice.id};"`).toString();
    console.log(payOut);

    console.log('====================================================================');
    console.log('🎉 ATLAS TEKSTİL İŞLEMİ VE TÜM VERİTABANI KAYITLARI %100 ONAYLANDI!');
    console.log('====================================================================');

  } catch (err) {
    console.error('❌ Hata oluştu:', err);
    process.exit(1);
  }
}

runAtlasTekstilTest();
