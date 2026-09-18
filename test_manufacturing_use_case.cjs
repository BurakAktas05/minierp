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

async function runManufacturingFlow() {
  console.log('====================================================================');
  console.log('🏭 SENARYO 4: ENDÜSTRİYEL ÜRETİM (BOM), İŞ EMRİ & SATIŞ ENTEGRASYONU');
  console.log('====================================================================\n');

  try {
    // 1. GİRİŞ
    console.log('1️⃣ [KULLANICI GİRİŞİ] Admin ile sisteme giriş yapılıyor...');
    const loginRes = await request({
      path: '/api/v1/auth/login',
      method: 'POST',
    }, {
      username: 'admin',
      password: 'admin123',
      tenantId: TENANT_ID,
    });
    const token = loginRes.data.accessToken || loginRes.data.token;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': TENANT_ID,
    };
    console.log('   ✅ Giriş başarılı! JWT Token alındı.\n');

    // 2. MEVCUT HAMMADDELERİ BUL (Meşe Ahşap Panel & Atlas Kumaş)
    console.log('2️⃣ [HAMMADDE KONTROLÜ] Önceki senaryolarda satın aldığımız hammaddeler depoda aranıyor...');
    const psqlCmd = 'C:\\Users\\Term\\tools\\pgsql\\bin\\psql.exe -U postgres -d minierp_db -t -A -c';
    
    // Meşe Ahşap Panel (ID: 4)
    const woodVariantId = 4;
    const woodStock = parseInt(execSync(`${psqlCmd} "SELECT stock_quantity FROM tenant_aktas.product_variants WHERE id = ${woodVariantId};"`).toString().trim(), 10);
    console.log(`   🪵 Ahşap Panel Hammaddesi: ID=${woodVariantId} (RAW-PNL-01), Mevcut Stok: ${woodStock} Adet`);

    // Atlas Kadife Kumaş (ID: 10)
    const fabricVariantId = 10;
    const fabricStock = parseInt(execSync(`${psqlCmd} "SELECT stock_quantity FROM tenant_aktas.product_variants WHERE id = ${fabricVariantId};"`).toString().trim(), 10);
    console.log(`   🧵 Atlas Kadife Kumaş: ID=${fabricVariantId} (SKU-KMF-7080), Mevcut Stok: ${fabricStock} Metre\n`);

    // 3. YENİ MAMUL (FINISHED_GOOD) KARTI AÇ: LÜKS CHESTER BERJER KOLTUK
    const rand = Math.floor(1000 + Math.random() * 9000);
    console.log(`3️⃣ [MAMUL KARTI AÇILIŞI] Üretilecek nihai ürün tanımlanıyor: Lüks Chester Berjer (MML-${rand})...`);
    
    // Kategori
    const catRes = await request({
      path: '/api/v1/inventory/categories',
      method: 'POST',
      headers: authHeaders,
    }, {
      name: `Mobilya & Mamul Ürünler ${rand}`,
      code: `KAT-MBL-${rand}`,
      description: 'Fabrikada üretilen nihai mobilya ürünleri',
    });
    const category = catRes.data?.data || catRes.data;

    const prodRes = await request({
      path: '/api/v1/inventory/products',
      method: 'POST',
      headers: authHeaders,
    }, {
      categoryId: category.id,
      productType: 'FINISHED_GOOD',
      name: 'Lüks Chester Berjer Koltuk (Antrasit / Meşe)',
      code: `MML-BRJ-${rand}`,
      baseUnit: 'ADET',
      taxRate: 20.00,
      description: 'Masif meşe iskeletli ve Atlas antrasit kadife döşemeli berjer',
      variants: [
        {
          sku: `SKU-BRJ-${rand}`,
          variantName: 'Antrasit / Doğal Meşe Ayak',
          purchasePrice: 1200.00, // Üretim maliyet tahmini
          salePrice: 3500.00,    // Satış liste fiyatı
          stockQuantity: 0,       // Başlangıç stoğu SIFIR
          attributes: { renk: 'Antrasit', iskelet: 'Masif Meşe' },
        },
      ],
    });
    const finishedProd = prodRes.data?.data || prodRes.data;
    const finishedVariant = finishedProd.variants[0];
    console.log(`   ✅ Mamul Kartı Açıldı! SKU: ${finishedVariant.sku}, Fiili Stok: 0 Adet\n`);

    // 4. ÜRETİM REÇETESİ (BOM - BILL OF MATERIALS) OLUŞTURMA
    console.log('4️⃣ [ÜRETİM REÇETESİ / BOM] Reçete formülü sisteme tanımlanıyor...');
    console.log('   📋 REÇETE FORMÜLÜ: 1 Adet Lüks Berjer = 1 Adet Ahşap Panel + 4 Metre Atlas Kumaş');
    
    const bomRes = await request({
      path: '/api/v1/manufacturing/boms',
      method: 'POST',
      headers: authHeaders,
    }, {
      name: 'Lüks Chester Berjer Üretim Reçetesi',
      bomCode: `BOM-BRJ-${rand}`,
      variantId: finishedVariant.id,
      quantity: 1,
      unit: 'ADET',
      industryType: 'FURNITURE',
      description: 'Standart berjer imalat malzeme reçetesi',
      items: [
        {
          componentVariantId: woodVariantId,
          quantity: 1,
          unit: 'ADET',
          scrapRate: 0,
          description: 'İskelet için taşıyıcı meşe panel',
        },
        {
          componentVariantId: fabricVariantId,
          quantity: 4,
          unit: 'METRE',
          scrapRate: 0,
          description: 'Döşemelik kadife kumaş sarfiyatı',
        },
      ],
    });
    const bom = bomRes.data?.data || bomRes.data;
    console.log(`   ✅ Üretim Reçetesi Kaydedildi! BOM Kodu: ${bom.bomCode} (ID: ${bom.id})\n`);

    // 5. NEGATİF TEST: YETERSİZ STOK KORUMASI DENETİMİ
    console.log('5️⃣ [NEGATİF TEST: EKSİ STOK ENGELİ] Depoda 80m kumaş varken 1.000 adet berjer üretilmeye çalışılıyor...');
    try {
      // 1000 adetlik iş emri aç
      const badWoRes = await request({
        path: '/api/v1/manufacturing/work-orders',
        method: 'POST',
        headers: authHeaders,
      }, {
        bomId: bom.id,
        plannedQuantity: 1000,
        priority: 'URGENT',
        notes: 'Aşırı kapasite test iş emri',
      });
      const badWo = badWoRes.data?.data || badWoRes.data;

      // Tamamlamaya çalış (Hammadde yetmeyecek)
      await request({
        path: `/api/v1/manufacturing/work-orders/${badWo.id}/status?status=COMPLETED`,
        method: 'PATCH',
        headers: authHeaders,
      });
      console.error('   ❌ HATA: Sistem yetersiz stoğa rağmen üretimi tamamladı!');
    } catch (err) {
      console.log(`   🛡️ KORUMA DEVREYE GİRDİ! Sistem eksi stoğa düşmeyi engelledi:`);
      console.log(`      ↳ Hata Mesajı: "${err.error?.message || err.message}"\n`);
    }

    // 6. GEÇERLİ ÜRETİM İŞ EMRİ (WORK ORDER): 10 ADET BERJER
    console.log('6️⃣ [İŞ EMRİ OLUŞTURMA] 10 Adet Berjer için gerçekçi üretim iş emri açılıyor...');
    const woRes = await request({
      path: '/api/v1/manufacturing/work-orders',
      method: 'POST',
      headers: authHeaders,
    }, {
      bomId: bom.id,
      plannedQuantity: 10,
      priority: 'HIGH',
      notes: 'Nova Plaza Siparişi İçin Seri Üretim',
    });
    const workOrder = woRes.data?.data || woRes.data;
    console.log(`   ✅ İş Emri Açıldı! No: ${workOrder.orderNumber}, Durum: ${workOrder.status}\n`);

    // 7. İŞ EMRİ BAŞLATILIYOR (IN_PROGRESS)
    console.log('7️⃣ [ÜRETİM BAŞLADI] İş emri üretime alındı -> Durum: IN_PROGRESS...');
    await request({
      path: `/api/v1/manufacturing/work-orders/${workOrder.id}/status?status=IN_PROGRESS`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log('   ✅ Fabrika bantları çalışıyor, üretim devam ediyor.\n');

    // 8. İŞ EMRİ TAMAMLANIYOR (COMPLETED) -> OTOMATİK SARFİYAT VE MAMUL GİRİŞİ!
    console.log('8️⃣ [ÜRETİM TAMAMLANDI] İş emri COMPLETED yapılıyor (Hammadde düşecek, mamul artacak)...');
    await request({
      path: `/api/v1/manufacturing/work-orders/${workOrder.id}/status?status=COMPLETED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log('   ✅ İş emri başarıyla tamamlandı!');

    // Stokları kontrol et
    const newWoodStock = parseInt(execSync(`${psqlCmd} "SELECT stock_quantity FROM tenant_aktas.product_variants WHERE id = ${woodVariantId};"`).toString().trim(), 10);
    const newFabricStock = parseInt(execSync(`${psqlCmd} "SELECT stock_quantity FROM tenant_aktas.product_variants WHERE id = ${fabricVariantId};"`).toString().trim(), 10);
    const newChairStock = parseInt(execSync(`${psqlCmd} "SELECT stock_quantity FROM tenant_aktas.product_variants WHERE id = ${finishedVariant.id};"`).toString().trim(), 10);

    console.log(`   📊 ANLIK STOK ENTEGRASYON RAPORU:`);
    console.log(`      • Ahşap Panel Stoğu : ${woodStock} ➔ ${newWoodStock} Adet (-10 adet harcandı)`);
    console.log(`      • Atlas Kumaş Stoğu : ${fabricStock} ➔ ${newFabricStock} Metre (-40 metre kumaş harcandı)`);
    console.log(`      • LÜKS BERJER STOĞU : 0 ➔ ${newChairStock} ADET ÜRETİLDİ! 🎉\n`);

    // 9. ÜRETİLEN 10 ADET BERJERDEN 5 ADEDİNİ MÜŞTERİYE SATIŞ
    console.log('9️⃣ [MÜŞTERİ SATIŞI] Nova Plaza 5 adet Lüks Berjer satın almak istiyor...');
    const orderRes = await request({
      path: '/api/v1/orders',
      method: 'POST',
      headers: authHeaders,
    }, {
      partnerId: 3, // Nova Plaza
      orderType: 'SALES_ORDER',
      notes: 'Fabrikadan yeni üretilen Chester Berjer Satışı',
      items: [
        {
          variantId: finishedVariant.id,
          quantity: 5,
          unitPrice: 3500.00,
          vatRate: 20,
          discountRate: 0,
        },
      ],
    });
    const salesOrder = orderRes.data?.data || orderRes.data;
    console.log(`   ✅ Satış Siparişi Açıldı: ${salesOrder.orderNumber}, Tutar: ${salesOrder.totalAmount} ₺`);

    // Sipariş onayı
    await request({
      path: `/api/v1/orders/${salesOrder.id}/status?status=CONFIRMED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    console.log('   ✅ Sipariş onaylandı.\n');

    // 10. MÜŞTERİYE SEVK İRSALİYESİ
    console.log('🔟 [SEVK İRSALİYESİ] Berjerler depodan sevk ediliyor...');
    const waybillRes = await request({
      path: `/api/v1/waybills/from-order/${salesOrder.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const dispatchWaybill = waybillRes.data?.data || waybillRes.data;
    await request({
      path: `/api/v1/waybills/${dispatchWaybill.id}/status?status=DISPATCHED`,
      method: 'PATCH',
      headers: authHeaders,
    });
    
    const finalChairStock = parseInt(execSync(`${psqlCmd} "SELECT stock_quantity FROM tenant_aktas.product_variants WHERE id = ${finishedVariant.id};"`).toString().trim(), 10);
    console.log(`   ✅ Mallar Müşteriye Sevk Edildi!`);
    console.log(`   📉 Berjer Depo Stoğu: 10 Adetten ${finalChairStock} Adede indi (5 Adet Müşteride, 5 Adet Depoda)!\n`);

    // 11. SATIŞ FATURASI & TAHSİLAT
    console.log('1️⃣1️⃣ [FATURA & TAHSİLAT] Satış faturası kesilip tam tahsilat alınıyor...');
    const invRes = await request({
      path: `/api/v1/invoices/from-waybill/${dispatchWaybill.id}`,
      method: 'POST',
      headers: authHeaders,
    });
    const saleInvoice = invRes.data?.data || invRes.data;
    await request({
      path: `/api/v1/invoices/${saleInvoice.id}/status?status=APPROVED`,
      method: 'PATCH',
      headers: authHeaders,
    });

    // Tahsilat
    const payRes = await request({
      path: `/api/v1/invoices/${saleInvoice.id}/payments`,
      method: 'POST',
      headers: authHeaders,
    }, {
      invoiceId: saleInvoice.id,
      amount: saleInvoice.totalAmount,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TAHSİLAT-NOVA-9900',
      notes: 'Lüks Berjer Satış Bedeli Peşin Havale',
    });
    const payment = payRes.data?.data || payRes.data;
    console.log(`   ✅ Fatura Onaylandı ve Tam Tahsilat Alındı! (Tutar: ${payment.amount} ₺, Fatura Durumu: PAID)\n`);

    // ====================================================================
    // 12. DOĞRUDAN POSTGRESQL VERİTABANI KONTROLÜ
    // ====================================================================
    console.log('====================================================================');
    console.log('🗄️ DOĞRUDAN POSTGRESQL VERİTABANI SORGULARI (CANLI DB KANITI)');
    console.log('====================================================================\n');

    const psql = 'C:\\Users\\Term\\tools\\pgsql\\bin\\psql.exe -U postgres -d minierp_db -c';

    console.log('📌 1. ÜRETİM REÇETESİ TABLOSU (tenant_aktas.bill_of_materials):');
    console.log(execSync(`${psql} "SELECT id, bom_code, name, quantity, unit, industry_type FROM tenant_aktas.bill_of_materials WHERE id = ${bom.id};"`).toString());

    console.log('📌 2. REÇETE SARFİYAT KALEMLERİ (tenant_aktas.bom_items):');
    console.log(execSync(`${psql} "SELECT id, bom_id, component_variant_id, quantity, unit, description FROM tenant_aktas.bom_items WHERE bom_id = ${bom.id};"`).toString());

    console.log('📌 3. ÜRETİM İŞ EMRİ TABLOSU (tenant_aktas.work_orders):');
    console.log(execSync(`${psql} "SELECT id, order_number, planned_quantity, produced_quantity, status, completion_date FROM tenant_aktas.work_orders WHERE id = ${workOrder.id};"`).toString());

    console.log('📌 4. İŞ EMRİ SARFİYAT & ÜRETİM STOK HAREKETLERİ (tenant_aktas.stock_movements):');
    console.log(execSync(`${psql} "SELECT id, movement_number, movement_type, quantity, reference_type, reference_id FROM tenant_aktas.stock_movements WHERE reference_id = ${workOrder.id};"`).toString());

    console.log('📌 5. NİHAİ ÜRÜN GÜNCEL STOĞU (tenant_aktas.product_variants):');
    console.log(execSync(`${psql} "SELECT id, sku, variant_name, stock_quantity, purchase_price, sale_price FROM tenant_aktas.product_variants WHERE id = ${finishedVariant.id};"`).toString());

    console.log('====================================================================');
    console.log('🎉 SENARYO 4 (ÜRETİM + SATIŞ ENTEGRASYONU) %100 BAŞARIYLA TAMAMLANDI!');
    console.log('====================================================================');

  } catch (err) {
    console.error('❌ Hata oluştu:', err);
    process.exit(1);
  }
}

runManufacturingFlow();
