import {
  Product,
  Category,
  BusinessPartner,
  Quotation,
  Order,
  Waybill,
  AuditLog,
  Tenant
} from '../types';

export const mockTenants: Tenant[] = [
  {
    id: 'tenant_tekstil',
    name: 'Atlas Tekstil & Dokuma Sanayi A.Ş.',
    schemaName: 'tenant_tekstil',
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'tenant_moda',
    name: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
    schemaName: 'tenant_moda',
    active: true,
    createdAt: '2026-02-15T14:30:00Z',
  },
  {
    id: 'tenant_perakende',
    name: 'Trendline Mağazacılık & E-Ticaret A.Ş.',
    schemaName: 'tenant_perakende',
    active: true,
    createdAt: '2026-03-01T09:00:00Z',
  },
];

export interface TenantDataBundle {
  categories: Category[];
  products: Product[];
  partners: BusinessPartner[];
  quotations: Quotation[];
  orders: Order[];
  waybills: Waybill[];
  auditLogs: AuditLog[];
}

export const tenantMockDataMap: Record<string, TenantDataBundle> = {
  // =========================================================================
  // 1. KİRACI: ATLAS TEKSTİL & DOKUMA SANAYİ A.Ş. (Kumaş & İplik Üreticisi)
  // =========================================================================
  tenant_tekstil: {
    categories: [
      { id: 1, code: 'KAT-HAM', name: 'Ham Elyaf & İplik', description: 'Lif pamuk ve endüstriyel bobin iplik' },
      { id: 2, code: 'KAT-DOKUMA', name: 'Dokuma Kumaş Topları', description: 'Gömleklik ve pantolonluk dokuma kumaş topları' },
      { id: 3, code: 'KAT-ORME', name: 'Örme & Penye Kumaşlar', description: 'Tişört ve üst giyim için süprem penye topları' },
    ],
    products: [
      {
        id: 1,
        code: 'PRD-KMS-01',
        name: 'Saf Pamuk Oxford Dokuma Kumaş Topu',
        description: 'İnce numara penye iplikten dokunmuş nefes alan gömleklik kumaş topu (50m).',
        basePrice: 4500.0,
        categoryId: 2,
        categoryName: 'Dokuma Kumaş Topları',
        active: true,
        attributes: {
          iplikNo: '30/1 Penye',
          en: '150 cm',
          gramaj: '145 GSM',
          kullanimAlani: 'Premium Gömlek İmalatı',
        },
        variants: [
          { id: 101, sku: 'OXF-TOP-BLU', barcode: '868000100101', size: '50m Top', color: 'Açık Mavi', stockQuantity: 150, reservedStock: 30, availableStock: 120, priceAdjustment: 0 },
          { id: 102, sku: 'OXF-TOP-WHT', barcode: '868000100102', size: '50m Top', color: 'Optik Beyaz', stockQuantity: 120, reservedStock: 0, availableStock: 120, priceAdjustment: 0 },
          { id: 103, sku: 'OXF-TOP-STR', barcode: '868000100103', size: '50m Top', color: 'Çizgili Mavi', stockQuantity: 80, reservedStock: 15, availableStock: 65, priceAdjustment: 250 },
        ],
      },
      {
        id: 2,
        code: 'PRD-KMS-02',
        name: 'Likralı Ağır Denim / Kot Kumaşı',
        description: 'Dayanıklı ve esnek pantolonluk denim kumaş rulosu (100m).',
        basePrice: 8200.0,
        categoryId: 2,
        categoryName: 'Dokuma Kumaş Topları',
        active: true,
        attributes: {
          kumasTipi: '%98 Pamuk, %2 Elastan',
          gramaj: '12.5 Oz',
          dokuma: '3/1 Sağ Dimi',
        },
        variants: [
          { id: 201, sku: 'JEA-TOP-IND', barcode: '868000100201', size: '100m Rulo', color: 'İndigo Mavi', stockQuantity: 110, reservedStock: 25, availableStock: 85, priceAdjustment: 0 },
          { id: 202, sku: 'JEA-TOP-BLK', barcode: '868000100202', size: '100m Rulo', color: 'Koyu Siyah', stockQuantity: 60, reservedStock: 0, availableStock: 60, priceAdjustment: 300 },
        ],
      },
      {
        id: 3,
        code: 'PRD-KMS-03',
        name: '240 GSM Süprem Penye Örme Kumaş',
        description: 'Ağır gramajlı tişört ve üst giyim imalatı için 30kg penye rulosu.',
        basePrice: 3800.0,
        categoryId: 3,
        categoryName: 'Örme & Penye Kumaşlar',
        active: true,
        attributes: {
          iplik: '%100 Taranmış Penye Pamuk',
          en: '180 cm Açık En',
          gramaj: '240 GSM',
        },
        variants: [
          { id: 301, sku: 'SUP-TOP-BLK', barcode: '868000100301', size: '30kg Top', color: 'Mat Siyah', stockQuantity: 200, reservedStock: 50, availableStock: 150, priceAdjustment: 0 },
          { id: 302, sku: 'SUP-TOP-WHT', barcode: '868000100302', size: '30kg Top', color: 'Kar Beyaz', stockQuantity: 180, reservedStock: 0, availableStock: 180, priceAdjustment: 0 },
        ],
      },
    ],
    partners: [
      {
        id: 1,
        code: 'CAR-M01',
        title: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        taxNumber: '3210459821',
        taxOffice: 'Konak VD',
        type: 'CUSTOMER',
        email: 'tedarik@voguegiyim.com.tr',
        phone: '+90 232 444 88 00',
        address: 'Organize Sanayi Bölgesi 2. Cadde No:14 İzmir',
        active: true,
        metadata: { iliskiliKiraci: 'tenant_moda', aciklama: 'Ana hazır giyim müşterimiz, kumaşlarımızı işliyor.', krediLimiti: 1500000 },
      },
      {
        id: 2,
        code: 'CAR-M02',
        title: 'Anadolu Konfeksiyon San. A.Ş.',
        taxNumber: '7890123456',
        taxOffice: 'Osmangazi VD',
        type: 'CUSTOMER',
        email: 'siparis@anadolukonfeksiyon.com',
        phone: '+90 224 211 40 00',
        address: 'Demirtaş OSB Çiğdem Sok. No:5 Bursa',
        active: true,
        metadata: { vade: '30 Gün' },
      },
      {
        id: 3,
        code: 'CAR-T01',
        title: 'Çukurova Pamuk & Elyaf Kooperatifi',
        taxNumber: '4820193847',
        taxOffice: 'Seyhan VD',
        type: 'SUPPLIER',
        email: 'satis@cukurovapamuk.org.tr',
        phone: '+90 322 355 40 00',
        address: 'D-400 Karayolu Üzeri 12. Km Yüreğir, Adana',
        active: true,
        metadata: { hammadde: 'Ham Lif Pamuk', vade: 'Peşin' },
      },
      {
        id: 4,
        code: 'CAR-L01',
        title: 'Marmara Lojistik & Konteyner Taşımacılık',
        taxNumber: '6129840291',
        taxOffice: 'Büyük Mükellefler VD',
        type: 'BOTH',
        email: 'operasyon@marmaralojistik.com',
        phone: '+90 212 680 90 00',
        address: 'İkitelli OSB Demirciler Sitesi B Blok No:22 İstanbul',
        active: true,
      },
    ],
    quotations: [
      {
        id: 1,
        quotationNumber: 'QT-2026-TEK-001',
        partnerId: 1,
        partnerTitle: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        type: 'SALES',
        status: 'ACCEPTED',
        issueDate: '2026-03-10T10:00:00Z',
        validUntil: '2026-03-25T18:00:00Z',
        totalAmount: 247500.0,
        notes: '2026 İlkbahar/Yaz koleksiyonu gömleklik ve kotluk kumaş tedarik anlaşması.',
        items: [
          { id: 1, variantId: 101, variantSku: 'OXF-TOP-BLU', productName: 'Oxford Mavi Kumaş Topu (50m)', quantity: 30, unitPrice: 4500.0, taxRate: 10, lineTotal: 148500.0 },
          { id: 2, variantId: 201, variantSku: 'JEA-TOP-IND', productName: 'Denim İndigo Kumaş Rulosu (100m)', quantity: 12, unitPrice: 8200.0, taxRate: 10, lineTotal: 108240.0 },
        ],
      },
      {
        id: 2,
        quotationNumber: 'QT-2026-TEK-002',
        partnerId: 3,
        partnerTitle: 'Çukurova Pamuk & Elyaf Kooperatifi',
        type: 'PURCHASE',
        status: 'SENT',
        issueDate: '2026-03-14T11:30:00Z',
        validUntil: '2026-03-30T18:00:00Z',
        totalAmount: 320000.0,
        notes: 'Yeni mahsul ekstra uzun lifli pamuk balyası alım teklifi.',
        items: [
          { id: 3, variantId: 101, variantSku: 'OXF-TOP-BLU', productName: 'Ham Lif Pamuk Balya Partisi', quantity: 10, unitPrice: 32000.0, taxRate: 0, lineTotal: 320000.0 },
        ],
      },
    ],
    orders: [
      {
        id: 1,
        orderNumber: 'SIP-SAT-2026-TEK-001',
        quotationId: 1,
        partnerId: 1,
        partnerTitle: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        type: 'SALES_ORDER',
        status: 'CONFIRMED',
        orderDate: '2026-03-12T14:20:00Z',
        totalAmount: 247500.0,
        notes: 'QT-2026-TEK-001 nolu tekliften onaylandı. Stoklar rezerve edildi, sevkiyat hazır.',
        items: [
          { id: 1, variantId: 101, variantSku: 'OXF-TOP-BLU', productName: 'Oxford Mavi Kumaş Topu (50m)', quantity: 30, unitPrice: 4500.0, taxRate: 10, lineTotal: 148500.0 },
        ],
      },
    ],
    waybills: [
      {
        id: 1,
        waybillNumber: 'IRS-SVK-2026-TEK-001',
        orderId: 1,
        orderNumber: 'SIP-SAT-2026-TEK-001',
        partnerId: 1,
        partnerTitle: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        type: 'DISPATCH',
        status: 'DISPATCHED',
        waybillDate: '2026-03-13T09:15:00Z',
        carrierInfo: 'Aras Kargo Kurumsal Lojistik / 34 ER 1928',
        trackingNumber: 'ARK-89217364',
        notes: '30 Top Oxford Açık Mavi Kumaş sevk edildi. Hasarsız teslim edilmelidir.',
        items: [
          { id: 1, orderItemId: 1, variantId: 101, variantSku: 'OXF-TOP-BLU', productName: 'Oxford Mavi Kumaş Topu (50m)', quantity: 30 },
        ],
      },
    ],
    auditLogs: [
      {
        id: 1,
        username: 'admin',
        action: 'ORDER_CONFIRMED',
        entityType: 'Order',
        entityId: 1,
        oldValue: 'DRAFT',
        newValue: 'CONFIRMED',
        details: { orderNumber: 'SIP-SAT-2026-TEK-001', partner: 'Vogue Hazır Giyim Ltd.', rezerveAdet: 30 },
        ipAddress: '192.168.1.10',
        timestamp: '2026-03-12T14:20:00Z',
      },
      {
        id: 2,
        username: 'manager',
        action: 'WAYBILL_DISPATCHED',
        entityType: 'Waybill',
        entityId: 1,
        oldValue: 'DRAFT',
        newValue: 'DISPATCHED',
        details: { waybillNumber: 'IRS-SVK-2026-TEK-001', event: 'STOCK_FULFILLED_EVENT_SENT' },
        ipAddress: '192.168.1.22',
        timestamp: '2026-03-13T09:15:00Z',
      },
    ],
  },

  // =========================================================================
  // 2. KİRACI: VOGUE HAZIR GİYİM & KONFEKSİYON LTD. (Giyim İmalatçısı)
  // =========================================================================
  tenant_moda: {
    categories: [
      { id: 1, code: 'KAT-UST', name: 'Üst Giyim Koleksiyonu', description: 'Erkek ve Kadın gömlek & penye tişört' },
      { id: 2, code: 'KAT-ALT', name: 'Alt Giyim & Denim', description: 'Likralı kot ve gabardin pantolon' },
      { id: 3, code: 'KAT-DIS', name: 'Ceket & Dış Giyim', description: 'Mevsimlik mont ve ceket' },
    ],
    products: [
      {
        id: 10,
        code: 'PRD-GMK-01',
        name: 'Klasik Oxford Slim Fit Erkek Gömlek',
        description: 'Atlas Tekstil 100% pamuklu Oxford kumaşından özenle dikilmiş B2B toptan gömlek.',
        basePrice: 480.0,
        categoryId: 1,
        categoryName: 'Üst Giyim Koleksiyonu',
        active: true,
        attributes: {
          kumasMensei: 'Atlas Tekstil A.Ş.',
          kesim: 'Slim Fit',
          yaka: 'İtalyan Düğmeli',
          sezon: '2026 İlkbahar/Yaz',
        },
        variants: [
          { id: 1101, sku: 'OXF-BLU-S', barcode: '868000200101', size: 'S', color: 'Açık Mavi', stockQuantity: 120, reservedStock: 25, availableStock: 95, priceAdjustment: 0 },
          { id: 1102, sku: 'OXF-BLU-M', barcode: '868000200102', size: 'M', color: 'Açık Mavi', stockQuantity: 240, reservedStock: 60, availableStock: 180, priceAdjustment: 0 },
          { id: 1103, sku: 'OXF-BLU-L', barcode: '868000200103', size: 'L', color: 'Açık Mavi', stockQuantity: 160, reservedStock: 40, availableStock: 120, priceAdjustment: 0 },
          { id: 1104, sku: 'OXF-WHT-M', barcode: '868000200104', size: 'M', color: 'Optik Beyaz', stockQuantity: 190, reservedStock: 0, availableStock: 190, priceAdjustment: 0 },
        ],
      },
      {
        id: 11,
        code: 'PRD-PNT-01',
        name: 'Slim Fit Likralı Jean Pantolon',
        description: 'Atlas Tekstil esnek denim kumaşıyla taşlanmış modern kesim jean pantolon.',
        basePrice: 680.0,
        categoryId: 2,
        categoryName: 'Alt Giyim & Denim',
        active: true,
        attributes: {
          kumasTipi: 'Atlas 12.5 Oz Likralı Denim',
          yikama: 'Orta İndigo Taşlama',
          paça: 'Dar Paça',
        },
        variants: [
          { id: 1201, sku: 'JEA-IND-30', barcode: '868000200201', size: '30/32', color: 'İndigo', stockQuantity: 90, reservedStock: 20, availableStock: 70, priceAdjustment: 0 },
          { id: 1202, sku: 'JEA-IND-32', barcode: '868000200202', size: '32/32', color: 'İndigo', stockQuantity: 180, reservedStock: 50, availableStock: 130, priceAdjustment: 0 },
          { id: 1203, sku: 'JEA-BLK-32', barcode: '868000200203', size: '32/32', color: 'Siyah', stockQuantity: 75, reservedStock: 15, availableStock: 60, priceAdjustment: 40 },
        ],
      },
      {
        id: 12,
        code: 'PRD-TSH-01',
        name: 'Heavyweight 240 GSM Penye Tişört',
        description: 'Atlas Tekstil süprem kumaşından üretilmiş tok dökümlü premium tişört.',
        basePrice: 290.0,
        categoryId: 1,
        categoryName: 'Üst Giyim Koleksiyonu',
        active: true,
        attributes: {
          gramaj: '240 GSM',
          kumas: 'Atlas %100 Penye Pamuk',
        },
        variants: [
          { id: 1301, sku: 'TSH-BLK-M', barcode: '868000200301', size: 'M', color: 'Mat Siyah', stockQuantity: 320, reservedStock: 80, availableStock: 240, priceAdjustment: 0 },
          { id: 1302, sku: 'TSH-BLK-L', barcode: '868000200302', size: 'L', color: 'Mat Siyah', stockQuantity: 260, reservedStock: 50, availableStock: 210, priceAdjustment: 0 },
        ],
      },
    ],
    partners: [
      {
        id: 10,
        code: 'CAR-T01',
        title: 'Atlas Tekstil & Dokuma Sanayi A.Ş.',
        taxNumber: '9876543210',
        taxOffice: 'Bursa Nilüfer VD',
        type: 'SUPPLIER',
        email: 'siparis@atlastekstil.com.tr',
        phone: '+90 224 441 50 00',
        address: 'Demirtaş Organize Sanayi Bölgesi Gül Cad. No:18 Bursa',
        active: true,
        metadata: { iliskiliKiraci: 'tenant_tekstil', anaKumasTedarikcisi: true },
      },
      {
        id: 11,
        code: 'CAR-M01',
        title: 'Trendline Mağazacılık & E-Ticaret A.Ş.',
        taxNumber: '6129840291',
        taxOffice: 'İkitelli VD',
        type: 'CUSTOMER',
        email: 'satin_alma@trendline.com.tr',
        phone: '+90 212 659 70 00',
        address: 'İkitelli OSB Aykosan Sanayi Sitesi 4. Blok No:12 İstanbul',
        active: true,
        metadata: { iliskiliKiraci: 'tenant_perakende', magazaSayisi: 38, krediLimiti: 2000000 },
      },
      {
        id: 12,
        code: 'CAR-M02',
        title: 'Boyner & YKM Büyük Mağazacılık A.Ş.',
        taxNumber: '1122334455',
        taxOffice: 'Büyük Mükellefler VD',
        type: 'CUSTOMER',
        email: 'toptan@boyner.com.tr',
        phone: '+90 212 335 75 00',
        address: 'Ayazağa Mah. Kemerburgaz Cad. No:7 Sarıyer, İstanbul',
        active: true,
      },
    ],
    quotations: [
      {
        id: 10,
        quotationNumber: 'QT-2026-VOG-001',
        partnerId: 11,
        partnerTitle: 'Trendline Mağazacılık & E-Ticaret A.Ş.',
        type: 'SALES',
        status: 'ACCEPTED',
        issueDate: '2026-03-11T11:00:00Z',
        validUntil: '2026-03-28T18:00:00Z',
        totalAmount: 79200.0,
        notes: 'Trendline AVM mağazaları vitrin koleksiyonu toptan satış teklifi.',
        items: [
          { id: 10, variantId: 1102, variantSku: 'OXF-BLU-M', productName: 'Oxford Gömlek (M / Açık Mavi)', quantity: 100, unitPrice: 480.0, taxRate: 10, lineTotal: 52800.0 },
          { id: 11, variantId: 1202, variantSku: 'JEA-IND-32', productName: 'Slim Fit Jean (32/32 / İndigo)', quantity: 50, unitPrice: 680.0, taxRate: 10, lineTotal: 37400.0 },
        ],
      },
      {
        id: 11,
        quotationNumber: 'QT-2026-VOG-002',
        partnerId: 10,
        partnerTitle: 'Atlas Tekstil & Dokuma Sanayi A.Ş.',
        type: 'PURCHASE',
        status: 'ACCEPTED',
        issueDate: '2026-03-09T09:30:00Z',
        validUntil: '2026-03-24T18:00:00Z',
        totalAmount: 247500.0,
        notes: 'Atlas Tekstil kumaş satınalma talebimiz.',
        items: [
          { id: 12, variantId: 1102, variantSku: 'OXF-TOP-BLU', productName: 'Saf Pamuk Oxford Kumaş Topu (50m)', quantity: 30, unitPrice: 4500.0, taxRate: 10, lineTotal: 148500.0 },
        ],
      },
    ],
    orders: [
      {
        id: 10,
        orderNumber: 'SIP-SAT-2026-VOG-001',
        quotationId: 10,
        partnerId: 11,
        partnerTitle: 'Trendline Mağazacılık & E-Ticaret A.Ş.',
        type: 'SALES_ORDER',
        status: 'CONFIRMED',
        orderDate: '2026-03-12T16:00:00Z',
        totalAmount: 79200.0,
        notes: 'QT-2026-VOG-001 teklifinden onaylandı. Stoklar rezerve edildi.',
        items: [
          { id: 10, variantId: 1102, variantSku: 'OXF-BLU-M', productName: 'Oxford Gömlek (M / Açık Mavi)', quantity: 60, unitPrice: 480.0, taxRate: 10, lineTotal: 31680.0 },
          { id: 11, variantId: 1202, variantSku: 'JEA-IND-32', productName: 'Slim Fit Jean (32/32 / İndigo)', quantity: 50, unitPrice: 680.0, taxRate: 10, lineTotal: 37400.0 },
        ],
      },
    ],
    waybills: [
      {
        id: 10,
        waybillNumber: 'IRS-SVK-2026-VOG-001',
        orderId: 10,
        orderNumber: 'SIP-SAT-2026-VOG-001',
        partnerId: 11,
        partnerTitle: 'Trendline Mağazacılık & E-Ticaret A.Ş.',
        type: 'DISPATCH',
        status: 'DISPATCHED',
        waybillDate: '2026-03-13T14:30:00Z',
        carrierInfo: 'Yurtiçi Kargo Lojistik / 34 VR 8820',
        trackingNumber: 'YRT-91028374',
        notes: 'Trendline İkitelli Ana Lojistik Merkezine koli teslimatı.',
        items: [
          { id: 10, orderItemId: 10, variantId: 1102, variantSku: 'OXF-BLU-M', productName: 'Oxford Gömlek (M / Açık Mavi)', quantity: 60 },
          { id: 11, orderItemId: 11, variantId: 1202, variantSku: 'JEA-IND-32', productName: 'Slim Fit Jean (32/32 / İndigo)', quantity: 50 },
        ],
      },
    ],
    auditLogs: [
      {
        id: 10,
        username: 'admin',
        action: 'ORDER_CONFIRMED',
        entityType: 'Order',
        entityId: 10,
        oldValue: 'DRAFT',
        newValue: 'CONFIRMED',
        details: { orderNumber: 'SIP-SAT-2026-VOG-001', partner: 'Trendline Mağazacılık', stokRezerve: '110 Adet' },
        ipAddress: '192.168.2.15',
        timestamp: '2026-03-12T16:00:00Z',
      },
    ],
  },

  // =========================================================================
  // 3. KİRACI: TRENDLINE MAĞAZACILIK & E-TİCARET A.Ş. (Perakendeci)
  // =========================================================================
  tenant_perakende: {
    categories: [
      { id: 20, code: 'KAT-REYON', name: 'AVM Mağaza Reyon Ürünleri', description: 'Fiziki mağaza vitrin ve reyon stoğu' },
      { id: 21, code: 'KAT-ONLINE', name: 'E-Ticaret & Pazaryeri Stoğu', description: 'Trendyol ve web sitesi için ayrılmış online stok' },
      { id: 22, code: 'KAT-AKSESUAR', name: 'Deri Kemer & Aksesuar', description: 'Tamamlayıcı giyim ürünleri' },
    ],
    products: [
      {
        id: 20,
        code: 'PRD-TRD-01',
        name: 'Vogue Collection Slim Oxford Erkek Gömlek',
        description: 'Vogue Hazır Giyim üretimi, mağaza ve reyon barkodlu gömlek.',
        basePrice: 890.0,
        categoryId: 20,
        categoryName: 'AVM Mağaza Reyon Ürünleri',
        active: true,
        attributes: {
          tedarikciMarka: 'Vogue Hazır Giyim',
          barkodTipi: 'EAN-13',
          kategori: 'Reyon Vitrin',
        },
        variants: [
          { id: 2101, sku: 'TRD-OXF-BLU-M', barcode: '868000300101', size: 'M', color: 'Açık Mavi', stockQuantity: 60, reservedStock: 5, availableStock: 55, priceAdjustment: 0 },
          { id: 2102, sku: 'TRD-OXF-BLU-L', barcode: '868000300102', size: 'L', color: 'Açık Mavi', stockQuantity: 40, reservedStock: 0, availableStock: 40, priceAdjustment: 0 },
          { id: 2103, sku: 'TRD-OXF-WHT-M', barcode: '868000300103', size: 'M', color: 'Optik Beyaz', stockQuantity: 50, reservedStock: 0, availableStock: 50, priceAdjustment: 0 },
        ],
      },
      {
        id: 21,
        code: 'PRD-TRD-02',
        name: 'Vogue Collection Likralı Denim Pantolon',
        description: 'Vogue Hazır Giyim üretimi taşlanmış likralı jean pantolon.',
        basePrice: 1290.0,
        categoryId: 20,
        categoryName: 'AVM Mağaza Reyon Ürünleri',
        active: true,
        attributes: {
          tedarikciMarka: 'Vogue Hazır Giyim',
          sezon: '2026 İlkbahar',
        },
        variants: [
          { id: 2201, sku: 'TRD-JEA-IND-30', barcode: '868000300201', size: '30/32', color: 'İndigo', stockQuantity: 40, reservedStock: 2, availableStock: 38, priceAdjustment: 0 },
          { id: 2202, sku: 'TRD-JEA-IND-32', barcode: '868000300202', size: '32/32', color: 'İndigo', stockQuantity: 80, reservedStock: 10, availableStock: 70, priceAdjustment: 0 },
        ],
      },
      {
        id: 22,
        code: 'PRD-TRD-03',
        name: 'Trendline Basic Günlük Tişört',
        description: 'Günlük kullanım için rahat kesim penye tişört.',
        basePrice: 420.0,
        categoryId: 21,
        categoryName: 'E-Ticaret & Pazaryeri Stoğu',
        active: true,
        attributes: {
          kanal: 'Online Özel',
        },
        variants: [
          { id: 2301, sku: 'TRD-TSH-BLK-M', barcode: '868000300301', size: 'M', color: 'Siyah', stockQuantity: 150, reservedStock: 20, availableStock: 130, priceAdjustment: 0 },
          { id: 2302, sku: 'TRD-TSH-WHT-L', barcode: '868000300302', size: 'L', color: 'Beyaz', stockQuantity: 120, reservedStock: 15, availableStock: 105, priceAdjustment: 0 },
        ],
      },
    ],
    partners: [
      {
        id: 20,
        code: 'CAR-T01',
        title: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        taxNumber: '3210459821',
        taxOffice: 'Konak VD',
        type: 'SUPPLIER',
        email: 'kurumsal@voguegiyim.com.tr',
        phone: '+90 232 444 88 00',
        address: 'Organize Sanayi Bölgesi 2. Cadde No:14 İzmir',
        active: true,
        metadata: { iliskiliKiraci: 'tenant_moda', anaGiyimTedarikcisi: true },
      },
      {
        id: 21,
        code: 'CAR-P01',
        title: 'Trendyol Pazaryeri & E-Ticaret A.Ş.',
        taxNumber: '7788990011',
        taxOffice: 'Maslak VD',
        type: 'BOTH',
        email: 'entegrasyon@trendyol.com',
        phone: '+90 212 331 02 00',
        address: 'Büyükdere Cad. No:199 Spine Tower Maslak, İstanbul',
        active: true,
        metadata: { komisyonOrani: '%18', kanal: 'Pazaryeri' },
      },
      {
        id: 22,
        code: 'CAR-M01',
        title: 'Kurumsal Şirket Hediye & Personel Giyim Portföyü',
        taxNumber: '9900112233',
        taxOffice: 'Zincirlikuyu VD',
        type: 'CUSTOMER',
        email: 'b2b@sirkethehediye.com',
        phone: '+90 212 288 40 00',
        address: 'Büyükdere Cad. No:120 Levent, İstanbul',
        active: true,
      },
    ],
    quotations: [
      {
        id: 20,
        quotationNumber: 'QT-2026-TRD-001',
        partnerId: 20,
        partnerTitle: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        type: 'PURCHASE',
        status: 'ACCEPTED',
        issueDate: '2026-03-10T09:00:00Z',
        validUntil: '2026-03-25T18:00:00Z',
        totalAmount: 79200.0,
        notes: 'Vogue Hazır Giyim yeni sezon toptan alım teklifimiz.',
        items: [
          { id: 20, variantId: 2101, variantSku: 'TRD-OXF-BLU-M', productName: 'Vogue Oxford Gömlek (M / Açık Mavi)', quantity: 60, unitPrice: 480.0, taxRate: 10, lineTotal: 31680.0 },
          { id: 21, variantId: 2202, variantSku: 'TRD-JEA-IND-32', productName: 'Vogue Likralı Jean (32/32 / İndigo)', quantity: 50, unitPrice: 680.0, taxRate: 10, lineTotal: 37400.0 },
        ],
      },
    ],
    orders: [
      {
        id: 20,
        orderNumber: 'SIP-ALS-2026-TRD-001',
        quotationId: 20,
        partnerId: 20,
        partnerTitle: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        type: 'PURCHASE_ORDER',
        status: 'CONFIRMED',
        orderDate: '2026-03-12T10:30:00Z',
        totalAmount: 79200.0,
        notes: 'Vogue Hazır Giyim satınalma siparişimiz onaylandı.',
        items: [
          { id: 20, variantId: 2101, variantSku: 'TRD-OXF-BLU-M', productName: 'Vogue Oxford Gömlek (M / Açık Mavi)', quantity: 60, unitPrice: 480.0, taxRate: 10, lineTotal: 31680.0 },
        ],
      },
    ],
    waybills: [
      {
        id: 20,
        waybillNumber: 'IRS-SVK-2026-TRD-001',
        orderId: 20,
        orderNumber: 'SIP-ALS-2026-TRD-001',
        partnerId: 20,
        partnerTitle: 'Vogue Hazır Giyim & Konfeksiyon Ltd.',
        type: 'DISPATCH',
        status: 'DISPATCHED',
        waybillDate: '2026-03-14T08:00:00Z',
        carrierInfo: 'Trendline Filo Taşımacılık / 34 TRD 777',
        trackingNumber: 'TRD-550192',
        notes: 'Marmara Forum Trendline Mağazası Reyon Takviyesi - 3 koli gömlek.',
        items: [
          { id: 20, orderItemId: 20, variantId: 2101, variantSku: 'TRD-OXF-BLU-M', productName: 'Vogue Oxford Gömlek (M / Açık Mavi)', quantity: 30 },
        ],
      },
    ],
    auditLogs: [
      {
        id: 20,
        username: 'admin',
        action: 'ORDER_CONFIRMED',
        entityType: 'Order',
        entityId: 20,
        oldValue: 'DRAFT',
        newValue: 'CONFIRMED',
        details: { orderNumber: 'SIP-ALS-2026-TRD-001', partner: 'Vogue Hazır Giyim' },
        ipAddress: '192.168.3.5',
        timestamp: '2026-03-12T10:30:00Z',
      },
    ],
  },
};

// Default export helpers for backwards compatibility
export const mockCategories: Category[] = tenantMockDataMap.tenant_tekstil.categories;
export const mockProducts: Product[] = tenantMockDataMap.tenant_tekstil.products;
export const mockPartners: BusinessPartner[] = tenantMockDataMap.tenant_tekstil.partners;
export const mockQuotations: Quotation[] = tenantMockDataMap.tenant_tekstil.quotations;
export const mockOrders: Order[] = tenantMockDataMap.tenant_tekstil.orders;
export const mockWaybills: Waybill[] = tenantMockDataMap.tenant_tekstil.waybills;
export const mockAuditLogs: AuditLog[] = tenantMockDataMap.tenant_tekstil.auditLogs;
