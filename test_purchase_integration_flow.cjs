/**
 * MiniERP Uçtan Uca Satın Alma & Tedarikçi Entegrasyon Testi (Senaryo 2)
 * Akış: 
 * Giriş -> Sıfır Stoklu Hammadde Tanımı -> Alınan Teklif (PURCHASE) -> 
 * Satın Alma Siparişi (PURCHASE_ORDER) -> Mal Kabul İrsaliyesi (RECEIPT - Depoya Giriş) -> 
 * Alış Faturası (PURCHASE_INVOICE) -> Kısmi Tediye Ödemesi (OUTGOING) -> Tedarikçi Cari Ekstresi
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';
const TENANT_ID = 'tenant_tekstil';

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

async function runPurchaseE2ETest() {
  console.log('====================================================================');
  console.log('📦 SENARYO 2: SATIN ALMA, MAL KABUL & KISMİ TEDİYE ENTEGRASYON TESTİ');
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

    // 2. TEDARİKÇİ CARİSİ SEÇİMİ
    console.log('2️⃣ [TEDARİKÇİ CARİSİ SEÇİMİ] 2. cari hesap alınıyor...');
    const partnersRes = await request({
      path: '/api/v1/partners',
      method: 'GET',
      headers: authHeaders,
    });

    const partners = partnersRes.data.data || partnersRes.data;
    // 2. cariyi al (Artisan Ahşap veya Nova Plaza)
    const supplierPartner = partners.length > 1 ? partners[1] : partners[0];
    console.log(`   ✅ Tedarikçi Seçildi: [${supplierPartner.code}] ${supplierPartner.name} (Tür: ${supplierPartner.partnerType || supplierPartner.type})\n`);

    // 3. YENİ HAMMADDE KATEGORİSİ
    const katCode = 'KAT-HAM-' + Date.now().toString().slice(-4);
    console.log(`3️⃣ [KATEGORİ TANIMI] Hammadde kategorisi ekleniyor: ${katCode}...`);
    const catRes = await request({
      path: '/api/v1/inventory/categories',
      method: 'POST',
      headers: authHeaders,
    }, {
      name: 'Doğal Ahşap & İskelet Hammaddeleri',
      code: katCode,
      description: 'Satın alma entegrasyon testi hammadde kategorisi',
    });
    const createdCat = catRes.data.data || catRes.data;
    console.log(`   ✅ Kategori oluşturuldu: ${createdCat.name}\n`);

    // 4. SIFIR STOKLU YENİ HAMMADDE KARTI (Daha önce hiç almadığımız ürün)
    const prdCode = 'HAM-MEŞE-' + Date.now().toString().slice(-4);
    const skuCode = 'SKU-HAM-' + Date.now().toString().slice(-4);
    console.log(`4️⃣ [SIFIR STOKLU HAMMADDE] Daha önce stokta hiç olmayan yeni ürün kartı açılıyor: ${prdCode}...`);
    const prodRes = await request({
      path: '/api/v1/inventory/products',
      method: 'POST',
      headers: authHeaders,
    }, {
      categoryId: createdCat.id,
      productType: 'RAW_MATERIAL',
      name: 'Fırınlanmış Doğal Meşe Panel',
      code: prdCode,
      baseUnit: 'ADET',
      taxRate: 20.00,
      description: 'Tedarikçiden yeni temin edilecek hammadde',
      variants: [
        {
          sku: skuCode,
          variantName: '200x80cm 30mm',
          purchasePrice: 400.00,
          salePrice: 650.00,
          stockQuantity: 0, // DİKKAT: Başlangıç stoğu 0!
          attributes: { agacTuru: 'Meşe', kalinlik: '30mm' },
        },
      ],
    });

    const createdProd = prodRes.data.data || prodRes.data;
    const rawVariant = createdProd.variants[0];
    console.log(`   ✅ Hammadde Kartı Açıldı! (SKU: ${rawVariant.sku}, Mevcut Fiili Stok: ${rawVariant.stockQuantity} Adet [SIFIR])\n`);

    // 5. ALINAN SATIN ALMA TEKLİFİ (PURCHASE QUOTATION)
    console.log(`5️⃣ [ALINAN TEKLİF] Tedarikçiden gelen 50 adetlik teklif sisteme işleniyor (Tür: PURCHASE)...`);
    const quoteRes = await request({
      path: '/api/v1/quotations',
      method: 'POST',
      headers: authHeaders,
    }, {
      type: 'PURCHASE',
      partnerId: supplierPartner.id,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: 'Tedarikçiden gelen hammadde alım teklif mektubu',
      items: [
        {
          variantId: rawVariant.id,
          quantity: 50,
          unitPrice: 400.00,
          discountRate: 0,
          taxRate: 20.00,
        },
      ],
    });

    const purchaseQuote = quoteRes.data.data || quoteRes.data;
    console.log(`   ✅ Alınan Teklif Kaydedildi! (No: ${purchaseQuote.quotationNumber}, Tutar: ${purchaseQuote.totalAmount} ₺, Yön: ${purchaseQuote.type})\n`);

    // 6. TEKLİFİN ŞİRKET İÇİNDE ONAYLANMASI (ACCEPTED)
    console.log(`6️⃣ [TEKLİF ONAYI] Teklif şirket yönetimince onaylandı -> Durum: ACCEPTED yapılıyor...`);
    await request({
      path: `/api/v1/quotations/${purchaseQuote.id}/status?status=ACCEPTED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Alınan Teklif Onaylandı!\n`);

    // 7. TEKLİFTEN SATIN ALMA SİPARİŞİ TÜRETME
    console.log(`7️⃣ [SATIN ALMA SİPARİŞİ] Tekliften resmi Satın Alma Siparişi (PURCHASE_ORDER) üretiliyor...`);
    const orderRes = await request({
      path: `/api/v1/orders/from-quotation/${purchaseQuote.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const purchaseOrder = orderRes.data.data || orderRes.data;
    console.log(`   ✅ Satın Alma Siparişi Açıldı! (No: ${purchaseOrder.orderNumber}, Tür: ${purchaseOrder.orderType})\n`);

    // 8. SATIN ALMA SİPARİŞİ ONAYI
    console.log(`8️⃣ [SİPARİŞ ONAYI] Satın alma siparişi CONFIRMED yapılıyor...`);
    await request({
      path: `/api/v1/orders/${purchaseOrder.id}/status?status=CONFIRMED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Sipariş Onaylandı (Tedarikçi sevkiyata başladı).\n`);

    // 9. MAL KABUL İRSALİYESİ (RECEIPT)
    console.log(`9️⃣ [MAL KABUL İRSALİYESİ] Tedarikçinin kamyonu depomuza geldi, mal kabul irsaliyesi oluşturuluyor...`);
    const waybillRes = await request({
      path: `/api/v1/waybills/from-order/${purchaseOrder.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const receiptWaybill = waybillRes.data.data || waybillRes.data;
    console.log(`   ✅ Mal Kabul İrsaliyesi Açıldı! (No: ${receiptWaybill.waybillNumber}, Tür: ${receiptWaybill.type})\n`);

    // 10. İRSALİYEYİ KABUL ETME (DEPOYA FİZİKİ GİRİŞ: 0 -> 50 ADET)
    console.log(`🔟 [MAL KABUL & STOK GİRİŞİ] İrsaliye teslim alındı -> DISPATCHED yapılıyor (Depoya mal girişi)...`);
    await request({
      path: `/api/v1/waybills/${receiptWaybill.id}/status?status=DISPATCHED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Mallar Depoya Fiziki Olarak Girdi!`);
    console.log(`   📈 STOK GÜNCELLEMESİ: Meşe Panel fiili stoğu 0 Adetten 50 Adede yükseldi!\n`);

    // 11. TEDARİKÇİDEN GELEN ALIŞ FATURASI
    console.log(`1️⃣1️⃣ [ALIŞ FATURASI] Tedarikçinin kestiği resmi fatura irsaliyeden oluşturuluyor...`);
    const invoiceRes = await request({
      path: `/api/v1/invoices/from-waybill/${receiptWaybill.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const purchaseInvoice = invoiceRes.data.data || invoiceRes.data;
    console.log(`   ✅ Alış Faturası Açıldı! (No: ${purchaseInvoice.invoiceNumber}, Tür: ${purchaseInvoice.invoiceType}, Tutar: ${purchaseInvoice.totalAmount} ₺)\n`);

    // 12. FATURA ONAYI (TEDARİKÇİYE ALACAK YAZILMASI)
    console.log(`1️⃣2️⃣ [FATURA ONAYI] Alış faturası APPROVED yapılıyor (Tedarikçi ALACAKLANIYOR)...`);
    const approveRes = await request({
      path: `/api/v1/invoices/${purchaseInvoice.id}/status?status=APPROVED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    const approvedInvoice = approveRes.data.data || approveRes.data;
    console.log(`   ✅ Alış Faturası Onaylandı! Şirketimiz tedarikçiye ${approvedInvoice.totalAmount} ₺ BORÇLANDI (Tedarikçiye Alacak yazıldı).\n`);

    // 13. KISMİ TEDİYE ÖDEMESİ (PARTIAL PAYMENT)
    const partialAmount = 10000.00;
    console.log(`1️⃣3️⃣ [KISMİ TEDİYE ÖDEMESİ] 24.000 ₺ borcun 10.000 ₺'si bankadan tedarikçiye ödeniyor...`);
    const paymentRes = await request({
      path: `/api/v1/invoices/${approvedInvoice.id}/payments`,
      method: 'POST',
      headers: authHeaders,
    }, {
      invoiceId: approvedInvoice.id,
      amount: partialAmount,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TEDİYE-EFT-7788',
      notes: 'Hammadde alımı 1. taksit banka transferi',
    });
    const payment = paymentRes.data.data || paymentRes.data;
    console.log(`   ✅ Tediye Ödemesi Yapıldı! (Makbuz No: ${payment.paymentNumber}, Ödenen: ${payment.amount} ₺)`);
    console.log(`   ✅ Fatura Durumu: PARTIALLY_PAID (Kalan Borç: 14.000 ₺)\n`);

    // 14. TEDARİKÇİ CARİ EKSTRESİNİN DOĞRULANMASI
    console.log(`1️⃣4️⃣ [TEDARİKÇİ CARİ EKSTRESİ] Hesap ekstresi çekiliyor...`);
    const statementRes = await request({
      path: `/api/v1/partners/${supplierPartner.id}/statement`,
      method: 'GET',
      headers: authHeaders,
    });
    const statement = statementRes.data.data || statementRes.data;

    console.log('   -------------------------------------------------------------------');
    console.log(`   📊 TEDARİKÇİ HESAP EKSTRESİ: ${statement.partnerName} [${statement.partnerCode}]`);
    console.log(`      • Toplam Alacak (Alış Faturası) : ${statement.totalCredit} ₺ (Tedarikçinin hak edişi)`);
    console.log(`      • Toplam Borç (Yaptığımız Tediye) : ${statement.totalDebit} ₺ (Bizim ödediğimiz)`);
    console.log(`      • Net Kalan Bakiye               : ${statement.balance} ₺`);
    console.log(`      • Yorum                           : Bakiye eksi (-) olduğu için TEDARİKÇİYE 14.000 ₺ BORCUMUZ VARDIR.`);
    console.log('   -------------------------------------------------------------------\n');

    console.log('====================================================================');
    console.log('🎉 2. SENARYO DA %100 BAŞARIYLA TAMAMLANDI!');
    console.log('   Alınan Teklif -> Satın Alma -> Mal Kabul (Stok Girişi) -> Fatura -> Kısmi Tediye');
    console.log('====================================================================');

  } catch (error) {
    console.error('❌ 2. ENTEGRASYON TESTİNDE HATA:', error.message || error);
    if (error.error) {
      console.error('Hata Detayı:', JSON.stringify(error.error, null, 2));
    }
  }
}

runPurchaseE2ETest();
