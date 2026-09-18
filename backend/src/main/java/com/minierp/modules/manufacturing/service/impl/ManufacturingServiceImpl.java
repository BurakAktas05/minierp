package com.minierp.modules.manufacturing.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.inventory.entity.ProductVariant;
import com.minierp.modules.inventory.entity.StockMovement;
import com.minierp.modules.inventory.entity.StockMovementType;
import com.minierp.modules.inventory.entity.Warehouse;
import com.minierp.modules.inventory.repository.ProductVariantRepository;
import com.minierp.modules.inventory.repository.StockMovementRepository;
import com.minierp.modules.inventory.repository.WarehouseRepository;
import com.minierp.modules.inventory.service.ProductVariantService;
import com.minierp.modules.manufacturing.dto.*;
import com.minierp.modules.manufacturing.entity.*;
import com.minierp.modules.manufacturing.mapper.BomMapper;
import com.minierp.modules.manufacturing.mapper.WorkOrderMapper;
import com.minierp.modules.manufacturing.repository.BillOfMaterialsRepository;
import com.minierp.modules.manufacturing.repository.WorkOrderRepository;
import com.minierp.modules.manufacturing.service.ManufacturingService;
import com.minierp.modules.inventory.dto.ProductVariantResponse;
import com.minierp.modules.inventory.entity.ProductType;
import com.minierp.modules.inventory.mapper.ProductVariantMapper;
import com.minierp.modules.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ManufacturingServiceImpl implements ManufacturingService {

    private final BillOfMaterialsRepository bomRepository;
    private final WorkOrderRepository workOrderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductVariantService productVariantService;
    private final StockMovementRepository stockMovementRepository;
    private final BomMapper bomMapper;
    private final WorkOrderMapper workOrderMapper;
    private final ProductVariantMapper productVariantMapper;

    @Override
    @Transactional
    public BomDto createBom(CreateBomRequest request) {
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Ürün Varyantı (Mamul)", "id", request.getVariantId()));

        if (variant.getProduct() != null && variant.getProduct().getProductType() == ProductType.SERVICE) {
            throw new BusinessException("Hizmet kartları (lisans/danışmanlık) üretim reçetesi hedef mamulü olamaz!");
        }
        if (variant.getProduct() != null && variant.getProduct().getProductType() == ProductType.RAW_MATERIAL) {
            throw new BusinessException("Hammadde kartları doğrudan üretim reçetesi hedef mamulü olarak seçilemez! (Mamul veya Yarı Mamul seçiniz)");
        }

        String bomCode = request.getBomCode();
        if (bomCode == null || bomCode.isBlank()) {
            bomCode = "BOM-" + variant.getSku() + "-" + System.currentTimeMillis() % 10000;
        }

        if (bomRepository.existsByBomCode(bomCode)) {
            throw new BusinessException("Bu reçete kodu zaten mevcut: " + bomCode);
        }

        BillOfMaterials bom = BillOfMaterials.builder()
                .bomCode(bomCode)
                .name(request.getName())
                .variant(variant)
                .quantity(request.getQuantity() != null ? request.getQuantity() : BigDecimal.ONE)
                .unit(request.getUnit() != null ? request.getUnit() : "ADET")
                .description(request.getDescription())
                .industryType(request.getIndustryType() != null ? request.getIndustryType() : "GENERIC")
                .active(true)
                .metadata(request.getMetadata() != null ? request.getMetadata() : new HashMap<>())
                .build();

        if (request.getItems() != null) {
            for (CreateBomRequest.CreateBomItemRequest itemReq : request.getItems()) {
                ProductVariant compVariant = productVariantRepository.findById(itemReq.getComponentVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sarf Malzemesi", "id", itemReq.getComponentVariantId()));

                if (compVariant.getProduct() != null && compVariant.getProduct().getProductType() == ProductType.SERVICE) {
                    throw new BusinessException("Hizmet kartları (" + compVariant.getVariantName() + ") üretim reçetesi sarfiyat kalemi olamaz!");
                }
                if (compVariant.getProduct() != null && compVariant.getProduct().getProductType() == ProductType.FINISHED_GOOD) {
                    throw new BusinessException("Nihai mamul kartları (" + compVariant.getVariantName() + ") üretim reçetesi sarfiyat kalemi olarak eklenemez! (Hammadde veya Yarı Mamul seçiniz)");
                }

                BomItem item = BomItem.builder()
                        .componentVariant(compVariant)
                        .quantity(itemReq.getQuantity())
                        .unit(itemReq.getUnit() != null ? itemReq.getUnit() : "ADET")
                        .scrapRate(itemReq.getScrapRate() != null ? itemReq.getScrapRate() : BigDecimal.ZERO)
                        .description(itemReq.getDescription())
                        .build();

                bom.addItem(item);
            }
        }

        BillOfMaterials saved = bomRepository.save(bom);
        log.info("Yeni Üretim Reçetesi (BOM) oluşturuldu: Kod={}, Mamul={}, Sektör={}",
                saved.getBomCode(), variant.getVariantName(), saved.getIndustryType());

        return bomMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BomDto> getAllBoms(String industryType) {
        List<BillOfMaterials> boms = (industryType != null && !industryType.isBlank())
                ? bomRepository.findByIndustryType(industryType)
                : bomRepository.findAllWithDetails();
        return bomMapper.toDtoList(boms);
    }

    @Override
    @Transactional(readOnly = true)
    public BomDto getBomById(Long id) {
        BillOfMaterials bom = bomRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Üretim Reçetesi (BOM)", "id", id));
        return bomMapper.toDto(bom);
    }

    @Override
    @Transactional
    public WorkOrderDto createWorkOrder(CreateWorkOrderRequest request) {
        BillOfMaterials bom = bomRepository.findByIdWithDetails(request.getBomId())
                .orElseThrow(() -> new ResourceNotFoundException("Üretim Reçetesi", "id", request.getBomId()));

        Warehouse sourceWh = null;
        if (request.getSourceWarehouseId() != null) {
            sourceWh = warehouseRepository.findById(request.getSourceWarehouseId()).orElse(null);
        }

        Warehouse targetWh = null;
        if (request.getTargetWarehouseId() != null) {
            targetWh = warehouseRepository.findById(request.getTargetWarehouseId()).orElse(null);
        }

        String orderNumber = "WO-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        WorkOrder workOrder = WorkOrder.builder()
                .orderNumber(orderNumber)
                .bom(bom)
                .salesOrderId(request.getSalesOrderId())
                .sourceWarehouse(sourceWh)
                .targetWarehouse(targetWh)
                .plannedQuantity(request.getPlannedQuantity())
                .producedQuantity(BigDecimal.ZERO)
                .status(WorkOrderStatus.PLANNED)
                .priority(request.getPriority() != null ? request.getPriority() : "NORMAL")
                .startDate(request.getStartDate() != null ? request.getStartDate() : OffsetDateTime.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : OffsetDateTime.now().plusDays(7))
                .notes(request.getNotes())
                .metadata(request.getMetadata() != null ? request.getMetadata() : new HashMap<>())
                .build();

        // Reçete çarpanına göre sarfiyat satırlarını oluştur
        BigDecimal multiplier = request.getPlannedQuantity().divide(bom.getQuantity(), 3, BigDecimal.ROUND_HALF_UP);

        for (BomItem bomItem : bom.getItems()) {
            BigDecimal plannedItemQty = bomItem.getQuantity().multiply(multiplier);
            if (bomItem.getScrapRate().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal scrap = plannedItemQty.multiply(bomItem.getScrapRate()).divide(new BigDecimal("100"), 3, BigDecimal.ROUND_HALF_UP);
                plannedItemQty = plannedItemQty.add(scrap);
            }

            WorkOrderItem woItem = WorkOrderItem.builder()
                    .componentVariant(bomItem.getComponentVariant())
                    .plannedQuantity(plannedItemQty)
                    .consumedQuantity(BigDecimal.ZERO)
                    .unit(bomItem.getUnit())
                    .build();

            workOrder.addItem(woItem);
        }

        WorkOrder saved = workOrderRepository.save(workOrder);
        log.info("Yeni Üretim İş Emri oluşturuldu: No={}, BOM={}, Miktar={}",
                saved.getOrderNumber(), bom.getBomCode(), saved.getPlannedQuantity());

        return workOrderMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderDto> getAllWorkOrders(WorkOrderStatus status) {
        List<WorkOrder> orders = (status != null)
                ? workOrderRepository.findByStatus(status)
                : workOrderRepository.findAllWithDetails();
        return workOrderMapper.toDtoList(orders);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderDto getWorkOrderById(Long id) {
        WorkOrder workOrder = workOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("İş Emri", "id", id));
        return workOrderMapper.toDto(workOrder);
    }

    @Override
    @Transactional
    public WorkOrderDto updateWorkOrderStatus(Long id, WorkOrderStatus newStatus) {
        WorkOrder workOrder = workOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("İş Emri", "id", id));

        WorkOrderStatus oldStatus = workOrder.getStatus();
        if (oldStatus == newStatus) {
            return workOrderMapper.toDto(workOrder);
        }

        if (oldStatus == WorkOrderStatus.COMPLETED || oldStatus == WorkOrderStatus.CANCELLED) {
            throw new BusinessException("Tamamlanmış veya iptal edilmiş bir iş emrinin durumu değiştirilemez!");
        }

        // İŞ EMRİ TAMAMLANDIĞINDA: Otomatik hammadde sarfiyatı ve mamul üretimi stok entegrasyonu!
        if (newStatus == WorkOrderStatus.COMPLETED) {
            log.info("İş Emri tamamlanıyor -> Stok sarfiyatı ve mamul girişi yapılıyor: No={}", workOrder.getOrderNumber());

            // 1. Hammadde Stok Ön Kontrolü (Eksi Bakiye Koruması)
            for (WorkOrderItem item : workOrder.getItems()) {
                int consumedAmount = item.getPlannedQuantity().compareTo(BigDecimal.ZERO) > 0
                        ? Math.max(1, (int) Math.ceil(item.getPlannedQuantity().doubleValue()))
                        : 0;
                ProductVariant compVariant = productVariantRepository.findById(item.getComponentVariant().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sarf Malzemesi", "id", item.getComponentVariant().getId()));

                if (compVariant.getStockQuantity() < consumedAmount) {
                    throw new BusinessException(String.format(
                            "Üretim tamamlanamaz! Yetersiz hammadde stoğu: [%s (%s)]. Mevcut Fiili Stok: %d, Gereken Sarfiyat: %d",
                            compVariant.getVariantName(), compVariant.getSku(), compVariant.getStockQuantity(), consumedAmount));
                }
            }

            // 2. Hammaddelerin Stoktan Düşülmesi (Sarfiyat - Goods Issue)
            Long sourceWarehouseId = workOrder.getSourceWarehouse() != null ? workOrder.getSourceWarehouse().getId() : null;
            for (WorkOrderItem item : workOrder.getItems()) {
                int consumedAmount = item.getPlannedQuantity().compareTo(BigDecimal.ZERO) > 0
                        ? Math.max(1, (int) Math.ceil(item.getPlannedQuantity().doubleValue()))
                        : 0;
                item.setConsumedQuantity(item.getPlannedQuantity());

                // Atomik stok düşümü (Eksi bakiye kontrolü servis içinde de garanti altındadır)
                productVariantService.updateStock(item.getComponentVariant().getId(), -consumedAmount, sourceWarehouseId);

                // Stok Hareket Kütüğüne Kaydet
                stockMovementRepository.save(StockMovement.builder()
                        .movementNumber("SM-SRF-" + System.currentTimeMillis() % 100000 + "-" + item.getComponentVariant().getId())
                        .movementType(StockMovementType.GOODS_ISSUE)
                        .sourceWarehouse(workOrder.getSourceWarehouse())
                        .variant(item.getComponentVariant())
                        .quantity(consumedAmount > 0 ? consumedAmount : 1)
                        .referenceType("WORK_ORDER_CONSUMPTION")
                        .referenceId(workOrder.getId())
                        .notes("İş Emri Sarfiyatı: " + workOrder.getOrderNumber())
                        .performedBy("SYSTEM_MFG")
                        .build());
            }

            // 3. Üretilen Mamulün Depoya Girişi (Goods Receipt)
            ProductVariant finishedProduct = workOrder.getBom().getVariant();
            int producedAmount = workOrder.getPlannedQuantity().compareTo(BigDecimal.ZERO) > 0
                    ? Math.max(1, (int) Math.ceil(workOrder.getPlannedQuantity().doubleValue()))
                    : 0;
            Long targetWarehouseId = workOrder.getTargetWarehouse() != null ? workOrder.getTargetWarehouse().getId() : null;
            productVariantService.addPhysicalStock(finishedProduct.getId(), producedAmount, targetWarehouseId);

            stockMovementRepository.save(StockMovement.builder()
                    .movementNumber("SM-URT-" + System.currentTimeMillis() % 100000 + "-" + finishedProduct.getId())
                    .movementType(StockMovementType.GOODS_RECEIPT)
                    .targetWarehouse(workOrder.getTargetWarehouse())
                    .variant(finishedProduct)
                    .quantity(producedAmount)
                    .referenceType("WORK_ORDER_PRODUCTION")
                    .referenceId(workOrder.getId())
                    .notes("İş Emri Üretim Tamamlandı: " + workOrder.getOrderNumber())
                    .performedBy("SYSTEM_MFG")
                    .build());

            workOrder.setProducedQuantity(workOrder.getPlannedQuantity());
            workOrder.setCompletionDate(OffsetDateTime.now());
        }

        workOrder.setStatus(newStatus);
        WorkOrder updated = workOrderRepository.save(workOrder);
        log.info("İş Emri durumu güncellendi: No={}, Eski={}, Yeni={}", updated.getOrderNumber(), oldStatus, newStatus);

        return workOrderMapper.toDto(updated);
    }

    @Override
    public List<SectorTemplateDto> getSectorTemplates() {
        return List.of(
                SectorTemplateDto.builder()
                        .sectorKey("TEXTILE")
                        .name("Tekstil & Hazır Giyim Sanayi")
                        .description("Kumaş dokuma, iplik eğirme, konfeksiyon imalatı ve toptan giyim tedarik zinciri.")
                        .icon("Shirt")
                        .commonUnits(List.of("TOP", "METRE", "ADET", "KG"))
                        .dynamicAttributes(List.of("kumasEni", "iplikNo", "gramajGSM", "renkKodu", "beden", "yikamaTalimati"))
                        .criticalTracking("Renk / Beden Varyantı, Kumaş Eni & Çekme Payı")
                        .sampleBom(Map.of(
                                "mamul", "Klasik Oxford Slim Fit Gömlek (M / Mavi)",
                                "bilesenler", List.of("1.6m Oxford Kumaş Topu", "8 Adet Sedef Düğme", "0.2m Yaka Telası", "120m Dikiş İpliği")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("FOOD_BEVERAGE")
                        .name("Gıda, İçecek & Endüstriyel Fırıncılık")
                        .description("Tarım ürünleri işleme, unlu mamul imalatı, paketleme ve soğuk zincir dağıtımı.")
                        .icon("Utensils")
                        .commonUnits(List.of("KG", "GR", "LITRE", "KOLI", "PALET"))
                        .dynamicAttributes(List.of("sonKullanmaTarihi", "partiLotNo", "saklamaSicakligi", "alerjenUyarisi", "kaloriKcal"))
                        .criticalTracking("SKT (Son Kullanma Tarihi), Parti/Lot Takibi, Soğuk Hava Deposu")
                        .sampleBom(Map.of(
                                "mamul", "Tam Buğday Köy Ekmeği (500 gr)",
                                "bilesenler", List.of("0.35 kg Tam Buğday Unu", "0.22 Litre Su", "0.01 kg Yaş Maya", "0.005 kg Kaya Tuzu")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("AUTOMOTIVE")
                        .name("Otomotiv Yan Sanayi & Yedek Parça")
                        .description("Talaşlı imalat, döküm, montaj sanayi, OEM parça ve aftermarket dağıtım ağı.")
                        .icon("Car")
                        .commonUnits(List.of("ADET", "TAKIM", "SET", "KOLI"))
                        .dynamicAttributes(List.of("oemParcaKodu", "aracMarkaModel", "motorHacmi", "malzemeTuru", "toleransMm"))
                        .criticalTracking("OEM Numarası, Araç Şasi/Model Uyumluluğu, Montaj İş Emri")
                        .sampleBom(Map.of(
                                "mamul", "Ön Havalandırmalı Fren Diski Kiti",
                                "bilesenler", List.of("2 Adet Döküm Fren Diski", "4 Adet Seramik Balata", "1 Takım Klips & Yay", "1 Adet Montaj Kılavuzu")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("FURNITURE")
                        .name("Mobilya, Ahşap & Orman Ürünleri")
                        .description("Kereste işleme, modüler mobilya üretimi, döşeme ve demonte paketleme.")
                        .icon("Armchair")
                        .commonUnits(List.of("ADET", "PLAKA", "METREKARE", "TAKIM"))
                        .dynamicAttributes(List.of("ebatBoyutCm", "ahsapCinsi", "renkKaplama", "kumasTuru", "paketSayisi"))
                        .criticalTracking("Plaka Optimizasyonu (Fire Azaltma), Demonte Koli Barkodu")
                        .sampleBom(Map.of(
                                "mamul", "Ergonomik Ahşap Çalışma Masası (140x70)",
                                "bilesenler", List.of("1 Plaka Meşe Kaplama MDF (18mm)", "4 Adet Elektrostatik Metal Ayak", "16 Adet Minifiks Bağlantı Vidası", "4.2m PVC Kenar Bandı")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("ELECTRONICS")
                        .name("Elektronik & Bilgisayar Donanımı")
                        .description("SMD dizgi, PCB kart montajı, telekomünikasyon ve IoT cihaz üretimi.")
                        .icon("Cpu")
                        .commonUnits(List.of("ADET", "RULO", "SET"))
                        .dynamicAttributes(List.of("seriNo", "macAdresi", "firmwareVersiyon", "calismaGerilimiVolt", "garantiAyi"))
                        .criticalTracking("Tekil Seri Numarası (SN), MAC Adresi, RoHS Uyumu")
                        .sampleBom(Map.of(
                                "mamul", "Endüstriyel Akıllı IoT Sıcaklık Sensörü",
                                "bilesenler", List.of("1 Adet Baskılı Devre Kartı (PCB)", "1 Adet ESP32 Mikrodenetleyici", "1 Adet NTC Termistör", "1 Adet IP67 Plastik Kasa")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("CHEMICAL")
                        .name("Kimya, Boya & Plastik Sanayi")
                        .description("Hammadde harmanlama, reaktör karışımı, reçine, endüstriyel boya ve dolum tesisi.")
                        .icon("FlaskConical")
                        .commonUnits(List.of("LITRE", "KG", "TON", "VARIL"))
                        .dynamicAttributes(List.of("casNumarasi", "tehlikeSinifi", "yogunlukGcm3", "phDegeri", "viskozite"))
                        .criticalTracking("Tehlikeli Madde (ADR) Sınıfı, Kimyasal Formülasyon Reçetesi")
                        .sampleBom(Map.of(
                                "mamul", "Epoksi Zemin Kaplama Astarı (20 Litre Teneke)",
                                "bilesenler", List.of("12 Litre Epoksi Reçine", "4 Litre Poliamid Sertleştirici", "2.5 Litre Aromatik Solvent", "1.5 kg Titanyum Dioksit Pigment")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("CONSTRUCTION")
                        .name("İnşaat, Yapı Market & Hırdavat")
                        .description("Hazır beton, yapı kimyasalları, çelik konstrüksiyon, tesisat ve şantiye tedariği.")
                        .icon("Building")
                        .commonUnits(List.of("TON", "METREKARE", "METRE", "TORBA", "PALET"))
                        .dynamicAttributes(List.of("dayanimSinifi", "capMm", "yanginDayanimi", "santiyeKodu", "hakedisNo"))
                        .criticalTracking("Şantiye Depo Lokasyonu, Kamyon Sevk İrsaliyesi, Tonaj/Kantar")
                        .sampleBom(Map.of(
                                "mamul", "1 m3 C30/37 Hazır Beton",
                                "bilesenler", List.of("350 kg Portland Çimento", "180 Litre Karışım Suyu", "1050 kg İri Mıcır Kırma Taş", "820 kg Kum", "3.5 kg Süper Akışkanlaştırıcı")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("PHARMA_MEDICAL")
                        .name("Sağlık, Medikal & İlaç/Kozmetik")
                        .description("Tıbbi sarf malzeme imalatı, ilaç tabletleme, dermokozmetik krem ve serum üretimi.")
                        .icon("HeartPulse")
                        .commonUnits(List.of("KUTU", "DOZ", "MG", "ML", "ADET"))
                        .dynamicAttributes(List.of("karekodITS", "utsKayitNo", "sterilizasyonTipi", "etkenMaddeOrani", "saklamaKosu"))
                        .criticalTracking("Sağlık Bakanlığı İTS/ÜTS Karekod Takibi, Temiz Oda (GMP) Standardı")
                        .sampleBom(Map.of(
                                "mamul", "Steril Cerrahi Maske (50'li Kutu)",
                                "bilesenler", List.of("1.8m Spunbond Nonwoven Kumaş", "0.9m Meltblown Filtre Kumaşı", "50 Adet Alüminyum Burun Teli", "20m Elastik Kulak Lastiği")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("RETAIL_ECOMMERCE")
                        .name("E-Ticaret, Lojistik & Hızlı Tüketim")
                        .description("Pazaryeri (Trendyol, Amazon) fulfilment, hediye kutulama ve koli paketleme.")
                        .icon("ShoppingBag")
                        .commonUnits(List.of("ADET", "KOLI", "SET", "PAKET"))
                        .dynamicAttributes(List.of("barkodEan13", "kargoDesisi", "pazaryeriSku", "rafAdresi", "ihracatGtip"))
                        .criticalTracking("Hızlı Sipariş Toplama (Pick & Pack), Kargo Desi Hesabı, EAN Barkod")
                        .sampleBom(Map.of(
                                "mamul", "Premium Yılbaşı Hediye Sepeti Kiti",
                                "bilesenler", List.of("1 Adet Hasır Hediye Sepeti", "1 Kutu Filtre Kahve (250g)", "1 Adet Porselen Kupa", "1 Kutu Spesiyal Çikolata", "0.5m Tül & Kurdele")
                        ))
                        .build(),

                SectorTemplateDto.builder()
                        .sectorKey("SERVICE_MAINTENANCE")
                        .name("Teknik Servis, Bakım & Hizmet")
                        .description("Yetkili servisler, makine periyodik bakımı, tesis yönetimi ve işçilik faturalama.")
                        .icon("Wrench")
                        .commonUnits(List.of("SAAT", "ADET", "SEANS", "PAKET"))
                        .dynamicAttributes(List.of("teknisyenAdi", "cihazSeriNo", "arizaKodu", "servisKm", "garantiKapsami"))
                        .criticalTracking("İşçilik Saati + Sarf Edilen Yedek Parça = Hizmet Faturası")
                        .sampleBom(Map.of(
                                "mamul", "10.000 KM Standart Dizel Araç Periyodik Bakım Hizmeti",
                                "bilesenler", List.of("1.5 Saat Usta İşçilik Emeği", "4 Litre 5W-30 Tam Sentetik Motor Yağı", "1 Adet Yağ Filtresi", "1 Adet Polen Filtresi")
                        ))
                        .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getManufacturableVariants() {
        List<com.minierp.modules.inventory.entity.Product> products = productRepository.findByProductTypeInWithVariants(
                List.of(ProductType.FINISHED_GOOD, ProductType.SEMI_FINISHED)
        );
        List<ProductVariant> variants = new ArrayList<>();
        for (com.minierp.modules.inventory.entity.Product p : products) {
            if (p.getVariants() != null) {
                variants.addAll(p.getVariants());
            }
        }
        return productVariantMapper.toResponseList(variants);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getComponentVariants() {
        List<com.minierp.modules.inventory.entity.Product> products = productRepository.findByProductTypeInWithVariants(
                List.of(ProductType.RAW_MATERIAL, ProductType.SEMI_FINISHED)
        );
        List<ProductVariant> variants = new ArrayList<>();
        for (com.minierp.modules.inventory.entity.Product p : products) {
            if (p.getVariants() != null) {
                variants.addAll(p.getVariants());
            }
        }
        return productVariantMapper.toResponseList(variants);
    }
}
