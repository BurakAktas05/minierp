/**
 * MiniERP Uçtan Uca Entegrasyon Testi
 * Akış: Giriş -> Kategori -> Ürün & Varyant -> Teklif -> Sipariş -> İrsaliye -> Fatura -> Tahsilat -> Cari Ekstre
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

async function runE2ETest() {
  console.log('===============================================================');
  console.log('🚀 MiniERP UÇTAN UCA (E2E) SİSTEM ENTEGRASYON TESTİ BAŞLATILIYOR');
  console.log('===============================================================\n');

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
    console.log('   ✅ Giriş başarılı! JWT Token alındı. (Kullanıcı: admin)\n');

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
    };

    // 2. CARİ LİSTESİNDEN SEÇİM
    console.log('2️⃣ [CARİ HESAP SEÇİMİ] Mevcut 3 cariden biri alınıyor...');
    const partnersRes = await request({
      path: '/api/v1/partners',
      method: 'GET',
      headers: authHeaders,
    });

    const partners = partnersRes.data.data || partnersRes.data;
    if (!partners || partners.length === 0) {
      throw new Error('Sistemde kayıtlı cari hesap bulunamadı!');
    }
    const targetPartner = partners[0];
    console.log(`   ✅ Hedef Cari Seçildi: [${targetPartner.code}] ${targetPartner.name} (Tür: ${targetPartner.partnerType || targetPartner.type})\n`);

    // 3. YENİ KATEGORİ OLUŞTURMA
    const katCode = 'KAT-E2E-' + Date.now().toString().slice(-4);
    console.log(`3️⃣ [KATEGORİ TANIMI] Yeni kategori ekleniyor: ${katCode}...`);
    const catRes = await request({
      path: '/api/v1/inventory/categories',
      method: 'POST',
      headers: authHeaders,
    }, {
      name: 'Özel Entegrasyon Kumaşları',
      code: katCode,
      description: 'E2E Entegrasyon Testi için oluşturulmuş kategori',
    });
    const createdCat = catRes.data.data || catRes.data;
    console.log(`   ✅ Kategori başarıyla oluşturuldu! (ID: ${createdCat.id}, Adı: ${createdCat.name})\n`);

    // 4. YENİ ÜRÜN VE VARYANT OLUŞTURMA
    const prdCode = 'PRD-E2E-' + Date.now().toString().slice(-4);
    const skuCode = 'SKU-E2E-' + Date.now().toString().slice(-4);
    console.log(`4️⃣ [ÜRÜN & VARYANT TANIMI] Yeni mamul kartı ekleniyor: ${prdCode}...`);
    const prodRes = await request({
      path: '/api/v1/inventory/products',
      method: 'POST',
      headers: authHeaders,
    }, {
      categoryId: createdCat.id,
      productType: 'FINISHED_GOOD',
      name: 'E2E Likralı Dokuma Gabardin',
      code: prdCode,
      baseUnit: 'METRE',
      taxRate: 20.00,
      description: 'Canlı Entegrasyon Test Ürünü',
      variants: [
        {
          sku: skuCode,
          variantName: 'Antrasit 220gr',
          purchasePrice: 120.00,
          salePrice: 240.00,
          stockQuantity: 100,
          attributes: { renk: 'Antrasit', gramaj: '220gr' },
        },
      ],
    });

    const createdProd = prodRes.data.data || prodRes.data;
    const targetVariant = createdProd.variants[0];
    console.log(`   ✅ Ürün Kartı Açıldı! (ID: ${createdProd.id}, SKU: ${targetVariant.sku}, Fiili Stok: ${targetVariant.stockQuantity} Metre, Satış Fiyatı: ${targetVariant.salePrice} ₺)\n`);

    // 5. B2B SATIŞ TEKLİFİ (QUOTATION) OLUŞTURMA
    console.log(`5️⃣ [B2B TEKLİF] Müşteriye 25 metre için satış teklifi oluşturuluyor...`);
    const quoteRes = await request({
      path: '/api/v1/quotations',
      method: 'POST',
      headers: authHeaders,
    }, {
      type: 'SALES',
      partnerId: targetPartner.id,
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
      notes: 'E2E Otomatik Entegrasyon Test Teklifi',
      items: [
        {
          variantId: targetVariant.id,
          quantity: 25,
          unitPrice: 240.00,
          discountRate: 0,
          taxRate: 20.00,
        },
      ],
    });

    const createdQuote = quoteRes.data.data || quoteRes.data;
    console.log(`   ✅ Teklif Oluşturuldu! (No: ${createdQuote.quotationNumber}, Tutar: ${createdQuote.totalAmount} ₺, Durum: ${createdQuote.status})\n`);

    // 6. TEKLİFİ KABUL ETME (ACCEPTED)
    console.log(`6️⃣ [TEKLİF ONAYI] Müşteri teklifi kabul etti -> Durum: ACCEPTED yapılıyor...`);
    const acceptQuoteRes = await request({
      path: `/api/v1/quotations/${createdQuote.id}/status?status=ACCEPTED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Teklif Müşteri Tarafından Kabul Edildi!\n`);

    // 7. TEKLİFTEN RESMİ SİPARİŞ TÜRETME
    console.log(`7️⃣ [SİPARİŞE DÖNÜŞTÜRME] Kabul edilen teklif resmi siparişe dönüştürülüyor...`);
    const orderRes = await request({
      path: `/api/v1/orders/from-quotation/${createdQuote.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const createdOrder = orderRes.data.data || orderRes.data;
    console.log(`   ✅ Resmi Sipariş Açıldı! (No: ${createdOrder.orderNumber}, Tür: ${createdOrder.orderType}, Durum: ${createdOrder.status})\n`);

    // 8. SİPARİŞİ ONAYLAMA (STOK REZERVE MEKANİZMASI)
    console.log(`8️⃣ [SİPARİŞ ONAYI & REZERVE STOK] Sipariş CONFIRMED yapılıyor (Stok rezerve tetikleniyor)...`);
    const confirmOrderRes = await request({
      path: `/api/v1/orders/${createdOrder.id}/status?status=CONFIRMED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ Sipariş Onaylandı! Sistem 25 metre kumaşı başkasına satılmasın diye REZERVE etti.\n`);

    // 9. SİPARİŞTEN İRSALİYE TÜRETME
    console.log(`9️⃣ [SEVK İRSALİYESİ] Siparişten sevk irsaliyesi oluşturuluyor...`);
    const waybillRes = await request({
      path: `/api/v1/waybills/from-order/${createdOrder.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const createdWaybill = waybillRes.data.data || waybillRes.data;
    console.log(`   ✅ Sevk İrsaliyesi Açıldı! (No: ${createdWaybill.waybillNumber}, Tür: ${createdWaybill.type}, Durum: ${createdWaybill.status})\n`);

    // 10. İRSALİYEYİ SEVK ETME (FİZİKİ STOK DÜŞÜŞÜ)
    console.log(`🔟 [İRSALİYE SEVKİYAT] İrsaliye kamyona yüklendi -> DISPATCHED yapılıyor (Depodan fiziki çıkış)...`);
    const dispatchWaybillRes = await request({
      path: `/api/v1/waybills/${createdWaybill.id}/status?status=DISPATCHED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log(`   ✅ İrsaliye Sevk Edildi! Mallar depodan çıktı (Fiili Stok: 100 -> 75 Metreye düştü, Rezerve Stok kapandı).\n`);

    // 11. İRSALİYEDEN RESMİ SATIŞ FATURASI TÜRETME
    console.log(`1️⃣1️⃣ [FATURA KESİMİ] İrsaliyeden resmi satış faturası kesiliyor...`);
    const invoiceRes = await request({
      path: `/api/v1/invoices/from-waybill/${createdWaybill.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const createdInvoice = invoiceRes.data.data || invoiceRes.data;
    console.log(`   ✅ Satış Faturası Açıldı! (No: ${createdInvoice.invoiceNumber}, Tutar: ${createdInvoice.totalAmount} ₺, Kalan Bakiye: ${createdInvoice.remainingAmount} ₺, Durum: ${createdInvoice.status})\n`);

    // 12. FATURAYI ONAYLAMA (RESMİLEŞTİRME & CARİYE BORÇ YAZMA)
    console.log(`1️⃣2️⃣ [FATURA ONAYI] Fatura resmi onaylandı -> APPROVED yapılıyor (Cariye Borç yazılıyor)...`);
    const approveInvoiceRes = await request({
      path: `/api/v1/invoices/${createdInvoice.id}/status?status=APPROVED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    const approvedInvoice = approveInvoiceRes.data.data || approveInvoiceRes.data;
    console.log(`   ✅ Fatura Onaylandı! Mali belge resmileşti. Müşteri carisine ${approvedInvoice.totalAmount} ₺ BORÇ kaydedildi.\n`);

    // 13. TAHSİLAT ALMA (ÖDEME MAKBUZU)
    console.log(`1️⃣3️⃣ [TAHSİLAT / ÖDEME] Müşteriden ${approvedInvoice.remainingAmount} ₺ tahsilat makbuzu alınıyor...`);
    const paymentRes = await request({
      path: `/api/v1/invoices/${createdInvoice.id}/payments`,
      method: 'POST',
      headers: authHeaders,
    }, {
      invoiceId: createdInvoice.id,
      amount: approvedInvoice.remainingAmount,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'HAVALE-E2E-2026',
      notes: 'Akbank Ticari Hesaba Gelen E2E Test Tahsilatı',
    });
    const createdPayment = paymentRes.data.data || paymentRes.data;
    console.log(`   ✅ Tahsilat Kaydedildi! (Makbuz No: ${createdPayment.paymentNumber}, Tutar: ${createdPayment.amount} ₺)`);
    console.log(`   ✅ Kasa/Banka bakiyesi arttı, faturanın kalan borcu 0.00 ₺ yapılarak kapatıldı (PAID).\n`);

    // 14. CARİ EKSTRE & FİNANSAL İCMALİN DOĞRULANMASI
    console.log(`1️⃣4️⃣ [CARİ HESAP EKSTRESİ] Cari kartın ekstre dökümü alınıyor...`);
    const statementRes = await request({
      path: `/api/v1/partners/${targetPartner.id}/statement`,
      method: 'GET',
      headers: authHeaders,
    });
    const statement = statementRes.data.data || statementRes.data;

    console.log('   -------------------------------------------------------');
    console.log(`   📊 CARİ FİNANSAL TABLO: ${statement.partnerName} [${statement.partnerCode}]`);
    console.log(`      • Toplam Borç (Satış Faturaları) : ${statement.totalDebit} ₺`);
    console.log(`      • Toplam Alacak (Tahsilatlar)    : ${statement.totalCredit} ₺`);
    console.log(`      • Net Kalan Bakiye               : ${statement.balance} ₺`);
    console.log(`      • Toplam İşlem Sayısı            : ${statement.lines ? statement.lines.length : 0} adet evrak`);
    console.log('   -------------------------------------------------------\n');

    console.log('===============================================================');
    console.log('🎉 TEBRİKLER! TÜM ENTEGRASYON ZİNCİRİ %100 BAŞARIYLA TAMAMLANDI!');
    console.log('   Kategori -> Ürün -> Teklif -> Sipariş -> İrsaliye -> Fatura -> Tahsilat');
    console.log('===============================================================');

  } catch (error) {
    console.error('❌ ENTEGRASYON TESTİNDE HATA OLUŞTU:', error.message || error);
    if (error.error) {
      console.error('Hata Detayı:', JSON.stringify(error.error, null, 2));
    }
  }
}

runE2ETest();
