package com.minierp.modules.info.controller;

import com.minierp.core.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MiniERP Sistem Mimarisi, ER Diyagramı ve İşleyiş Bilgilendirme Controller'ı.
 *
 * Uç Noktalar:
 * - GET /bilgilendirme : Statik interaktif ER ve mimari paneline yönlendirir (/er_diagram.html).
 * - GET /api/v1/bilgilendirme : JSON formatında tam veritabanı şeması ve modül detayları.
 */
@RestController
public class BilgilendirmeController {

    @GetMapping("/bilgilendirme")
    public void getBilgilendirmeHtml(HttpServletResponse response) throws IOException {
        response.sendRedirect("/er_diagram.html");
    }

    @GetMapping("/api/v1/bilgilendirme")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBilgilendirmeJson() {
        Map<String, Object> root = new LinkedHashMap<>();

        // Sistem Künyesi
        Map<String, Object> system = new LinkedHashMap<>();
        system.put("name", "MiniERP B2B Kurumsal Kaynak Planlama Sistemi");
        system.put("version", "1.0.0");
        system.put("architecture", "Spring Boot 3.3 + React 18 + PostgreSQL Multi-Tenant");
        system.put("database", "PostgreSQL 16 (Flyway Migrations)");
        system.put("messaging", "RabbitMQ 3.13 / Spring Application Events (Resilient EDA)");
        system.put("multiTenancy", "Schema-per-Tenant");
        root.put("system", system);

        // Tablolar (Master + Tenant)
        List<Map<String, Object>> tables = new ArrayList<>();
        tables.add(createTableMeta("tenants", "public", "Kiracı yönetim tablosu", List.of("id (PK)", "tenant_id (UK)", "schema_name (UK)", "company_name")));
        tables.add(createTableMeta("users", "tenant_*", "Kiracı bazlı kullanıcı kimlik ve yetki", List.of("id (PK)", "username (UK)", "email (UK)", "role", "is_active")));
        tables.add(createTableMeta("audit_logs", "tenant_*", "İşlem denetim günlükleri (JSON diff)", List.of("id (PK)", "action", "entity_type", "entity_id", "performed_by", "details (JSONB)")));
        tables.add(createTableMeta("document_sequences", "tenant_*", "Resmi belge numaratör sayaçları", List.of("id (PK)", "document_type", "prefix", "year", "last_number")));
        tables.add(createTableMeta("categories", "tenant_*", "Ürün kategorileri", List.of("id (PK)", "code (UK)", "name", "description")));
        tables.add(createTableMeta("products", "tenant_*", "Ana ürün şablonları (Product Template)", List.of("id (PK)", "category_id (FK)", "code (UK)", "name", "base_unit", "attributes (JSONB)")));
        tables.add(createTableMeta("product_variants", "tenant_*", "Stok tutulan ürün varyantları (SKU)", List.of("id (PK)", "product_id (FK)", "sku (UK)", "barcode", "purchase_price", "sale_price", "stock_quantity", "reserved_stock")));
        tables.add(createTableMeta("warehouses", "tenant_*", "Çoklu depo tanımları (Lokasyon & Şube)", List.of("id (PK)", "code (UK)", "name", "location", "is_active")));
        tables.add(createTableMeta("warehouse_stocks", "tenant_*", "Depo bazlı varyant stok bakiyeleri", List.of("id (PK)", "warehouse_id (FK)", "variant_id (FK)", "quantity", "reserved_stock", "shelf_location")));
        tables.add(createTableMeta("stock_movements", "tenant_*", "Stok hareket kütüğü (Audit Ledger)", List.of("id (PK)", "movement_number (UK)", "movement_type", "source_warehouse_id (FK)", "target_warehouse_id (FK)", "variant_id (FK)", "quantity", "reference_type")));
        tables.add(createTableMeta("business_partners", "tenant_*", "Cari hesaplar (Müşteri & Tedarikçi)", List.of("id (PK)", "code (UK)", "partner_type", "name", "tax_number", "email", "metadata (JSONB)")));
        tables.add(createTableMeta("quotations", "tenant_*", "B2B Satış/Alış Teklifleri", List.of("id (PK)", "quotation_number (UK)", "partner_id (FK)", "status", "total_amount")));
        tables.add(createTableMeta("quotation_items", "tenant_*", "Teklif kalemleri", List.of("id (PK)", "quotation_id (FK)", "variant_id (FK)", "quantity", "unit_price", "subtotal")));
        tables.add(createTableMeta("orders", "tenant_*", "Resmi siparişler", List.of("id (PK)", "order_number (UK)", "partner_id (FK)", "quotation_id (FK)", "status", "total_amount")));
        tables.add(createTableMeta("order_items", "tenant_*", "Sipariş kalemleri", List.of("id (PK)", "order_id (FK)", "variant_id (FK)", "quantity", "delivered_quantity", "unit_price", "subtotal")));
        tables.add(createTableMeta("waybills", "tenant_*", "Sevk ve alış irsaliyeleri (Depo bağlantılı)", List.of("id (PK)", "waybill_number (UK)", "partner_id (FK)", "source_warehouse_id (FK)", "target_warehouse_id (FK)", "status", "tracking_number")));
        tables.add(createTableMeta("waybill_items", "tenant_*", "İrsaliye sevk kalemleri", List.of("id (PK)", "waybill_id (FK)", "order_item_id (FK)", "variant_id (FK)", "quantity", "unit_price")));
        tables.add(createTableMeta("invoices", "tenant_*", "Resmi Satış & Alış Faturaları", List.of("id (PK)", "invoice_number (UK)", "invoice_type", "partner_id (FK)", "status", "total_amount", "paid_amount", "remaining_amount")));
        tables.add(createTableMeta("invoice_items", "tenant_*", "Fatura satır kalemleri", List.of("id (PK)", "invoice_id (FK)", "variant_id (FK)", "quantity", "unit_price", "tax_rate", "subtotal")));
        tables.add(createTableMeta("payments", "tenant_*", "Tahsilat & Ödeme makbuzları", List.of("id (PK)", "payment_number (UK)", "payment_type", "invoice_id (FK)", "partner_id (FK)", "account_id (FK)", "amount", "status")));
        tables.add(createTableMeta("treasury_accounts", "tenant_*", "Kasa & Banka Hazine Hesapları", List.of("id (PK)", "account_code (UK)", "account_name", "account_type", "currency", "current_balance", "iban")));
        tables.add(createTableMeta("bill_of_materials", "tenant_*", "Üretim Reçeteleri (BOM)", List.of("id (PK)", "bom_code (UK)", "name", "target_variant_id (FK)", "base_quantity", "unit", "industry_type")));
        tables.add(createTableMeta("bom_items", "tenant_*", "Reçete Hammadde Bileşenleri", List.of("id (PK)", "bom_id (FK)", "component_variant_id (FK)", "quantity", "scrap_rate", "sequence_order")));
        tables.add(createTableMeta("work_orders", "tenant_*", "Üretim İş Emirleri", List.of("id (PK)", "order_number (UK)", "bom_id (FK)", "product_variant_id (FK)", "warehouse_id (FK)", "planned_quantity", "status")));
        tables.add(createTableMeta("work_order_items", "tenant_*", "İş Emri Sarfiyat Tüketim Satırları", List.of("id (PK)", "work_order_id (FK)", "component_variant_id (FK)", "required_quantity", "consumed_quantity")));
        root.put("tables", tables);

        // Süreç Akışı (Order-to-Cash & Multi-Warehouse)
        List<String> workflow = List.of(
                "1. Kategori ve Ürün Şablonu (Product) tanımlanır.",
                "2. Ürüne ait stok birimleri olan Varyantlar (ProductVariant - SKU, Barkod, Fiyat) oluşturulur.",
                "3. Çoklu Depo (Warehouse) kartları açılır ve varyant stokları warehouse_stocks üzerinden lokasyon bazında dağıtılır.",
                "4. Cari Hesap (BusinessPartner - Müşteri/Tedarikçi) kaydı açılır.",
                "5. Müşteriye Teklif (Quotation) hazırlanır. Teklif onaylandığında Siparişe dönüştürülür.",
                "6. Sipariş Onaylandığında (CONFIRMED), sistem varyantların reserved_stock miktarını artırarak stok kilitler ve Event yayınlar.",
                "7. Sipariş sevk edilmek üzere İrsaliye'ye (Waybill) dönüştürülür. İrsaliye sevk edildiğinde (DISPATCHED) rezerve stok temizlenir, fiili stok depodan düşülür ve stok hareket kütüğü yazılır.",
                "8. İrsaliye Faturaya dönüştürülür (Invoiced). Fatura carinin borç/alacak bakiyesini günceller.",
                "9. Yapılan tahsilat veya ödeme ile cari bakiye kapatılır.",
                "10. Her operasyon audit_logs tablosunda JSONB veri diff'i ile izlenir."
        );
        root.put("orderToCashWorkflow", workflow);

        // Tanımlı Kiracılar
        List<Map<String, String>> tenants = List.of(
                Map.of("tenantId", "tenant_tekstil", "name", "Atlas Tekstil & Dokuma Sanayi A.Ş.", "schema", "tenant_tekstil"),
                Map.of("tenantId", "tenant_moda", "name", "Vogue Hazır Giyim & Konfeksiyon Ltd.", "schema", "tenant_moda"),
                Map.of("tenantId", "tenant_perakende", "name", "Trendline Mağazacılık & E-Ticaret A.Ş.", "schema", "tenant_perakende")
        );
        root.put("tenants", tenants);

        return ResponseEntity.ok(ApiResponse.success("MiniERP Sistem ve ER Şema Bilgisi", root));
    }

    private Map<String, Object> createTableMeta(String tableName, String schema, String description, List<String> primaryColumns) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("table", tableName);
        map.put("schema", schema);
        map.put("description", description);
        map.put("keyColumns", primaryColumns);
        return map;
    }
}
