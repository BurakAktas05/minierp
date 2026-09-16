package com.minierp.modules.info.controller;

import com.minierp.core.common.response.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MiniERP Sistem Mimarisi, ER Diyagramı ve İşleyiş Bilgilendirme Controller'ı.
 *
 * Uç Noktalar:
 * - GET /bilgilendirme : Tarayıcıda doğrudan açılan interaktif, karanlık modlu ER ve işleyiş paneli (HTML).
 * - GET /api/v1/bilgilendirme : JSON formatında tam veritabanı şeması, modül detayları ve Mermaid kodu.
 */
@RestController
@RequestMapping
public class BilgilendirmeController {

    private static final String MERMAID_ER_DIAGRAM = """
erDiagram
    %% Master Schema (public)
    TENANTS {
        bigint id PK
        varchar tenant_id UK "Kiraci Kodu (tenant_tekstil vb.)"
        varchar schema_name UK "PostgreSQL Sema Adi"
        varchar company_name "Sirket Unvani"
        boolean is_active "Aktiflik Durumu"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    %% Tenant Schema - Stok & Urun
    CATEGORIES {
        bigint id PK
        varchar code UK "Kategori Kodu"
        varchar name "Kategori Adi"
        text description
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK "Kategori Referansi"
        varchar code UK "Urun Kodu"
        varchar name "Urun Adi"
        varchar base_unit "Birim (ADET, METRE vb.)"
        numeric tax_rate "KDV Orani (%)"
        jsonb attributes "Dinamik Ozellikler (Kumas, Sezon vb.)"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    PRODUCT_VARIANTS {
        bigint id PK
        bigint product_id FK "Ana Urun Referansi"
        varchar sku UK "Stok Kodu (SKU)"
        varchar barcode "Barkod"
        varchar variant_name "Varyant Tanimi"
        numeric purchase_price "Alis Fiyati"
        numeric sale_price "Satis Fiyati"
        integer stock_quantity "Toplam Konsolide Stok"
        integer reserved_stock "Toplam Rezerve Stok"
        jsonb attributes "Renk, Beden vb."
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    %% Tenant Schema - Coklu Depo & Stok Yonetimi
    WAREHOUSES {
        bigint id PK
        varchar code UK "Depo Kodu (WH-01)"
        varchar name "Depo Adi"
        varchar location "Lokasyon"
        text address "Acik Adres"
        boolean is_active "Aktiflik"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    WAREHOUSE_STOCKS {
        bigint id PK
        bigint warehouse_id FK "Depo Referansi"
        bigint variant_id FK "Varyant Referansi"
        integer quantity "Depodaki Fiili Stok"
        integer reserved_stock "Rezerve Stok"
        varchar shelf_location "Raf Kodu"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    STOCK_MOVEMENTS {
        bigint id PK
        varchar movement_number UK "Hareket No (SM-...)"
        varchar movement_type "GOODS_RECEIPT / GOODS_ISSUE / TRANSFER / ADJUSTMENT"
        bigint source_warehouse_id FK "Cikis Deposu (Opsiyonel)"
        bigint target_warehouse_id FK "Varis Deposu (Opsiyonel)"
        bigint variant_id FK "Varyant Referansi"
        integer quantity "Hareket Miktari"
        varchar reference_type "WAYBILL / ORDER / INITIAL_STOCK"
        bigint reference_id "Referans Belge ID"
        varchar performed_by "Islemi Yapan"
        timestamp created_at
    }

    %% Tenant Schema - Cari Hesap
    BUSINESS_PARTNERS {
        bigint id PK
        varchar partner_type "CUSTOMER / SUPPLIER / BOTH"
        varchar name "Cari Adi"
        varchar company_title "Resmi Unvan"
        varchar tax_number "Vergi Kimlik No"
        varchar email "E-Posta"
        varchar phone "Telefon"
        text address "Adres"
        jsonb metadata "Ek Bilgiler"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    %% Tenant Schema - Teklif
    QUOTATIONS {
        bigint id PK
        varchar quotation_number UK "Teklif No"
        varchar type "PURCHASE / SALES"
        bigint partner_id FK "Cari Referansi"
        varchar status "DRAFT / SENT / ACCEPTED / REJECTED"
        timestamp issue_date
        timestamp valid_until
        varchar currency
        numeric total_amount "Genel Toplam"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    QUOTATION_ITEMS {
        bigint id PK
        bigint quotation_id FK "Teklif Referansi"
        bigint variant_id FK "Varyant (SKU) Referansi"
        varchar description
        integer quantity "Miktar"
        numeric unit_price "Birim Fiyat"
        numeric subtotal "Kalem Tutari"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    %% Tenant Schema - Siparis
    ORDERS {
        bigint id PK
        varchar order_number UK "Siparis No"
        varchar order_type "SALES_ORDER / PURCHASE_ORDER"
        bigint partner_id FK "Cari Referansi"
        bigint quotation_id FK "Iliskili Teklif (Opsiyonel)"
        varchar status "DRAFT / CONFIRMED / CANCELLED / COMPLETED"
        timestamp order_date
        timestamp delivery_date
        numeric total_amount "Genel Toplam"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK "Siparis Referansi"
        bigint variant_id FK "Varyant (SKU) Referansi"
        varchar description
        integer quantity "Miktar"
        numeric unit_price "Birim Fiyat"
        numeric subtotal "Kalem Tutari"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    %% Tenant Schema - Irsaliye
    WAYBILLS {
        bigint id PK
        varchar waybill_number UK "Irsaliye No"
        varchar type "DISPATCH / RECEIPT"
        bigint partner_id FK "Cari Referansi"
        bigint order_id FK "Iliskili Siparis (Opsiyonel)"
        bigint source_warehouse_id FK "Cikis Deposu (Opsiyonel)"
        bigint target_warehouse_id FK "Varis Deposu (Opsiyonel)"
        varchar status "DRAFT / DISPATCHED / DELIVERED"
        timestamp dispatch_date
        varchar carrier_company "Tasiyici Firma"
        varchar tracking_number "Takip Kodu"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    WAYBILL_ITEMS {
        bigint id PK
        bigint waybill_id FK "Irsaliye Referansi"
        bigint variant_id FK "Varyant (SKU) Referansi"
        varchar description
        integer quantity "Sevk Miktari"
        numeric unit_price "Birim Fiyat"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    %% Tenant Schema - Guvenlik & Denetim
    USERS {
        bigint id PK
        varchar username UK "Kullanici Adi"
        varchar email UK "E-Posta"
        varchar password_hash "Sifre Ozeti (BCrypt)"
        varchar full_name "Ad Soyad"
        varchar role "ROLE_ADMIN / ROLE_USER"
        boolean is_active "Aktiflik"
        timestamp created_at
        timestamp updated_at
        bigint version
    }

    AUDIT_LOGS {
        bigint id PK
        varchar action "CREATE / UPDATE / DELETE / STATUS_CHANGE"
        varchar entity_type "Varlik Tipi"
        bigint entity_id "Varlik ID"
        varchar performed_by "Islemi Yapan Kullanici"
        jsonb details "Islem JSON Differentiator"
        timestamp performed_at
    }

    %% Iliskiler
    CATEGORIES ||--o{ PRODUCTS : "icerir (1:N)"
    PRODUCTS ||--|{ PRODUCT_VARIANTS : "varyantlari (1:N)"
    WAREHOUSES ||--o{ WAREHOUSE_STOCKS : "stok_barindirir (1:N)"
    PRODUCT_VARIANTS ||--o{ WAREHOUSE_STOCKS : "depolara_dagilir (1:N)"
    PRODUCT_VARIANTS ||--o{ STOCK_MOVEMENTS : "hareket_gorur (1:N)"
    WAREHOUSES |o--o{ STOCK_MOVEMENTS : "cikis_yapar (0..1:N)"
    WAREHOUSES |o--o{ STOCK_MOVEMENTS : "giris_alir (0..1:N)"
    BUSINESS_PARTNERS ||--o{ QUOTATIONS : "teklif verilir (1:N)"
    BUSINESS_PARTNERS ||--o{ ORDERS : "siparis verilir (1:N)"
    BUSINESS_PARTNERS ||--o{ WAYBILLS : "sevk edilir (1:N)"
    WAREHOUSES |o--o{ WAYBILLS : "cikis_deposu (0..1:N)"
    WAREHOUSES |o--o{ WAYBILLS : "varis_deposu (0..1:N)"
    QUOTATIONS ||--|{ QUOTATION_ITEMS : "satirlari (1:N)"
    PRODUCT_VARIANTS ||--o{ QUOTATION_ITEMS : "secilir (1:N)"
    QUOTATIONS |o--o{ ORDERS : "donusturulur (0..1:N)"
    ORDERS ||--|{ ORDER_ITEMS : "satirlari (1:N)"
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : "siparis edilir (1:N)"
    ORDERS |o--o{ WAYBILLS : "irsaliyeye donusturulur (0..1:N)"
    WAYBILLS ||--|{ WAYBILL_ITEMS : "sevk satirlari (1:N)"
    PRODUCT_VARIANTS ||--o{ WAYBILL_ITEMS : "sevk edilir (1:N)"
""";

    @GetMapping(value = "/bilgilendirme", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getBilgilendirmeHtml() {
        String html = """
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MiniERP - Sistem Mimarisi & ER Diyagrami</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg-main: #0a0f1d;
      --bg-card: rgba(15, 23, 42, 0.85);
      --border: rgba(51, 65, 85, 0.6);
      --primary: #38bdf8;
      --primary-glow: rgba(56, 189, 248, 0.25);
      --secondary: #818cf8;
      --accent: #34d399;
      --warning: #fbbf24;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: radial-gradient(circle at 50% 0%, #172554 0%, #0a0f1d 70%);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.6;
    }
    header {
      padding: 24px 40px;
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
      background: rgba(10, 15, 29, 0.7);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: #030712;
    }
    .header-title { display: flex; align-items: center; gap: 14px; }
    h1 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
    .status-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--accent);
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 4px 12px;
      border-radius: 999px;
    }
    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      gap: 36px;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .glass-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
    }
    .card:hover {
      border-color: var(--primary);
      box-shadow: 0 8px 24px var(--primary-glow);
      transform: translateY(-2px);
    }
    .card h3 {
      color: var(--primary);
      font-size: 1.05rem;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card p {
      font-size: 0.88rem;
      color: var(--text-muted);
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 14px;
    }
    .tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      color: var(--primary);
    }
    .workflow-step {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      color: #030712;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .step-body h4 { font-size: 0.95rem; margin-bottom: 4px; color: #fff; }
    .step-body p { font-size: 0.85rem; color: var(--text-muted); }
    .diagram-container {
      background: #090e1a;
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 12px;
      padding: 0;
      overflow: hidden;
      height: 720px;
      position: relative;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
    }
    .diagram-container.grabbing {
      cursor: grabbing;
    }
    .pan-zoom-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      will-change: transform;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .pan-zoom-canvas.animate {
      transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    pre.mermaid {
      margin: auto;
      pointer-events: none;
    }
    pre.mermaid svg {
      max-width: none !important;
      pointer-events: none;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .tool-btn {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .tool-btn:hover {
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
    }
    .zoom-level {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      color: var(--accent);
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.25);
      padding: 4px 10px;
      border-radius: 6px;
    }
    .pan-hint {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .api-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      padding: 8px 14px;
      background: rgba(2, 6, 23, 0.8);
      border: 1px solid var(--border);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .method {
      background: var(--accent);
      color: #030712;
      font-weight: 700;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .faq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 20px;
    }
    .faq-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.25s ease;
    }
    .faq-card:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 25px var(--primary-glow);
      transform: translateY(-2px);
    }
    .faq-q {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .faq-a {
      font-size: 0.9rem;
      color: #cbd5e1;
      line-height: 1.65;
    }
    .faq-highlight {
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid var(--primary);
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      margin-top: 6px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <header>
    <div class="header-title">
      <span class="badge">MiniERP</span>
      <h1>Sistem Mimarisi & Veritabanı ER Modeli</h1>
    </div>
    <div class="status-pill">● API Yayında / Spring Boot 3.3</div>
  </header>

  <main>
    <!-- ER Diyagramı -->
    <div>
      <h2 class="section-title">📊 1. Veritabanı Varlık-İlişki (ER) Diyagramı</h2>
      <div class="glass-box">
        <div class="toolbar">
          <button class="tool-btn" onclick="zoomIn()">🔍 Yakınlaştır (+)</button>
          <button class="tool-btn" onclick="zoomOut()">🔍 Uzaklaştır (-)</button>
          <button class="tool-btn" onclick="resetZoom()">↺ Sıfırla (100%)</button>
          <span class="zoom-level" id="zoomLevelIndicator">100%</span>
          <span class="pan-hint">🖱️ Tıkla & Sürükle | ⚙️ Fare Tekerleğiyle Yakınlaştır</span>
        </div>
        <div class="diagram-container" id="diagramWrapper">
          <div id="panZoomCanvas" class="pan-zoom-canvas">
            <pre class="mermaid" id="mermaidGraph">
""" + MERMAID_ER_DIAGRAM + """
            </pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Sistem İşleyişi (Order-to-Cash) -->
    <div>
      <h2 class="section-title">⚡ 2. B2B İşletme Süreç Akışı (Order-to-Cash)</h2>
      <div class="glass-box">
        <div class="workflow-step">
          <div class="step-num">1</div>
          <div class="step-body">
            <h4>Cari ve Ürün Tanımlama</h4>
            <p>Müşteri/Tedarikçi kartları <code>business_partners</code> tablosunda oluşturulur. Ana ürün kartları ve dinamik renk/beden niteliklerine sahip SKU'lar (<code>product_variants</code>) tanımlanır.</p>
          </div>
        </div>
        <div class="workflow-step">
          <div class="step-num">2</div>
          <div class="step-body">
            <h4>Teklif (Quotation) Oluşturma & Mutabakat</h4>
            <p>Müşteriye teklif iletilir (<code>quotations</code> & <code>quotation_items</code>). Durum <code>ACCEPTED</code> olduğunda tek tıkla resmi siparişe dönüştürülebilir.</p>
          </div>
        </div>
        <div class="workflow-step">
          <div class="step-num">3</div>
          <div class="step-body">
            <h4>Sipariş Onayı & Otomatik Stok Rezervasyonu</h4>
            <p>Sipariş onaylandığında (<code>status = CONFIRMED</code>), <code>OrderService</code> devreye girer. Siparişteki her ürün varyantı için depoda yeterli stok olup olmadığı kontrol edilir ve varyantın <code>reserved_stock</code> alanı artırılarak çift sipariş (over-selling) engellenir. Bu işlem RabbitMQ (<code>order.confirmed</code>) kuyruğuna asenkron event fırlatır.</p>
          </div>
        </div>
        <div class="workflow-step">
          <div class="step-num">4</div>
          <div class="step-body">
            <h4>İrsaliye (Waybill), Çıkış Deposu & Stok Hareket Kütüğü (Stock Movement)</h4>
            <p>Sipariş sevk edildiğinde <code>waybills</code> oluşturulur, çıkış deposu (<code>source_warehouse_id</code>) belirlenir. İrsaliye sevk edildiğinde (<code>status = DISPATCHED</code>), ilgili depodaki <code>warehouse_stocks.quantity</code> ve varyantın konsolide <code>stock_quantity</code> miktarı düşürülür. Eş zamanlı olarak <code>stock_movements</code> tablosuna kurumsal denetim kütüğü (<code>GOODS_ISSUE</code>) yazılır.</p>
          </div>
        </div>
        <div class="workflow-step">
          <div class="step-num">5</div>
          <div class="step-body">
            <h4>İzlenebilirlik & Audit Logging</h4>
            <p>Tüm CRUD ve durum değişiklikleri <code>audit_logs</code> tablosunda işlem yapan kullanıcı adı ve JSONB veri diff'i ile kaydedilir.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modüller -->
    <div>
      <h2 class="section-title">🧱 3. Temel Mimari Bileşenleri</h2>
      <div class="grid-3">
        <div class="card">
          <h3>🏬 Schema-per-Tenant</h3>
          <p>Her kiracı işletme için PostgreSQL üzerinde bağımsız bir şema (<code>tenant_tekstil</code>, <code>tenant_moda</code> vb.) açılır. Veri tabanı seviyesinde tam izolasyon sağlanır.</p>
          <div class="tags">
            <span class="tag">PostgreSQL 16</span>
            <span class="tag">Flyway</span>
            <span class="tag">Hibernate Multi-Tenant</span>
          </div>
        </div>

        <div class="card">
          <h3>📬 RabbitMQ Olay Güdümlü Mimari</h3>
          <p>Sipariş onaylama ve iptal olayları <code>minierp.events.exchange</code> üzerinden RabbitMQ'ya iletilir. Stok servisleri asenkron olarak bu olayları tüketir.</p>
          <div class="tags">
            <span class="tag">RabbitMQ 3.13</span>
            <span class="tag">AMQP</span>
            <span class="tag">Asynchronous</span>
          </div>
        </div>

        <div class="card">
          <h3>🔐 Güvenlik & Yetkilendirme</h3>
          <p>Stateless JWT kimlik doğrulaması. Token içinde <code>tenantId</code> ve <code>role</code> (ROLE_ADMIN, ROLE_MANAGER, ROLE_USER) taşınır. RBAC denetimi aktiftir.</p>
          <div class="tags">
            <span class="tag">Spring Security 6</span>
            <span class="tag">JWT (HMAC-SHA256)</span>
            <span class="tag">BCrypt</span>
          </div>
        </div>

        <div class="card">
          <h3>📦 Çoklu Depo & Stok Hareket Kütüğü (Ledger)</h3>
          <p>Her kiracı için çoklu depo (<code>warehouses</code>) desteği. Her varyantın depo bazlı bakiyesi (<code>warehouse_stocks</code>) ve tüm mal giriş/çıkış/transfer işlemlerinin izlenebilir kütüğü (<code>stock_movements</code>) tutulur.</p>
          <div class="tags">
            <span class="tag">Multi-Warehouse</span>
            <span class="tag">Audit Ledger</span>
            <span class="tag">Stock Movements</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mimari & Veritabanı Tasarım Analizi (FAQ) -->
    <div>
      <div class="section-header" style="margin-bottom: 16px;">
        <h2 class="section-title">💡 4. Veritabanı Mimarisi & Tasarım Kararları Derin Analizi</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">ERP Dünyasında Header-Item, Multi-Tenancy ve Cari Hesap Mantığı</p>
      </div>

      <div class="faq-grid">
        <!-- Soru 1 -->
        <div class="faq-card">
          <div class="faq-q">
            <span>📑</span>
            <h4>Neden Orders/OrderItems veya Waybills/WaybillItems Ayrı Tablolardır?</h4>
          </div>
          <div class="faq-a">
            Bu yapı kurumsal ERP sistemlerinin (SAP, Oracle EBS, Microsoft Dynamics) temel taşı olan <strong>Başlık-Kalem (Header-Line / Master-Detail)</strong> desenidir.
            <br><br>
            Bir sipariş veya irsaliyede <strong>Başlık Bilgileri</strong> (tarih, cari hesap, sevk adresi, genel toplam, kargo takip no) yalnızca <strong>1 KEZ</strong> gerçekleşir. Ancak o siparişin içinde 10 veya 100 farklı ürün/kalem bulunabilir (<strong>1:N İlişki</strong>).
          </div>
          <div class="faq-highlight">
            ⚠️ <strong>Anti-Pattern Engelleme:</strong> Kalemler ayrı tabloda olmasaydı; ya <code>urun_1, urun_2...</code> gibi statik sütunlar açılacak, ya her ürün için sipariş başlığı 10 kez tekrarlanacak (veri tekrarı/anomali), ya da JSON içine gömülerek Foreign Key ve DB seviyesi stok kilitleri kaybedilecekti.
          </div>
        </div>

        <!-- Soru 2 -->
        <div class="faq-card">
          <div class="faq-q">
            <span>🏬</span>
            <h4>Tenant (Kiracı) Varken Neden Business Partner (Cari) Tablosu Var?</h4>
          </div>
          <div class="faq-a">
            <strong>Tenant (Kiracı)</strong> ile <strong>Business Partner (Cari Hesap)</strong> tamamen farklı iki soyutlama katmanıdır:
            <br><br>
            • <strong>Tenant (Kiracı)</strong>: Bulut yazılımının (SaaS) abonesidir ve kendi bağımsız PostgreSQL şemasına sahiptir (örn: Atlas Tekstil).
            <br>
            • <strong>Business Partner (Cari)</strong>: O işletmenin günlük hayatta ticaret yaptığı dış dünyadır (müşterileri, tedarikçileri, fason boyahaneleri).
          </div>
          <div class="faq-highlight">
            🎯 <strong>Kritik Gerçek:</strong> Atlas Tekstil'in kumaş sattığı 300 müşterinin veya pamuk aldığı çiftçilerin MiniERP abonesi olması <u>gerekmez</u>. Cari tablosu olmazsa, işletme dış dünyaya fatura kesemez ve borç-alacak takip edemez.
          </div>
        </div>

        <!-- Soru 3 -->
        <div class="faq-card">
          <div class="faq-q">
            <span>👤</span>
            <h4>User Tablosunda Neden İşletme Kolonu Yerine Rol (Role) Var?</h4>
          </div>
          <div class="faq-a">
            Sistemimiz <strong>Schema-per-Tenant</strong> mimarisindedir. Yani <code>users</code> tablosu master şemada değil, <strong>her işletmenin kendi izole PostgreSQL şemasında</strong> (<code>tenant_tekstil.users</code>) yer alır.
            <br><br>
            Bir kullanıcının başka bir firmanın çalışanı olma ihtimali veritabanı seviyesinde fiziksel olarak engellenmiştir.
          </div>
          <div class="faq-highlight">
            🔑 <strong>Rolün Önemi:</strong> İşletme içi yetki dağılımı (RBAC) zorunludur: Şirket Genel Müdürü (<code>ROLE_ADMIN</code>), yüksek tutarlı sipariş onaylayan Satış Müdürü (<code>ROLE_MANAGER</code>) ve depoda sevkiyat okutan Depo Personeli (<code>ROLE_USER</code>).
          </div>
        </div>

        <!-- Soru 4 -->
        <div class="faq-card">
          <div class="faq-q">
            <span>🛡️</span>
            <h4>Veritabanında Hangi Anti-Pattern'ler Tespit Edilip Düzeltildi?</h4>
          </div>
          <div class="faq-a">
            Yapılan kapsamlı mimari incelemede şu kurumsal kısıtlar ve indeksler eklendi:
            <br><br>
            • <strong>Negatif Stok ve Fiyat Engelleme:</strong> <code>stock_quantity >= 0</code>, <code>reserved_stock >= 0</code>, <code>unit_price >= 0</code> CHECK kısıtları eklendi.
            • <strong>Sipariş & İrsaliye Adet Kontrolü:</strong> <code>quantity > 0</code> (eksi adet girilemez).
            • <strong>State Machine Kısıtları:</strong> Durumlar (<code>DRAFT</code>, <code>CONFIRMED</code> vb.) DB seviyesinde CHECK kuralına bağlandı.
            • <strong>FK B-Tree İndeksleri:</strong> Kalem ve cari sorgularını anlık hale getirmek için tüm Foreign Key sütunlarına indeks eklendi.
          </div>
          <div class="faq-highlight">
            ⚡ <strong>Sonuç:</strong> Veritabanı seviyesinde %100 ACID veri bütünlüğü ve sıfır tutarsızlık garantilendi.
          </div>
        </div>

        <!-- Soru 5 -->
        <div class="faq-card">
          <div class="faq-q">
            <span>📦</span>
            <h4>Stoğu Doğrudan Product (Ana Ürün) Kartına Yazmak Mantıklı mı? Neden Varyantta (SKU)?</h4>
          </div>
          <div class="faq-a">
            <strong>Kesinlikle mantıklı değildir ve büyük bir anti-pattern'dir!</strong>
            <br><br>
            • <strong>Fiziksel Gerçeklik:</strong> Depodaki rafta soyut bir <em>"Slim Fit Polo Tişört"</em> bulunmaz; rafta fiziki olarak <em>"Kırmızı - M"</em> veya <em>"Mavi - L"</em> durur.
            <br>
            • <strong>Stok Yönetimi İmkansızlığı:</strong> Stoğu ana ürüne yazarsan "Toplam 100 tişört var" dersin ama müşteri "2 adet Kırmızı M" istediğinde rafta var mı bilemezsin. Farklı varyantların barkodları, alış/satış fiyatları ve stokları farklıdır.
          </div>
          <div class="faq-highlight">
            📊 <strong>Bakiye (Snapshot) vs Hareket (Ledger):</strong> Varyantta <code>stock_quantity</code> tutmak, O(1) hızında "Stok yeterli mi?" kontrolü ve satır bazlı pessimistic lock için zorunludur. Çok depolu ERP yapılarında ise bu bakiye <code>warehouse_stocks (depo_id, varyant_id, bakiye)</code> tablosuna taşınır.
          </div>
        </div>

        <!-- Soru 6 -->
        <div class="faq-card">
          <div class="faq-q">
            <span>🏢</span>
            <h4>Çoklu Depo (Multi-Warehouse) ve Stok Hareket Kütüğü (Ledger) Mimarisi Nasıl Çalışır?</h4>
          </div>
          <div class="faq-a">
            İşletmenin birden fazla lokasyonu (Merkez Depo, AVM Mağaza Deposu, Lojistik Üssü) olduğunda stok yönetimi 3 seviyede ölçeklenir:
            <br><br>
            • <strong>1. Depo Tanımları (<code>warehouses</code>):</strong> Her deponun kodu, yetkilisi ve fiziksel adresi tanımlanır.
            <br>
            • <strong>2. Depo-Varyant Bakiyesi (<code>warehouse_stocks</code>):</strong> Her varyantın hangi depoda kaç adet fiili stoğu ve bekleyen rezerve stoğu olduğu saklanır (M:N ilişki).
            <br>
            • <strong>3. Kurumsal Stok Kütüğü (<code>stock_movements</code>):</strong> Depolar arası transfer (virman), mal kabul, sevk irsaliyesi veya sayım farkı yapıldığında hareket türü, çıkış ve varış deposuyla birlikte silinemez bir audit log olarak kaydedilir.
          </div>
          <div class="faq-highlight">
            🚀 <strong>Ölçeklenebilirlik:</strong> Hem tek tıkla "Merkez depoda kaç adet kaldı?" sorusuna yanıt verilir hem de geriye dönük konsolide toplam bakiye (<code>product_variants.stock_quantity</code>) korunarak mevcut API ve dashboardlar kesintisiz çalışır.
          </div>
        </div>
      </div>
    </div>

    <!-- API Bilgisi -->
    <div>
      <h2 class="section-title">🔌 5. JSON API Uç Noktası</h2>
      <div class="glass-box">
        <p style="margin-bottom: 12px; color: var(--text-muted);">Bu sistem bilgilerini, tablo şemalarını ve Mermaid diyagram kodunu programmatic olarak JSON formatında tüketebilirsiniz:</p>
        <div class="api-pill">
          <span class="method">GET</span>
          <code>/api/v1/bilgilendirme</code>
        </div>
      </div>
    </div>
  </main>

  <script>
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const container = document.getElementById('diagramWrapper');
    const canvas = document.getElementById('panZoomCanvas');
    const zoomIndicator = document.getElementById('zoomLevelIndicator');

    function updateTransform(animate = false) {
      if (animate) {
        canvas.classList.add('animate');
      } else {
        canvas.classList.remove('animate');
      }
      canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      if (zoomIndicator) {
        zoomIndicator.textContent = Math.round(scale * 100) + '%';
      }
    }

    function zoomIn() {
      scale = Math.min(scale * 1.25, 4);
      updateTransform(true);
    }

    function zoomOut() {
      scale = Math.max(scale / 1.25, 0.25);
      updateTransform(true);
    }

    function resetZoom() {
      scale = 1;
      translateX = 0;
      translateY = 0;
      updateTransform(true);
    }

    // 1. Mouse ile Sürükleme (Drag & Pan)
    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Sol tık
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      container.classList.add('grabbing');
      canvas.classList.remove('animate');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('grabbing');
      }
    });

    // 2. Fare Tekerleği ile İmlece Doğru Yakınlaştırma
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.25), 4);

      translateX = mouseX - (mouseX - translateX) * (newScale / scale);
      translateY = mouseY - (mouseY - translateY) * (newScale / scale);
      scale = newScale;
      updateTransform(false);
    }, { passive: false });

    // 3. Dokunmatik Ekran Desteği
    let initialPinchDist = null;
    let initialTouchScale = 1;
    let touchStartX = 0;
    let touchStartY = 0;

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStartX = e.touches[0].clientX - translateX;
        touchStartY = e.touches[0].clientY - translateY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialTouchScale = scale;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        translateX = e.touches[0].clientX - touchStartX;
        translateY = e.touches[0].clientY - touchStartY;
        updateTransform(false);
      } else if (e.touches.length === 2 && initialPinchDist) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / initialPinchDist;
        scale = Math.min(Math.max(initialTouchScale * factor, 0.25), 4);
        updateTransform(false);
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      isDragging = false;
      initialPinchDist = null;
    }, { passive: true });

    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0a0f1d',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#38bdf8',
        secondaryColor: '#0f172a',
        tertiaryColor: '#1e1b4b'
      },
      er: { useMaxWidth: false }
    });
  </script>
</body>
</html>
""";
        return ResponseEntity.ok(html);
    }

    @GetMapping(value = "/api/v1/bilgilendirme", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBilgilendirmeJson() {
        Map<String, Object> root = new LinkedHashMap<>();

        // Sistem Bilgileri
        Map<String, Object> system = new LinkedHashMap<>();
        system.put("name", "MiniERP");
        system.put("version", "1.0.0");
        system.put("framework", "Spring Boot 3.3.4 (Java 21)");
        system.put("database", "PostgreSQL 16 (Flyway Migrations)");
        system.put("messaging", "RabbitMQ 3.13 (AMQP)");
        system.put("multiTenancy", "Schema-per-Tenant");
        root.put("system", system);

        // Tablolar
        List<Map<String, Object>> tables = new ArrayList<>();
        tables.add(createTableMeta("tenants", "public", "Kiracı yönetim tablosu", List.of("id (PK)", "tenant_id (UK)", "schema_name (UK)", "company_name")));
        tables.add(createTableMeta("categories", "tenant_*", "Ürün kategorileri", List.of("id (PK)", "code (UK)", "name", "description")));
        tables.add(createTableMeta("products", "tenant_*", "Ana ürün şablonları (Product Template)", List.of("id (PK)", "category_id (FK)", "code (UK)", "name", "base_unit", "attributes (JSONB)")));
        tables.add(createTableMeta("product_variants", "tenant_*", "Stok tutulan ürün varyantları (SKU)", List.of("id (PK)", "product_id (FK)", "sku (UK)", "barcode", "purchase_price", "sale_price", "stock_quantity", "reserved_stock")));
        tables.add(createTableMeta("warehouses", "tenant_*", "Çoklu depo tanımları (Lokasyon & Şube)", List.of("id (PK)", "code (UK)", "name", "location", "is_active")));
        tables.add(createTableMeta("warehouse_stocks", "tenant_*", "Depo bazlı varyant stok bakiyeleri", List.of("id (PK)", "warehouse_id (FK)", "variant_id (FK)", "quantity", "reserved_stock", "shelf_location")));
        tables.add(createTableMeta("stock_movements", "tenant_*", "Stok hareket kütüğü (Audit Ledger)", List.of("id (PK)", "movement_number (UK)", "movement_type", "source_warehouse_id (FK)", "target_warehouse_id (FK)", "variant_id (FK)", "quantity", "reference_type")));
        tables.add(createTableMeta("business_partners", "tenant_*", "Cari hesaplar (Müşteri & Tedarikçi)", List.of("id (PK)", "partner_type", "name", "tax_number", "email", "metadata (JSONB)")));
        tables.add(createTableMeta("quotations", "tenant_*", "B2B Satış/Alış Teklifleri", List.of("id (PK)", "quotation_number (UK)", "partner_id (FK)", "status", "total_amount")));
        tables.add(createTableMeta("quotation_items", "tenant_*", "Teklif kalemleri", List.of("id (PK)", "quotation_id (FK)", "variant_id (FK)", "quantity", "unit_price", "subtotal")));
        tables.add(createTableMeta("orders", "tenant_*", "Resmi siparişler", List.of("id (PK)", "order_number (UK)", "partner_id (FK)", "quotation_id (FK)", "status", "total_amount")));
        tables.add(createTableMeta("order_items", "tenant_*", "Sipariş kalemleri", List.of("id (PK)", "order_id (FK)", "variant_id (FK)", "quantity", "unit_price", "subtotal")));
        tables.add(createTableMeta("waybills", "tenant_*", "Sevk ve alış irsaliyeleri (Depo bağlantılı)", List.of("id (PK)", "waybill_number (UK)", "partner_id (FK)", "source_warehouse_id (FK)", "target_warehouse_id (FK)", "status", "tracking_number")));
        tables.add(createTableMeta("waybill_items", "tenant_*", "İrsaliye sevk kalemleri", List.of("id (PK)", "waybill_id (FK)", "variant_id (FK)", "quantity", "unit_price")));
        tables.add(createTableMeta("users", "tenant_*", "Kiracı bazlı kullanıcı kimlik ve yetki", List.of("id (PK)", "username (UK)", "email (UK)", "role", "is_active")));
        tables.add(createTableMeta("audit_logs", "tenant_*", "İşlem denetim günlükleri (JSON diff)", List.of("id (PK)", "action", "entity_type", "entity_id", "performed_by", "details (JSONB)")));
        root.put("tables", tables);

        // Süreç Akışı (Order-to-Cash & Multi-Warehouse)
        List<String> workflow = List.of(
                "1. Kategori ve Ürün Şablonu (Product) tanımlanır.",
                "2. Ürüne ait stok birimleri olan Varyantlar (ProductVariant - SKU, Barkod, Fiyat) oluşturulur.",
                "3. Çoklu Depo (Warehouse) kartları açılır ve varyant stokları warehouse_stocks üzerinden lokasyon bazında dağıtılır.",
                "4. Cari Hesap (BusinessPartner - Müşteri/Tedarikçi) kaydı açılır.",
                "5. Müşteriye Teklif (Quotation) hazırlanır. Teklif onaylandığında Siparişe dönüştürülür.",
                "6. Sipariş Onaylandığında (CONFIRMED), sistem varyantların reserved_stock miktarını artırarak stok kilitler ve RabbitMQ event yayınlar.",
                "7. Sipariş sevk edilmek üzere İrsaliye'ye (Waybill) dönüştürülür. Çıkış deposu seçilir (source_warehouse_id). İrsaliye sevk edildiğinde (DISPATCHED) rezerve stok düşülür, depodaki fiili stok_quantity eksiltilir ve stock_movements tablosuna hareket kütüğü yazılır.",
                "8. Her CRUD ve durum adımı audit_logs tablosunda JSONB veri diff'i ile arşivlenir."
        );
        root.put("orderToCashWorkflow", workflow);

        // Pre-configured Tenants
        List<Map<String, String>> tenants = List.of(
                Map.of("tenantId", "tenant_tekstil", "name", "Atlas Tekstil & Dokuma Sanayi A.Ş.", "schema", "tenant_tekstil"),
                Map.of("tenantId", "tenant_moda", "name", "Vogue Hazır Giyim & Konfeksiyon Ltd.", "schema", "tenant_moda"),
                Map.of("tenantId", "tenant_perakende", "name", "Trendline Mağazacılık & E-Ticaret A.Ş.", "schema", "tenant_perakende")
        );
        root.put("tenants", tenants);

        // Mermaid ER Kodu
        root.put("mermaidErDiagram", MERMAID_ER_DIAGRAM);

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
