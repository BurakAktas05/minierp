package com.minierp.core.config;

import com.minierp.core.multitenancy.TenantContext;
import com.minierp.core.multitenancy.TenantProvisioningService;
import com.minierp.core.security.entity.User;
import com.minierp.core.security.entity.UserRole;
import com.minierp.core.security.repository.UserRepository;
import com.minierp.modules.audit.entity.AuditLog;
import com.minierp.modules.audit.repository.AuditLogRepository;
import com.minierp.modules.inventory.entity.*;
import com.minierp.modules.inventory.repository.*;
import com.minierp.modules.order.entity.Order;
import com.minierp.modules.order.entity.OrderItem;
import com.minierp.modules.order.entity.OrderStatus;
import com.minierp.modules.order.entity.OrderType;
import com.minierp.modules.order.repository.OrderRepository;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.entity.PartnerType;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.quotation.entity.Quotation;
import com.minierp.modules.quotation.entity.QuotationItem;
import com.minierp.modules.quotation.entity.QuotationStatus;
import com.minierp.modules.quotation.entity.QuotationType;
import com.minierp.modules.quotation.repository.QuotationRepository;
import com.minierp.modules.tenant.entity.Tenant;
import com.minierp.modules.tenant.repository.TenantRepository;
import com.minierp.modules.waybill.entity.Waybill;
import com.minierp.modules.waybill.entity.WaybillItem;
import com.minierp.modules.waybill.entity.WaybillStatus;
import com.minierp.modules.invoice.entity.*;
import com.minierp.modules.invoice.repository.InvoiceRepository;
import com.minierp.modules.invoice.repository.PaymentRepository;
import com.minierp.modules.manufacturing.entity.*;
import com.minierp.modules.manufacturing.repository.BillOfMaterialsRepository;
import com.minierp.modules.manufacturing.repository.WorkOrderRepository;
import com.minierp.modules.waybill.entity.WaybillType;
import com.minierp.modules.waybill.repository.WaybillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Uygulama ilk ayağa kalktığında:
 * 1. Master şemada başlangıç kiracılarını doğrular.
 * 2. Her kiracı şemasını Flyway ile kurar.
 * 3. Çoklu Depo (Warehouses), Stok Bakiyeleri (Warehouse Stocks), Stok Hareketleri (Stock Movements)
 *    ve B2B Tedarik Zinciri verilerini tohumlar.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final TenantProvisioningService tenantProvisioningService;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final BusinessPartnerRepository businessPartnerRepository;
    private final QuotationRepository quotationRepository;
    private final OrderRepository orderRepository;
    private final WaybillRepository waybillRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final BillOfMaterialsRepository bomRepository;
    private final WorkOrderRepository workOrderRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== [MiniERP] Başlangıç Veritabanı ve Kiracı Kurulumu Başlatılıyor ===");

        // 1. Master şemadaki kiracıları kontrol et / eksikleri tamamla
        ensureDefaultTenants();

        // 2. Her kiracı şemasını Flyway ile kur ve başlangıç verilerini tohumla
        List<Tenant> tenants = tenantRepository.findAll();
        for (Tenant tenant : tenants) {
            try {
                // Şema oluştur & Flyway migrate et
                tenantProvisioningService.initTenant(tenant.getSchemaName());

                // Kiracı verilerini tohumla
                seedTenant(tenant);
            } catch (Exception e) {
                log.error("Kiracı şeması kurulumunda hata oluştu: schema={}, hata={}",
                        tenant.getSchemaName(), e.getMessage(), e);
            }
        }

        log.info("=== [MiniERP] Başlangıç Veritabanı ve Kiracı Kurulumu Tamamlandı ===");
    }

    private void ensureDefaultTenants() {
        createTenantIfMissing("tenant_tekstil", "Atlas Tekstil & Dokuma Sanayi A.Ş.", "tenant_tekstil");
        createTenantIfMissing("tenant_moda", "Vogue Hazır Giyim & Konfeksiyon Ltd.", "tenant_moda");
        createTenantIfMissing("tenant_perakende", "Trendline Mağazacılık & E-Ticaret A.Ş.", "tenant_perakende");
        createTenantIfMissing("tenant_aktas", "Aktaş Holding A.Ş. - Teknoloji & Çözüm Portalı", "tenant_aktas");
    }

    private void createTenantIfMissing(String tenantId, String companyName, String schemaName) {
        if (!tenantRepository.existsByTenantId(tenantId)) {
            Tenant tenant = Tenant.builder()
                    .tenantId(tenantId)
                    .companyName(companyName)
                    .schemaName(schemaName)
                    .active(true)
                    .build();
            tenantRepository.save(tenant);
            log.info("Master tabloda varsayılan kiracı kaydedildi: {}", tenantId);
        }
    }

    private void seedTenant(Tenant tenant) {
        TenantContext.setTenantId(tenant.getTenantId());
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            txTemplate.execute(status -> {
                // 1. Temel standart carilerin eksik olanlarını güvenli ve hiçbir veriyi silmeden tamamla
                ensureStandardPartnersIfMissing();

                // 2. Eğer şemada zaten kullanıcı varsa tohumlama tamamlanmış demektir, asla ezme
                if (userRepository.count() > 0) {
                    log.info("Kiracı '{}' verileri zaten mevcut, tohumlama atlandı.", tenant.getTenantId());
                    return null;
                }

                log.info("Kiracı '{}' için zengin B2B tedarik zinciri verileri yükleniyor...", tenant.getTenantId());

                // A. Kullanıcıları Ekle
                seedUsers(tenant.getTenantId());

                // B. Kiracıya Özel İşletme Verilerini Ekle
                if ("tenant_tekstil".equals(tenant.getTenantId())) {
                    seedAtlasTekstil();
                } else if ("tenant_moda".equals(tenant.getTenantId())) {
                    seedVogueHazirGiyim();
                } else if ("tenant_perakende".equals(tenant.getTenantId())) {
                    seedTrendlinePerakende();
                } else if ("tenant_aktas".equals(tenant.getTenantId())) {
                    seedAktasHolding();
                }

                return null;
            });
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Temel 3 standart cari hesabı (Kompitürk, Mobilyacı, Ofis Müşterisi)
     * şemada eksikse güvenli ve non-destructive (asla veri silmeden) olarak ekler.
     */
    private void ensureStandardPartnersIfMissing() {
        if (!businessPartnerRepository.existsByCode("CAR-KMP-001")) {
            businessPartnerRepository.save(BusinessPartner.builder()
                    .code("CAR-KMP-001")
                    .partnerType(PartnerType.BOTH)
                    .name("Kompitürk ERP & Bilişim A.Ş.")
                    .companyTitle("Kompitürk Bilişim Yazılım ve Danışmanlık Hizmetleri A.Ş.")
                    .taxNumber("5810293841")
                    .taxOffice("Boğaziçi VD")
                    .email("iletisim@kompiturk.com")
                    .phone("+90 212 888 10 20")
                    .address("Yıldız Teknik Üniversitesi Teknopark Bilişim Vadisi No:10 Esenler / İstanbul")
                    .metadata(Map.of(
                            "sektor", "Bilişim & Yazılım",
                            "faaliyet", "MiniERP Kurumsal Lisans & Danışmanlık Hizmetleri",
                            "yetkili", "Burak Aktaş"
                    ))
                    .build());
        }

        if (!businessPartnerRepository.existsByCode("CAR-MBL-001")) {
            businessPartnerRepository.save(BusinessPartner.builder()
                    .code("CAR-MBL-001")
                    .partnerType(PartnerType.BOTH)
                    .name("Artisan Ahşap & Mobilya Sanayi Ltd.")
                    .companyTitle("Artisan Ahşap Mobilya Sanayi ve Ticaret Ltd. Şti.")
                    .taxNumber("2910485712")
                    .taxOffice("İnegöl VD")
                    .email("siparis@artisanmobilya.com.tr")
                    .phone("+90 224 714 55 00")
                    .address("Organize Sanayi Bölgesi Mobilyacılar Cad. No:18 İnegöl / Bursa")
                    .metadata(Map.of(
                            "sektor", "Mobilya & Ağaç İşleri",
                            "faaliyet", "Ofis ve Ev Ahşap Mobilyaları İmalatı & Toptan Satışı",
                            "yetkili", "Ahmet Usta"
                    ))
                    .build());
        }

        if (!businessPartnerRepository.existsByCode("CAR-NOV-001")) {
            businessPartnerRepository.save(BusinessPartner.builder()
                    .code("CAR-NOV-001")
                    .partnerType(PartnerType.CUSTOMER)
                    .name("Nova Plaza & Kurumsal Ofis Çözümleri A.Ş.")
                    .companyTitle("Nova Plaza İş Merkezi ve Yönetim Hizmetleri A.Ş.")
                    .taxNumber("6320194851")
                    .taxOffice("Maslak VD")
                    .email("satinalma@novaplaza.com.tr")
                    .phone("+90 212 345 60 70")
                    .address("Büyükdere Cad. Nova Plaza No:142 Kat:12 Maslak / İstanbul")
                    .metadata(Map.of(
                            "sektor", "Gayrimenkul & İş Merkezi Yönetimi",
                            "faaliyet", "Kurumsal Ofis Yönetimi",
                            "vade", "30 Gün",
                            "yetkili", "Zeynep Hanım"
                    ))
                    .build());
        }
    }

    private void seedUsers(String tenantId) {
        User admin = User.builder()
                .username("admin")
                .email("admin@" + tenantId + ".com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .fullName("Sistem Yöneticisi")
                .role(UserRole.ROLE_ADMIN)
                .active(true)
                .build();

        User manager = User.builder()
                .username("manager")
                .email("manager@" + tenantId + ".com")
                .passwordHash(passwordEncoder.encode("manager123"))
                .fullName("Operasyon Müdürü")
                .role(UserRole.ROLE_MANAGER)
                .active(true)
                .build();

        User user = User.builder()
                .username("user")
                .email("user@" + tenantId + ".com")
                .passwordHash(passwordEncoder.encode("user123"))
                .fullName("Depo & Satış Uzmanı")
                .role(UserRole.ROLE_USER)
                .active(true)
                .build();

        userRepository.saveAll(List.of(admin, manager, user));
    }

    private WarehouseStock createWarehouseStock(Warehouse warehouse, ProductVariant variant, int quantity, int reserved, String shelf) {
        return warehouseStockRepository.save(WarehouseStock.builder()
                .warehouse(warehouse)
                .variant(variant)
                .quantity(quantity)
                .reservedStock(reserved)
                .shelfLocation(shelf)
                .build());
    }

    private StockMovement recordInitialMovement(Warehouse warehouse, ProductVariant variant, int quantity, String movementNum) {
        return stockMovementRepository.save(StockMovement.builder()
                .movementNumber(movementNum)
                .movementType(StockMovementType.GOODS_RECEIPT)
                .targetWarehouse(warehouse)
                .variant(variant)
                .quantity(quantity)
                .referenceType("INITIAL_STOCK")
                .notes("Sistem kurulumu açılış stok sayım fişi.")
                .performedBy("admin")
                .build());
    }

    // =========================================================================
    // 1. KİRACI: ATLAS TEKSTİL & DOKUMA SANAYİ A.Ş. (Kumaş & İplik Üreticisi)
    // =========================================================================
    private void seedAtlasTekstil() {
        // Kategoriler
        Category catHam = categoryRepository.save(Category.builder().name("Ham Elyaf & İplik").code("KAT-HAM").description("İplik ve hammadde topları").build());
        Category catDokuma = categoryRepository.save(Category.builder().name("Dokuma Kumaş Topları").code("KAT-DOKUMA").description("Gömleklik ve pantolonluk dokuma kumaşlar").build());
        Category catOrme = categoryRepository.save(Category.builder().name("Örme & Penye Kumaşlar").code("KAT-ORME").description("Tişört ve sweatshirt için örme kumaşlar").build());

        // Ürün 1: Saf Pamuk Oxford Dokuma Kumaş
        Product prodOxford = Product.builder()
                .name("Saf Pamuk Oxford Dokuma Kumaş Topu")
                .code("PRD-KMS-01")
                .category(catDokuma)
                .baseUnit("TOP")
                .taxRate(new BigDecimal("10.00"))
                .description("İnce numara penye iplikten dokunmuş, nefes alan B2B gömleklik kumaş topu (50m).")
                .attributes(Map.of("iplikNo", "30/1 Penye", "en", "150 cm", "gramaj", "145 GSM"))
                .build();

        ProductVariant varOxfBlu = ProductVariant.builder()
                .sku("OXF-TOP-BLU").barcode("868000100101").variantName("Açık Mavi - 50m Top")
                .purchasePrice(new BigDecimal("3200.00")).salePrice(new BigDecimal("4500.00"))
                .stockQuantity(150).reservedStock(30).attributes(Map.of("renk", "Açık Mavi", "uzunluk", "50m"))
                .build();
        ProductVariant varOxfWht = ProductVariant.builder()
                .sku("OXF-TOP-WHT").barcode("868000100102").variantName("Optik Beyaz - 50m Top")
                .purchasePrice(new BigDecimal("3200.00")).salePrice(new BigDecimal("4500.00"))
                .stockQuantity(120).reservedStock(0).attributes(Map.of("renk", "Optik Beyaz", "uzunluk", "50m"))
                .build();
        prodOxford.addVariant(varOxfBlu);
        prodOxford.addVariant(varOxfWht);
        productRepository.save(prodOxford);

        // Ürün 2: Likralı Ağır Denim Kumaş
        Product prodDenim = Product.builder()
                .name("Likralı Ağır Denim / Kot Kumaşı")
                .code("PRD-KMS-02")
                .category(catDokuma)
                .baseUnit("TOP")
                .taxRate(new BigDecimal("10.00"))
                .description("Dayanıklı ve esnek pantolonluk denim kumaş rulosu (100m).")
                .attributes(Map.of("kumasTipi", "%98 Pamuk, %2 Elastan", "gramaj", "12.5 Oz"))
                .build();

        ProductVariant varDenimInd = ProductVariant.builder()
                .sku("JEA-TOP-IND").barcode("868000100201").variantName("İndigo Mavi - 100m Rulo")
                .purchasePrice(new BigDecimal("5800.00")).salePrice(new BigDecimal("8200.00"))
                .stockQuantity(110).reservedStock(25).attributes(Map.of("renk", "İndigo", "uzunluk", "100m"))
                .build();
        prodDenim.addVariant(varDenimInd);
        productRepository.save(prodDenim);

        // Ürün 3: 240 GSM Süprem Penye Kumaş
        Product prodSuprem = Product.builder()
                .name("240 GSM Süprem Penye Örme Kumaş")
                .code("PRD-KMS-03")
                .category(catOrme)
                .baseUnit("RULO")
                .taxRate(new BigDecimal("10.00"))
                .description("Ağır gramajlı tişört ve üst giyim imalatı için 30kg penye rulosu.")
                .attributes(Map.of("iplik", "%100 Taranmış Pamuk", "en", "180 cm Açık En"))
                .build();

        ProductVariant varSupremBlk = ProductVariant.builder()
                .sku("SUP-TOP-BLK").barcode("868000100301").variantName("Mat Siyah - 30kg Top")
                .purchasePrice(new BigDecimal("2800.00")).salePrice(new BigDecimal("3800.00"))
                .stockQuantity(200).reservedStock(50).attributes(Map.of("renk", "Mat Siyah", "agirlik", "30kg"))
                .build();
        prodSuprem.addVariant(varSupremBlk);
        productRepository.save(prodSuprem);

        // Depolar (Çoklu Depo Desteği)
        Warehouse whAtlasMain = warehouseRepository.save(Warehouse.builder()
                .code("WH-ATLAS-01")
                .name("Hadımköy Merkez Dokuma Deposu")
                .location("İstanbul / Hadımköy")
                .address("Dokumacılar Sanayi Sitesi A Blok No:12 Hadımköy/İstanbul")
                .isActive(true)
                .build());

        Warehouse whAtlasEge = warehouseRepository.save(Warehouse.builder()
                .code("WH-ATLAS-02")
                .name("Ege Bölge Hammadde & Lojistik Deposu")
                .location("İzmir / Gaziemir")
                .address("Serbest Bölge 4. Cadde No:8 Gaziemir/İzmir")
                .isActive(true)
                .build());

        // Depo Stok Bakiyeleri ve Hareketler
        createWarehouseStock(whAtlasMain, varOxfBlu, 100, 30, "RAF-A1");
        createWarehouseStock(whAtlasEge, varOxfBlu, 50, 0, "RAF-E1");
        recordInitialMovement(whAtlasMain, varOxfBlu, 100, "SM-2026-TEK-001");

        createWarehouseStock(whAtlasMain, varOxfWht, 80, 0, "RAF-A2");
        createWarehouseStock(whAtlasEge, varOxfWht, 40, 0, "RAF-E2");

        createWarehouseStock(whAtlasMain, varDenimInd, 70, 25, "RAF-B1");
        createWarehouseStock(whAtlasEge, varDenimInd, 40, 0, "RAF-E3");

        createWarehouseStock(whAtlasMain, varSupremBlk, 140, 50, "RAF-C1");
        createWarehouseStock(whAtlasEge, varSupremBlk, 60, 0, "RAF-E4");

        // Cari Hesaplar (Entegre İşletmeler)
        BusinessPartner partnerVogue = businessPartnerRepository.save(BusinessPartner.builder()
                .name("Vogue Hazır Giyim & Konfeksiyon Ltd.")
                .companyTitle("Vogue Hazır Giyim Sanayi ve Ticaret Ltd. Şti.")
                .partnerType(PartnerType.CUSTOMER)
                .taxNumber("3210459821").taxOffice("Konak VD")
                .email("tedarik@voguegiyim.com.tr").phone("+90 232 444 88 00")
                .address("Organize Sanayi Bölgesi 2. Cadde No:14 İzmir")
                .metadata(Map.of("iliskiliKiraci", "tenant_moda", "vade", "45 Gün", "krediLimiti", 1500000))
                .build());

        BusinessPartner partnerCukurova = businessPartnerRepository.save(BusinessPartner.builder()
                .name("Çukurova Pamuk & Elyaf Kooperatifi")
                .companyTitle("S.S. Çukurova Pamuk Tarım Satış Kooperatifleri Birliği")
                .partnerType(PartnerType.SUPPLIER)
                .taxNumber("4820193847").taxOffice("Seyhan VD")
                .email("satis@cukurovapamuk.org.tr").phone("+90 322 355 40 00")
                .address("D-400 Karayolu Üzeri 12. Km Yüreğir, Adana")
                .metadata(Map.of("hammadde", "Ham Lif Pamuk", "vade", "Peşin"))
                .build());

        // B2B Teklif (Vogue Hazır Giyim'e kumaş teklifi - ACCEPTED)
        Quotation quoteToVogue = Quotation.builder()
                .quotationNumber("QT-2026-TEK-001")
                .type(QuotationType.SALES)
                .partner(partnerVogue)
                .status(QuotationStatus.ACCEPTED)
                .issueDate(OffsetDateTime.now().minusDays(5))
                .validUntil(OffsetDateTime.now().plusDays(15))
                .currency("TRY")
                .subtotalAmount(new BigDecimal("225000.00"))
                .taxAmount(new BigDecimal("22500.00"))
                .totalAmount(new BigDecimal("247500.00"))
                .notes("2026 İlkbahar/Yaz koleksiyonu kumaş tedarik anlaşması.")
                .build();
        quoteToVogue.addItem(QuotationItem.builder().variant(varOxfBlu).description("Oxford Mavi Kumaş Topu").quantity(30).unitPrice(new BigDecimal("4500.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("148500.00")).build());
        quoteToVogue.addItem(QuotationItem.builder().variant(varDenimInd).description("Denim İndigo Kumaş Rulosu").quantity(11).unitPrice(new BigDecimal("8200.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("99220.00")).build());
        quotationRepository.save(quoteToVogue);

        // Resmi Sipariş (Vogue'un kumaş siparişi - CONFIRMED -> Stoklar rezerve!)
        Order orderFromVogue = Order.builder()
                .orderNumber("SIP-SAT-2026-TEK-001")
                .orderType(OrderType.SALES_ORDER)
                .partner(partnerVogue)
                .quotationId(quoteToVogue.getId())
                .status(OrderStatus.CONFIRMED)
                .orderDate(OffsetDateTime.now().minusDays(3))
                .deliveryDate(OffsetDateTime.now().plusDays(7))
                .currency("TRY")
                .subtotalAmount(new BigDecimal("225000.00"))
                .taxAmount(new BigDecimal("22500.00"))
                .totalAmount(new BigDecimal("247500.00"))
                .notes("QT-2026-TEK-001 teklifine istinaden onaylandı. Kumaşlar ayrıldı.")
                .build();
        orderFromVogue.addItem(OrderItem.builder().variant(varOxfBlu).description("Oxford Mavi Kumaş Topu").quantity(30).unitPrice(new BigDecimal("4500.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("148500.00")).build());
        orderRepository.save(orderFromVogue);

        // Sevk İrsaliyesi (Vogue fabrikasına sevk edilen kumaşlar - DISPATCHED)
        Waybill waybillToVogue = Waybill.builder()
                .waybillNumber("IRS-SVK-2026-TEK-001")
                .type(WaybillType.DISPATCH)
                .partner(partnerVogue)
                .orderId(orderFromVogue.getId())
                .sourceWarehouse(whAtlasMain)
                .status(WaybillStatus.DISPATCHED)
                .dispatchDate(OffsetDateTime.now().minusDays(1))
                .carrierCompany("Aras Kargo Kurumsal Lojistik")
                .trackingNumber("ARK-89217364")
                .vehiclePlate("34 ER 1928")
                .notes("30 Top Oxford Açık Mavi Kumaş sevk edildi. Hasarsız teslim ediniz.")
                .build();
        waybillToVogue.addItem(WaybillItem.builder().variant(varOxfBlu).description("Oxford Mavi Kumaş Topu").quantity(30).unitPrice(new BigDecimal("4500.00")).build());
        waybillRepository.save(waybillToVogue);

        // Satış Faturası (Vogue fabrikasına sevk edilen kumaşlar için fatura)
        Invoice invoiceToVogue = Invoice.builder()
                .invoiceNumber("FTR-SAT-2026-TEK-001")
                .invoiceType(InvoiceType.SALES_INVOICE)
                .partner(partnerVogue)
                .orderId(orderFromVogue.getId())
                .waybillId(waybillToVogue.getId())
                .status(InvoiceStatus.PARTIALLY_PAID)
                .invoiceDate(OffsetDateTime.now().minusDays(1))
                .dueDate(OffsetDateTime.now().plusDays(29))
                .currency("TRY")
                .exchangeRate(BigDecimal.ONE)
                .subtotalAmount(new BigDecimal("135000.00"))
                .taxAmount(new BigDecimal("13500.00"))
                .totalAmount(new BigDecimal("148500.00"))
                .paidAmount(new BigDecimal("50000.00"))
                .remainingAmount(new BigDecimal("98500.00"))
                .notes("IRS-SVK-2026-TEK-001 nolu irsaliyeden faturalaştırıldı.")
                .build();
        invoiceToVogue.addItem(InvoiceItem.builder()
                .variant(varOxfBlu)
                .description("Oxford Mavi Kumaş Topu (50m)")
                .quantity(new BigDecimal("30"))
                .unitPrice(new BigDecimal("4500.00"))
                .taxRate(new BigDecimal("10.00"))
                .discountRate(BigDecimal.ZERO)
                .subtotal(new BigDecimal("135000.00"))
                .build());
        invoiceRepository.save(invoiceToVogue);

        // Tahsilat (Vogue'dan alınan peşinat)
        Payment paymentFromVogue = Payment.builder()
                .paymentNumber("ODM-2026-TEK-001")
                .paymentType(PaymentType.INCOMING)
                .invoice(invoiceToVogue)
                .partner(partnerVogue)
                .amount(new BigDecimal("50000.00"))
                .currency("TRY")
                .exchangeRate(BigDecimal.ONE)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentDate(OffsetDateTime.now().minusHours(6))
                .referenceNumber("HAV-89102394")
                .status(PaymentStatus.COMPLETED)
                .notes("İş Bankası ticari hesaba gelen ön peşinat havalesi.")
                .build();
        paymentRepository.save(paymentFromVogue);

        // Audit Log
        auditLogRepository.save(AuditLog.builder()
                .action("ORDER_CONFIRMED")
                .entityType("Order")
                .entityId(orderFromVogue.getId())
                .performedBy("admin")
                .details(Map.of("orderNumber", orderFromVogue.getOrderNumber(), "partner", partnerVogue.getName()))
                .build());
    }

    // =========================================================================
    // 2. KİRACI: VOGUE HAZIR GİYİM & KONFEKSİYON LTD. (Giyim İmalatçısı)
    // =========================================================================
    private void seedVogueHazirGiyim() {
        Category catUst = categoryRepository.save(Category.builder().name("Üst Giyim Koleksiyonu").code("KAT-UST").description("Erkek ve Kadın gömlek & tişört").build());
        Category catAlt = categoryRepository.save(Category.builder().name("Alt Giyim & Denim").code("KAT-ALT").description("Likralı kot ve kumaş pantolon").build());

        // Ürün 1: Klasik Oxford Slim Fit Gömlek (Atlas'ın kumaşından üretildi)
        Product prodGomlek = Product.builder()
                .name("Klasik Oxford Slim Fit Erkek Gömlek")
                .code("PRD-GMK-01")
                .category(catUst)
                .baseUnit("ADET")
                .taxRate(new BigDecimal("10.00"))
                .description("Atlas Tekstil 100% pamuklu Oxford kumaşından özenle dikilmiş B2B toptan gömlek.")
                .attributes(Map.of("kumasMensei", "Atlas Tekstil A.Ş.", "kesim", "Slim Fit", "yaka", "İtalyan Düğmeli"))
                .build();

        ProductVariant varGmkBluM = ProductVariant.builder()
                .sku("OXF-BLU-M").barcode("868000200101").variantName("M / Açık Mavi")
                .purchasePrice(new BigDecimal("220.00")).salePrice(new BigDecimal("480.00"))
                .stockQuantity(240).reservedStock(60).attributes(Map.of("renk", "Açık Mavi", "beden", "M"))
                .build();
        ProductVariant varGmkBluL = ProductVariant.builder()
                .sku("OXF-BLU-L").barcode("868000200102").variantName("L / Açık Mavi")
                .purchasePrice(new BigDecimal("220.00")).salePrice(new BigDecimal("480.00"))
                .stockQuantity(160).reservedStock(40).attributes(Map.of("renk", "Açık Mavi", "beden", "L"))
                .build();
        ProductVariant varGmkWhtM = ProductVariant.builder()
                .sku("OXF-WHT-M").barcode("868000200103").variantName("M / Optik Beyaz")
                .purchasePrice(new BigDecimal("220.00")).salePrice(new BigDecimal("480.00"))
                .stockQuantity(190).reservedStock(0).attributes(Map.of("renk", "Optik Beyaz", "beden", "M"))
                .build();
        prodGomlek.addVariant(varGmkBluM);
        prodGomlek.addVariant(varGmkBluL);
        prodGomlek.addVariant(varGmkWhtM);
        productRepository.save(prodGomlek);

        // Ürün 2: Slim Fit Likralı Jean Pantolon (Atlas'ın denim kumaşından üretildi)
        Product prodJean = Product.builder()
                .name("Slim Fit Likralı Jean Pantolon")
                .code("PRD-PNT-01")
                .category(catAlt)
                .baseUnit("ADET")
                .taxRate(new BigDecimal("10.00"))
                .description("Atlas Tekstil esnek denim kumaşıyla taşlanmış modern kesim jean pantolon.")
                .attributes(Map.of("kumasTipi", "Atlas 12.5 Oz Likralı Denim", "yikama", "Orta İndigo Taşlama"))
                .build();

        ProductVariant varJeaInd32 = ProductVariant.builder()
                .sku("JEA-IND-32").barcode("868000200201").variantName("32/32 / İndigo")
                .purchasePrice(new BigDecimal("310.00")).salePrice(new BigDecimal("680.00"))
                .stockQuantity(180).reservedStock(50).attributes(Map.of("renk", "İndigo", "beden", "32/32"))
                .build();
        prodJean.addVariant(varJeaInd32);
        productRepository.save(prodJean);

        // Depolar (Vogue Hazır Giyim Çoklu Depoları)
        Warehouse whVogGungoren = warehouseRepository.save(Warehouse.builder()
                .code("WH-VOG-01")
                .name("Güngören Dikim & Mamul Deposu")
                .location("İstanbul / Güngören")
                .address("Tekstilciler Cad. No:44 Güngören/İstanbul")
                .isActive(true)
                .build());

        Warehouse whVogBursa = warehouseRepository.save(Warehouse.builder()
                .code("WH-VOG-02")
                .name("Bursa Kumaş Tedarik Deposu")
                .location("Bursa / Nilüfer")
                .address("Demirtaş OSB 2. Sokak Nilüfer/Bursa")
                .isActive(true)
                .build());

        // Stok Dağılımı ve Başlangıç Hareketi
        createWarehouseStock(whVogGungoren, varGmkBluM, 160, 60, "R-VOG-01");
        createWarehouseStock(whVogBursa, varGmkBluM, 80, 0, "R-BUR-01");
        recordInitialMovement(whVogGungoren, varGmkBluM, 160, "SM-2026-VOG-001");

        createWarehouseStock(whVogGungoren, varGmkBluL, 110, 40, "R-VOG-02");
        createWarehouseStock(whVogBursa, varGmkBluL, 50, 0, "R-BUR-02");

        createWarehouseStock(whVogGungoren, varGmkWhtM, 130, 0, "R-VOG-03");
        createWarehouseStock(whVogBursa, varGmkWhtM, 60, 0, "R-BUR-03");

        createWarehouseStock(whVogGungoren, varJeaInd32, 120, 50, "R-VOG-04");
        createWarehouseStock(whVogBursa, varJeaInd32, 60, 0, "R-BUR-04");

        // Cari Hesaplar
        BusinessPartner partnerAtlas = businessPartnerRepository.save(BusinessPartner.builder()
                .name("Atlas Tekstil & Dokuma Sanayi A.Ş.")
                .companyTitle("Atlas Tekstil Sanayi ve Ticaret A.Ş.")
                .partnerType(PartnerType.SUPPLIER)
                .taxNumber("9876543210").taxOffice("Bursa Nilüfer VD")
                .email("siparis@atlastekstil.com.tr").phone("+90 224 441 50 00")
                .address("Demirtaş Organize Sanayi Bölgesi Gül Cad. No:18 Bursa")
                .metadata(Map.of("iliskiliKiraci", "tenant_tekstil", "kumasTedarikcisi", true))
                .build());

        BusinessPartner partnerTrendline = businessPartnerRepository.save(BusinessPartner.builder()
                .name("Trendline Mağazacılık & E-Ticaret A.Ş.")
                .companyTitle("Trendline Perakende Mağazacılık A.Ş.")
                .partnerType(PartnerType.CUSTOMER)
                .taxNumber("6129840291").taxOffice("İkitelli VD")
                .email("satin_alma@trendline.com.tr").phone("+90 212 659 70 00")
                .address("İkitelli OSB Aykosan Sanayi Sitesi 4. Blok No:12 İstanbul")
                .metadata(Map.of("iliskiliKiraci", "tenant_perakende", "magazaSayisi", 38))
                .build());

        // B2B Satış Teklifi (Trendline Mağazacılık'a toptan gömlek & jean teklifi)
        Quotation quoteToTrendline = Quotation.builder()
                .quotationNumber("QT-2026-VOG-001")
                .type(QuotationType.SALES)
                .partner(partnerTrendline)
                .status(QuotationStatus.ACCEPTED)
                .issueDate(OffsetDateTime.now().minusDays(4))
                .validUntil(OffsetDateTime.now().plusDays(20))
                .currency("TRY")
                .subtotalAmount(new BigDecimal("72000.00"))
                .taxAmount(new BigDecimal("7200.00"))
                .totalAmount(new BigDecimal("79200.00"))
                .notes("Trendline vitrin ve mağaza sevkiyatı toptan teklifi.")
                .build();
        quoteToTrendline.addItem(QuotationItem.builder().variant(varGmkBluM).description("Oxford Gömlek (M / Açık Mavi)").quantity(100).unitPrice(new BigDecimal("480.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("52800.00")).build());
        quoteToTrendline.addItem(QuotationItem.builder().variant(varJeaInd32).description("Slim Fit Jean (32/32 / İndigo)").quantity(50).unitPrice(new BigDecimal("680.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("37400.00")).build());
        quotationRepository.save(quoteToTrendline);

        // Satış Siparişi (Trendline'ın onaylı siparişi -> Rezerve stok)
        Order orderFromTrendline = Order.builder()
                .orderNumber("SIP-SAT-2026-VOG-001")
                .orderType(OrderType.SALES_ORDER)
                .partner(partnerTrendline)
                .quotationId(quoteToTrendline.getId())
                .status(OrderStatus.CONFIRMED)
                .orderDate(OffsetDateTime.now().minusDays(2))
                .currency("TRY")
                .subtotalAmount(new BigDecimal("72000.00"))
                .taxAmount(new BigDecimal("7200.00"))
                .totalAmount(new BigDecimal("79200.00"))
                .notes("QT-2026-VOG-001 teklifinden onaylandı. Mağaza kolilemesi hazır.")
                .build();
        orderFromTrendline.addItem(OrderItem.builder().variant(varGmkBluM).description("Oxford Gömlek (M / Açık Mavi)").quantity(60).unitPrice(new BigDecimal("480.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("31680.00")).build());
        orderRepository.save(orderFromTrendline);

        // Sevk İrsaliyesi
        Waybill waybillToTrendline = Waybill.builder()
                .waybillNumber("IRS-SVK-2026-VOG-001")
                .type(WaybillType.DISPATCH)
                .partner(partnerTrendline)
                .orderId(orderFromTrendline.getId())
                .sourceWarehouse(whVogGungoren)
                .status(WaybillStatus.DISPATCHED)
                .dispatchDate(OffsetDateTime.now().minusHours(12))
                .carrierCompany("Yurtiçi Kargo Lojistik")
                .trackingNumber("YRT-91028374")
                .vehiclePlate("34 VR 8820")
                .notes("Trendline İkitelli Ana Lojistik Merkezine 6 koli gömlek teslimatı.")
                .build();
        waybillToTrendline.addItem(WaybillItem.builder().variant(varGmkBluM).description("Oxford Gömlek (M / Açık Mavi)").quantity(60).unitPrice(new BigDecimal("480.00")).build());
        waybillRepository.save(waybillToTrendline);

        // Satış Faturası (Trendline Mağazacılık'a sevk edilen gömlekler için fatura)
        Invoice invoiceToTrendline = Invoice.builder()
                .invoiceNumber("FTR-SAT-2026-VOG-001")
                .invoiceType(InvoiceType.SALES_INVOICE)
                .partner(partnerTrendline)
                .orderId(orderFromTrendline.getId())
                .waybillId(waybillToTrendline.getId())
                .status(InvoiceStatus.APPROVED)
                .invoiceDate(OffsetDateTime.now().minusHours(8))
                .dueDate(OffsetDateTime.now().plusDays(25))
                .currency("TRY")
                .exchangeRate(BigDecimal.ONE)
                .subtotalAmount(new BigDecimal("28800.00"))
                .taxAmount(new BigDecimal("2880.00"))
                .totalAmount(new BigDecimal("31680.00"))
                .paidAmount(BigDecimal.ZERO)
                .remainingAmount(new BigDecimal("31680.00"))
                .notes("IRS-SVK-2026-VOG-001 irsaliyesi teslimat faturası.")
                .build();
        invoiceToTrendline.addItem(InvoiceItem.builder()
                .variant(varGmkBluM)
                .description("Oxford Slim Fit Gömlek (M / Açık Mavi)")
                .quantity(new BigDecimal("60"))
                .unitPrice(new BigDecimal("480.00"))
                .taxRate(new BigDecimal("10.00"))
                .discountRate(BigDecimal.ZERO)
                .subtotal(new BigDecimal("28800.00"))
                .build());
        invoiceRepository.save(invoiceToTrendline);

        // ==========================================
        // Üretim Reçetesi (BOM) & İş Emirleri
        // ==========================================
        Category catHam = categoryRepository.save(Category.builder().name("Hammadde & Aksesuar").code("KAT-HAM-VOG").description("Kumaş topları, düğme ve tela").build());
        Product prodHamKumas = Product.builder().name("Ham Dokuma Kumaş Rulosu (50m)").code("PRD-RAW-KMS").category(catHam).baseUnit("TOP").build();
        ProductVariant varHamKumas = ProductVariant.builder().sku("RAW-KMS-OXF").variantName("Oxford Mavi Kumaş Topu").purchasePrice(new BigDecimal("4500.00")).stockQuantity(25).reservedStock(0).build();
        prodHamKumas.addVariant(varHamKumas);
        productRepository.save(prodHamKumas);

        Product prodAksesuar = Product.builder().name("Sedef Gömlek Düğmesi (1000'lik Paket)").code("PRD-RAW-DGM").category(catHam).baseUnit("PAKET").build();
        ProductVariant varAksesuar = ProductVariant.builder().sku("RAW-DGM-SDF").variantName("Sedef Düğme Paketi").purchasePrice(new BigDecimal("150.00")).stockQuantity(40).reservedStock(0).build();
        prodAksesuar.addVariant(varAksesuar);
        productRepository.save(prodAksesuar);

        BillOfMaterials bomGomlek = BillOfMaterials.builder()
                .bomCode("BOM-GMK-OXF-01")
                .name("Oxford Slim Fit Gömlek Konfeksiyon Reçetesi")
                .variant(varGmkBluM)
                .quantity(BigDecimal.ONE)
                .unit("ADET")
                .industryType("TEXTILE")
                .metadata(Map.of("dikimSuresiDk", 25, "utuPaketDk", 8, "hatNo", "Bant-2"))
                .build();
        bomGomlek.addItem(BomItem.builder().componentVariant(varHamKumas).quantity(new BigDecimal("0.032")).unit("TOP").scrapRate(new BigDecimal("2.0")).description("Gömlek başına 1.6 metre kumaş sarfiyatı").build());
        bomGomlek.addItem(BomItem.builder().componentVariant(varAksesuar).quantity(new BigDecimal("0.008")).unit("PAKET").scrapRate(BigDecimal.ZERO).description("8 adet sedef düğme").build());
        bomRepository.save(bomGomlek);

        WorkOrder woCompleted = WorkOrder.builder()
                .orderNumber("WO-2026-VOG-001")
                .bom(bomGomlek)
                .sourceWarehouse(whVogGungoren)
                .targetWarehouse(whVogGungoren)
                .plannedQuantity(new BigDecimal("100"))
                .producedQuantity(new BigDecimal("100"))
                .status(WorkOrderStatus.COMPLETED)
                .priority("HIGH")
                .startDate(OffsetDateTime.now().minusDays(3))
                .completionDate(OffsetDateTime.now().minusDays(1))
                .notes("Trendline toptan siparişine istinaden 100 adet gömlek dikimi tamamlandı.")
                .build();
        workOrderRepository.save(woCompleted);

        WorkOrder woInProgress = WorkOrder.builder()
                .orderNumber("WO-2026-VOG-002")
                .bom(bomGomlek)
                .sourceWarehouse(whVogGungoren)
                .targetWarehouse(whVogGungoren)
                .plannedQuantity(new BigDecimal("50"))
                .producedQuantity(new BigDecimal("20"))
                .status(WorkOrderStatus.IN_PROGRESS)
                .priority("NORMAL")
                .startDate(OffsetDateTime.now().minusHours(4))
                .dueDate(OffsetDateTime.now().plusDays(2))
                .notes("Haftalık reyon takviyesi dikim bandında.")
                .build();
        workOrderRepository.save(woInProgress);

        auditLogRepository.save(AuditLog.builder()
                .action("ORDER_CONFIRMED")
                .entityType("Order")
                .entityId(orderFromTrendline.getId())
                .performedBy("admin")
                .details(Map.of("orderNumber", orderFromTrendline.getOrderNumber(), "partner", partnerTrendline.getName()))
                .build());
    }

    // =========================================================================
    // 3. KİRACI: TRENDLINE MAĞAZACILIK & E-TİCARET A.Ş. (Perakendeci)
    // =========================================================================
    private void seedTrendlinePerakende() {
        Category catReyon = categoryRepository.save(Category.builder().name("AVM Mağaza Reyon Ürünleri").code("KAT-REYON").description("Fiziki mağaza vitrin ve reyon stoğu").build());
        Category catOnline = categoryRepository.save(Category.builder().name("E-Ticaret & Pazaryeri Stoğu").code("KAT-ONLINE").description("Trendyol ve web sitesi için ayrılmış stoklar").build());

        // Ürün 1: Vogue Collection Erkek Gömlek (Reyon Stoğu)
        Product prodReyonGomlek = Product.builder()
                .name("Vogue Collection Slim Oxford Erkek Gömlek")
                .code("PRD-TRD-01")
                .category(catReyon)
                .baseUnit("ADET")
                .taxRate(new BigDecimal("10.00"))
                .description("Vogue Hazır Giyim üretimi, mağaza ve reyon barkodlu gömlek.")
                .attributes(Map.of("tedarikciMarka", "Vogue Hazır Giyim", "barkodTipi", "EAN-13"))
                .build();

        ProductVariant varReyonM = ProductVariant.builder()
                .sku("TRD-OXF-BLU-M").barcode("868000300101").variantName("M / Açık Mavi - Reyon")
                .purchasePrice(new BigDecimal("480.00")).salePrice(new BigDecimal("890.00"))
                .stockQuantity(60).reservedStock(5).attributes(Map.of("renk", "Açık Mavi", "beden", "M"))
                .build();
        ProductVariant varReyonL = ProductVariant.builder()
                .sku("TRD-OXF-BLU-L").barcode("868000300102").variantName("L / Açık Mavi - Reyon")
                .purchasePrice(new BigDecimal("480.00")).salePrice(new BigDecimal("890.00"))
                .stockQuantity(40).reservedStock(0).attributes(Map.of("renk", "Açık Mavi", "beden", "L"))
                .build();
        prodReyonGomlek.addVariant(varReyonM);
        prodReyonGomlek.addVariant(varReyonL);
        productRepository.save(prodReyonGomlek);

        // Ürün 2: Vogue Collection Denim Jean (Reyon Stoğu)
        Product prodReyonJean = Product.builder()
                .name("Vogue Collection Likralı Denim Pantolon")
                .code("PRD-TRD-02")
                .category(catReyon)
                .baseUnit("ADET")
                .taxRate(new BigDecimal("10.00"))
                .description("Vogue üretimi taşlanmış likralı jean pantolon.")
                .attributes(Map.of("tedarikciMarka", "Vogue Hazır Giyim", "sezon", "2026 İlkbahar"))
                .build();

        ProductVariant varReyonJea32 = ProductVariant.builder()
                .sku("TRD-JEA-IND-32").barcode("868000300201").variantName("32/32 / İndigo - Reyon")
                .purchasePrice(new BigDecimal("680.00")).salePrice(new BigDecimal("1290.00"))
                .stockQuantity(50).reservedStock(10).attributes(Map.of("renk", "İndigo", "beden", "32/32"))
                .build();
        prodReyonJean.addVariant(varReyonJea32);
        productRepository.save(prodReyonJean);

        // Depolar (Trendline Çoklu Depoları: E-Ticaret Dağıtım & AVM Reyon)
        Warehouse whTrdIkitelli = warehouseRepository.save(Warehouse.builder()
                .code("WH-TRD-01")
                .name("İkitelli Ana E-Ticaret & Lojistik Merkezi")
                .location("İstanbul / İkitelli OSB")
                .address("Trikotajcılar Sitesi No:100 İkitelli/Başakşehir")
                .isActive(true)
                .build());

        Warehouse whTrdForum = warehouseRepository.save(Warehouse.builder()
                .code("WH-TRD-02")
                .name("Marmara Forum AVM Mağaza Deposu")
                .location("İstanbul / Bakırköy")
                .address("Marmara Forum AVM -2. Kat Mağaza Deposu")
                .isActive(true)
                .build());

        // Stok Dağılımı
        createWarehouseStock(whTrdIkitelli, varReyonM, 40, 5, "ANA-01");
        createWarehouseStock(whTrdForum, varReyonM, 20, 0, "AVM-01");
        recordInitialMovement(whTrdIkitelli, varReyonM, 40, "SM-2026-TRD-001");

        createWarehouseStock(whTrdIkitelli, varReyonL, 25, 0, "ANA-02");
        createWarehouseStock(whTrdForum, varReyonL, 15, 0, "AVM-02");

        createWarehouseStock(whTrdIkitelli, varReyonJea32, 35, 10, "ANA-03");
        createWarehouseStock(whTrdForum, varReyonJea32, 15, 0, "AVM-03");

        // Cari Hesaplar
        BusinessPartner partnerVogue = businessPartnerRepository.save(BusinessPartner.builder()
                .name("Vogue Hazır Giyim & Konfeksiyon Ltd.")
                .companyTitle("Vogue Hazır Giyim Sanayi ve Ticaret Ltd. Şti.")
                .partnerType(PartnerType.SUPPLIER)
                .taxNumber("3210459821").taxOffice("Konak VD")
                .email("kurumsal@voguegiyim.com.tr").phone("+90 232 444 88 00")
                .address("Organize Sanayi Bölgesi 2. Cadde No:14 İzmir")
                .metadata(Map.of("iliskiliKiraci", "tenant_moda", "anaGiyimTedarikcisi", true))
                .build());

        BusinessPartner partnerTrendyol = businessPartnerRepository.save(BusinessPartner.builder()
                .name("Trendyol Pazaryeri & E-Ticaret A.Ş.")
                .companyTitle("DSM Grup Danışmanlık İletişim ve Satış Tic. A.Ş.")
                .partnerType(PartnerType.BOTH)
                .taxNumber("7788990011").taxOffice("Maslak VD")
                .email("entegrasyon@trendyol.com").phone("+90 212 331 02 00")
                .address("Büyükdere Cad. No:199 Spine Tower Maslak, İstanbul")
                .metadata(Map.of("komisyonOrani", "%18", "kanal", "Pazaryeri"))
                .build());

        // B2B Satınalma Teklifi (Vogue'dan giyim siparişi teklif talebi)
        Quotation quoteFromVogue = Quotation.builder()
                .quotationNumber("QT-2026-TRD-001")
                .type(QuotationType.PURCHASE)
                .partner(partnerVogue)
                .status(QuotationStatus.ACCEPTED)
                .issueDate(OffsetDateTime.now().minusDays(6))
                .validUntil(OffsetDateTime.now().plusDays(10))
                .currency("TRY")
                .subtotalAmount(new BigDecimal("72000.00"))
                .taxAmount(new BigDecimal("7200.00"))
                .totalAmount(new BigDecimal("79200.00"))
                .notes("Vogue Hazır Giyim'den yeni sezon mağaza alımı.")
                .build();
        quoteFromVogue.addItem(QuotationItem.builder().variant(varReyonM).description("Vogue Oxford Gömlek (M)").quantity(60).unitPrice(new BigDecimal("480.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("31680.00")).build());
        quotationRepository.save(quoteFromVogue);

        // Satınalma Siparişi (Vogue'a resmi satınalma siparişi)
        Order purchaseOrderToVogue = Order.builder()
                .orderNumber("SIP-ALS-2026-TRD-001")
                .orderType(OrderType.PURCHASE_ORDER)
                .partner(partnerVogue)
                .quotationId(quoteFromVogue.getId())
                .status(OrderStatus.CONFIRMED)
                .orderDate(OffsetDateTime.now().minusDays(3))
                .currency("TRY")
                .subtotalAmount(new BigDecimal("72000.00"))
                .taxAmount(new BigDecimal("7200.00"))
                .totalAmount(new BigDecimal("79200.00"))
                .notes("Vogue'a resmi sipariş iletildi. İrsaliye bekleniyor.")
                .build();
        purchaseOrderToVogue.addItem(OrderItem.builder().variant(varReyonM).description("Vogue Oxford Gömlek (M)").quantity(60).unitPrice(new BigDecimal("480.00")).taxRate(new BigDecimal("10.00")).subtotal(new BigDecimal("31680.00")).build());
        orderRepository.save(purchaseOrderToVogue);

        // Mağaza Dağıtım İrsaliyesi (Marmara Forum AVM Mağazası Dağıtımı)
        Waybill storeWaybill = Waybill.builder()
                .waybillNumber("IRS-SVK-2026-TRD-001")
                .type(WaybillType.DISPATCH)
                .partner(partnerVogue)
                .orderId(purchaseOrderToVogue.getId())
                .sourceWarehouse(whTrdIkitelli)
                .targetWarehouse(whTrdForum)
                .status(WaybillStatus.DISPATCHED)
                .dispatchDate(OffsetDateTime.now().minusDays(1))
                .carrierCompany("Trendline Filo Taşımacılık")
                .vehiclePlate("34 TRD 777")
                .notes("Marmara Forum Trendline Mağazası Reyon Takviyesi - 3 koli gömlek.")
                .build();
        storeWaybill.addItem(WaybillItem.builder().variant(varReyonM).description("Vogue Oxford Gömlek (M)").quantity(30).unitPrice(new BigDecimal("480.00")).build());
        waybillRepository.save(storeWaybill);

        auditLogRepository.save(AuditLog.builder()
                .action("ORDER_CONFIRMED")
                .entityType("Order")
                .entityId(purchaseOrderToVogue.getId())
                .performedBy("admin")
                .details(Map.of("orderNumber", purchaseOrderToVogue.getOrderNumber(), "partner", partnerVogue.getName()))
                .build());
    }

    // =========================================================================
    // 4. KİRACI: AKTAŞ HOLDİNG A.Ş. (ERP Çözüm Ortağı & Teknoloji Holdingi)
    // =========================================================================
    private void seedAktasHolding() {
        Category catDanismanlik = categoryRepository.save(Category.builder().name("Kurumsal ERP & Danışmanlık").code("KAT-AKT-01").description("MiniERP çözüm ortaklığı ve implementasyon").build());
        Category catBulut = categoryRepository.save(Category.builder().name("SaaS Bulut Hizmetleri & Altyapı").code("KAT-AKT-02").description("Yüksek erişilebilirlikli bulut altyapı barındırma").build());

        Product prodErp = Product.builder()
                .name("MiniERP Kurumsal Çözüm Lisansı & Danışmanlık")
                .code("PRD-AKT-01")
                .category(catDanismanlik)
                .baseUnit("AY")
                .taxRate(new BigDecimal("20.00"))
                .description("Çözüm ortaklığı kapsamında aylık ERP platform lisansı ve mimari danışmanlık.")
                .attributes(Map.of("hizmetTipi", "Yazılım & Danışmanlık", "kapsam", "Sınırsız Kullanıcı"))
                .build();

        ProductVariant varErp = ProductVariant.builder()
                .sku("AKT-ERP-LIC-01").barcode("86890001001").variantName("Yıllık Sözleşmeli Kurumsal Lisans Paketi")
                .purchasePrice(new BigDecimal("25000.00")).salePrice(new BigDecimal("75000.00"))
                .stockQuantity(999).reservedStock(0).attributes(Map.of("donem", "Aylık"))
                .build();
        prodErp.addVariant(varErp);
        productRepository.save(prodErp);

        Warehouse whAktas = warehouseRepository.save(Warehouse.builder()
                .code("WH-AKT-01")
                .name("Maslak Genel Merkez & Dijital Hizmetler")
                .location("İstanbul / Maslak")
                .address("Büyükdere Caddesi Aktaş Plaza Kat:24 Maslak / İstanbul")
                .isActive(true)
                .build());

        createWarehouseStock(whAktas, varErp, 999, 0, "DIJITAL-01");
    }
}
