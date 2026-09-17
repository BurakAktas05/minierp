# MiniERP - Çok Kiracılı (Multi-Tenant) B2B Kurumsal Kaynak Planlama Sistemi

MiniERP; modern işletmeler için geliştirilmiş, **PostgreSQL Schema-per-Tenant** mimarisine sahip izole multi-tenancy altyapısı, **RabbitMQ tabanlı asenkron stok rezervasyon ve sevkiyat olay yönetimi (EDA)**, **üretim reçete (BOM) & iş emri yönetimi**, **fatura & kasa/banka modülü** ve birbirine entegre dikey bir **B2B Tedarik Zinciri** döngüsü içeren kurumsal düzeyde bir çekirdek ERP çözümüdür.

> 📢 **Staj & Proje Sunum Rehberi:**  
> Şirket yöneticilerine veya değerlendirme kuruluna yapılacak teknik sunum adımları ve canlı demo akışı için **[docs/SUNUM_REHBERI.md](docs/SUNUM_REHBERI.md)** dosyasını inceleyebilirsiniz.

---

## 📑 İçindekiler
1. [Mimari Kurgu ve Öne Çıkan Özellikler](#-mimari-kurgu-ve-öne-çıkan-özellikler)
2. [İşletmeler ve Giriş Bilgileri (Hesap Tablosu)](#-işletmeler-ve-giriş-bilgileri)
3. [Adım Adım B2B Tedarik Zinciri Kullanım Kılavuzu](#-adım-adım-b2b-tedarik-zinciri-kullanım-kılavuzu)
4. [İşletme Modülleri Kılavuzu](#-işletme-modülleri-kılavuzu)
5. [Docker ile Kurulum ve Çalıştırma](#-docker-ile-kurulum-ve-çalıştırma)
6. [Dizin Yapısı ve Mimarisi](#-dizin-yapısı)

---

## 🏗️ Mimari Kurgu ve Öne Çıkan Özellikler

1. **İzole Multi-Tenancy (Schema-Per-Tenant Deseni - PostgreSQL):**
   - Her kiracının verisi PostgreSQL üzerinde izole bir fiziksel şemada (`search_path`) tutulur (`tenant_tekstil`, `tenant_moda`, `tenant_perakende`).
   - Satır bazlı (row-level `tenant_id`) tasarımlara kıyasla kiracılar arası veri sızıntısını veritabanı motoru düzeyinde engeller, bağımsız şema yedekleme ve GDPR/KVKK uyumu sağlar.
   - Master şema (`public`) kiracı havuzunu yönetir; kiracı şemaları Flyway ile dinamik olarak oluşturulur ve tohumlanır.

2. **Olay Güdümlü Mimari (EDA - RabbitMQ & Spring Events):**
   - **Sipariş Onayı $\rightarrow$ Stok Rezervasyonu:** B2B siparişi onaylandığında (`CONFIRMED`), `order-reservation-queue` üzerinden `OrderConfirmedEvent` fırlatılır. Depo modülü satılabilir stoktan rezerve stoğa aktarır. Çift satış engellenir.
   - **Sipariş İptali $\rightarrow$ Rezerv İadesi:** Onaylı sipariş iptal edildiğinde rezerve stok otomatik olarak serbest bırakılır.
   - **İrsaliye Sevki $\rightarrow$ Fiziki Stok Düşümü:** İrsaliye sevk edildiğinde (`DISPATCHED`), `waybill-fulfillment-queue` üzerinden `WaybillDispatchedEvent` fırlatılır ve fiili stok depodan düşülür.
   - **Resilience:** RabbitMQ devre dışıyken Spring Application Events ile asenkron olaylar güvenle yürütülür.

3. **Veri Bütünlüğü ve Eksi Bakiye Güvencesi (Transactional Integrity):**
   - **Üretim Reçetesi (BOM) & İş Emirleri:** Üretim tamamlanırken sarf edilecek hammadde stokları depoda anlık taranır. Stoğu yetersiz hammadde varsa işlem atomik olarak rollback edilir ve eksi stok oluşması engellenir.
   - **Eşzamanlılık Koruması (Optimistic Locking):** Kritik stok tablolarında `@Version` ile çakışmalar yönetilir ve `OptimisticLockingFailureException` kullanıcı dostu HTTP 409 mesajına dönüştürülür.
   - **Cari Bakiye SQL Optimizasyonu:** `findAll()` bellek sızıntısı kaldırılmış; veritabanı motorunda `GROUP BY partner_id` yapan indeksli SQL agregasyon sorgularına geçilmiştir.

4. **Ciddi Kurumsal ERP Kullanıcı Deneyimi (%100 Canlı DB Metrikleri):**
   - **Sıfır Mock Veri:** Dashboard'da hiçbir yapay istatistik yoktur; Kasa/Banka, Fatura, Açık Bakiye ve Stok Değerleri doğrudan canlı DB'den konsolide edilir.
   - **Kritik Emniyet Stoku:** Kullanılabilir net stoku 15 adedin altına inen veya tükenen tüm varyantlar anlık alarm verir.
   - **Sayfalama (Pagination):** 10, 25, 50, 100 satırlık dinamik sayfalama ve kayıt sayaçları ile tarayıcı performansı korunur.
   - **Modern Toast Bildirimleri:** Tüm tarayıcı `alert()` çağrıları kaldırılmış; pürüzsüz slide-in animasyonlu Toast bildirim sistemine geçilmiştir.

---

## 🔑 İşletmeler ve Giriş Bilgileri

Sistemde birbirini besleyen dikey bir tedarik zincirine sahip **3 entegre işletme** tanımlıdır. Sisteme giriş yaparken ilgili işletmenin **Kiracı Kodu** seçilir.

### 🏢 Tanımlı İşletmeler (Kiracılar)

| İşletme Adı | Kiracı Kodu (`tenantId`) | Faaliyet Alanı | Rolü |
|---|---|---|---|
| **Atlas Tekstil & Dokuma Sanayi A.Ş.** | `tenant_tekstil` | Ham pamuk, iplik ve B2B dokuma kumaş üretimi | **Hammadde Tedarikçisi** |
| **Vogue Hazır Giyim & Konfeksiyon Ltd.** | `tenant_moda` | Gömlek, jean ve tişört imalatı & toptan satışı | **Üretici & Konfeksiyon** |
| **Trendline Mağazacılık & E-Ticaret A.Ş.** | `tenant_perakende` | AVM reyonları, Trendyol/Hepsiburada mağazacılığı | **Perakendeci (Retail)** |

### 👤 Kullanıcı Hesapları ve Şifreler (Tüm İşletmelerde Geçerlidir)

Her 3 işletmenin şemasında da aşağıdaki 3 yetki rolünde kullanıcı mevcuttur:

| Rol | Kullanıcı Adı | Şifre | Yetki Kapsamı |
|---|---|---|---|
| **Sistem Yöneticisi (Admin)** | `admin` | `admin123` | Tüm modüller, Denetim Kayıtları (Audit Log), Kiracı Yönetimi |
| **Operasyon Müdürü (Manager)** | `manager` | `manager123` | Teklifler, Sipariş Onaylama/İptal, İrsaliye Sevki, Stok Girişi, Üretim |
| **Standart Kullanıcı (User)** | `user` | `user123` | Görüntüleme, Taslak Teklif/Sipariş oluşturma |

> 💡 **Hızlı Test:** Giriş sayfasında yer alan *"Hızlı Rol Testi"* butonlarına (`Admin`, `Yönetici`, `Kullanıcı`) basarak formu tek tıkla doldurabilirsiniz.

---

## 🔄 Adım Adım B2B Tedarik Zinciri Kullanım Kılavuzu

Bu 3 işletme birbirleriyle canlı bir tedarik zinciri halinde çalışır:

```
[1. Atlas Tekstil A.Ş.] --(Kumaş Satış Siparişi & İrsaliyesi)--> [2. Vogue Hazır Giyim Ltd.]
[2. Vogue Hazır Giyim Ltd.] --(Gömlek & Jean Satış İrsaliyesi)--> [3. Trendline Mağazacılık A.Ş.]
```

### 1. Adım: Atlas Tekstil'den Vogue Hazır Giyim'e Kumaş Sevkiyatı
1. Sol menüden kiracı olarak **Atlas Tekstil & Dokuma Sanayi A.Ş.** (`tenant_tekstil`) seçin.
2. **Stok & Varyantlar** sayfasına gidin: *"Saf Pamuk Oxford Dokuma Kumaş Topu"* ve *"Likralı Ağır Denim"* stoklarını inceleyin.
3. **Cari Hesaplar** sayfasına gidin: Müşteri carisi olarak **Vogue Hazır Giyim & Konfeksiyon Ltd.** listelenir.
4. **B2B Teklifler** sayfasına gidin: Vogue'a verilmiş kabul edilmiş kumaş teklifini (`QT-2026-TEK-001`) görün.
5. **Resmi Siparişler** sayfasına gidin: Vogue'un onaylı siparişini (`SIP-SAT-2026-TEK-001`) görün. Onaylandığı için stoklar rezerve durumdadır.
6. **İrsaliye & Sevkiyat** sayfasına gidin: Kumaş toplarının Vogue fabrikasına sevk edildiğini (`IRS-SVK-2026-TEK-001`) görün.

### 2. Adım: Vogue Hazır Giyim'de Konfeksiyon İmalatı ve Perakendeciye Satış
1. Sol menüdeki kiracı seçim kutusundan **Vogue Hazır Giyim & Konfeksiyon Ltd.** (`tenant_moda`) seçin.
2. **Üretim & Reçete (BOM)** sayfasına gidin: Kumaş ve düğmelerden oluşan *"Oxford Slim Fit Gömlek"* reçetesini ve iş emirlerini inceleyin.
3. **Stok & Varyantlar** sayfasına gidin:
   - Atlas'ın kumaşlarından imal edilen *"Klasik Oxford Slim Fit Gömlek"* ve *"Slim Fit Likralı Jean Pantolon"* ürünlerini görün.
4. **Cari Hesaplar** sayfasına gidin:
   - Tedarikçi olarak **Atlas Tekstil A.Ş.**, Müşteri olarak **Trendline Mağazacılık A.Ş.** görünür.
5. **B2B Teklifler** menüsünden Trendline Mağazacılık'a yeni bir toptan satış teklifi hazırlayın. Kabul edilince **"Siparişe Dönüştür"** butonuna tıklayın!
6. **Resmi Siparişler** sayfasında siparişi onaylayın: Rezerve stok artar.
7. **İrsaliye & Sevkiyat** sayfasından **"Sevk Et"** diyerek fiziksel çıkışı tamamlayın.
8. **Fatura Yönetimi** sayfasında irsaliyeden faturayı oluşturun, resmi e-fatura formatında önizleyin veya Kasa/Banka tahsilatını girin.

### 3. Adım: Trendline Mağazacılık'ta AVM Reyon Dağıtımı ve Online Satış
1. Sol menüden **Trendline Mağazacılık & E-Ticaret A.Ş.** (`tenant_perakende`) seçin.
2. **Stok & Varyantlar** sayfasına gidin:
   - Vogue'dan tedarik edilen barkodlu vitrin gömleklerini ve jean reyon stoklarını görün.
3. **Cari Hesaplar** sayfasında pazaryeri partnerleri (Trendyol, Hepsiburada) ve Vogue carisini inceleyin.

---

## 📦 İşletme Modülleri Kılavuzu

| Modül | URL | Temel Özellikler |
|---|---|---|
| **Genel Bakış & KPI Kokpiti** | `/` | %100 canlı DB metrikleri, Kasa/Banka toplamı, açık cari bakiye yükü, depo maliyet değeri, kritik emniyet stoku uyarısı |
| **Stok & Varyant Yönetimi** | `/inventory` | Ana ürün ve varyant (SKU) hiyerarşisi, Fiili/Rezerve/Kullanılabilir stok takibi, hızlı stok fişi |
| **Kategoriler** | `/categories` | Hiyerarşik kategori ağacı ve departman sınıflandırması |
| **Cari Hesaplar** | `/partners` | Müşteri/Tedarikçi kartları, SQL agregasyonlu anlık borç/alacak bakiyesi, hareket ekstresi |
| **B2B Teklifler** | `/quotations` | Alış ve Satış teklifleri, onaylandığında tek tıkla siparişe dönüştürme |
| **Resmi Siparişler** | `/orders` | Alış/Satış siparişleri, otomatik stok rezervasyonu ve rezerv iadesi, irsaliye türetme |
| **İrsaliye & Sevkiyat** | `/waybills` | Sevk/Alış irsaliyeleri, araç plakası ve taşıyıcı takibi, fiziki stok düşümü, matbu yazdırma şablonu |
| **Fatura Yönetimi** | `/invoices` | Alış/Satış faturaları, KDV matrahı, tevkifat, resmi e-fatura/e-arşiv çıktısı, tahsilat & kısmi ödeme |
| **Kasa & Banka** | `/treasury` | Nakit kasalar, vadesiz banka hesapları, IBAN takibi, cari tahsilat/tediye hareketleri |
| **Üretim & Reçete (BOM)** | `/manufacturing` | Ürün reçetesi (BOM), hammadde sarfiyatı, iş emri planlama, **eksi stok önleme güvencesi** |
| **Denetim Günlüğü** | `/audit-logs` | `ROLE_ADMIN` erişimli JSONB fark (diff) kütüğü, işlem saati, IP ve kullanıcı denetimi |

---

## 🐳 Docker ile Kurulum ve Çalıştırma

### Gereksinimler
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / Mac) veya Docker Engine & Docker Compose (Linux).

### Başlatma Komutu
```bash
docker compose up --build
```

Bu komut sırasıyla:
1. PostgreSQL 16 veritabanını ayağa kaldırır (`localhost:5432`).
2. RabbitMQ 3.13 mesaj kuyruğunu ve yönetim arayüzünü başlatır (`localhost:5672`, `localhost:15672`).
3. Spring Boot backend uygulamasını Docker içinde derler ve ayağa kaldırır (`localhost:8080`).
4. `DataInitializer` servisi ile master ve 3 kiracı şemasını açar, veritabanını tohumlar.
5. React + Nginx frontend uygulamasını derleyip yayına alır (`localhost:3000`).

### Servis Erişim Adresleri

| Servis | Adres | Bilgi |
|---|---|---|
| **Frontend Web Portalı** | [http://localhost:3000](http://localhost:3000) | Kullanıcı Arayüzü (Prod Nginx) |
| **Frontend Dev Sunucusu** | [http://localhost:5173](http://localhost:5173) | Vite Yerel Geliştirme |
| **Backend REST API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Spring Boot API |
| **RabbitMQ Yönetim Paneli** | [http://localhost:15672](http://localhost:15672) | Kullanıcı: `guest` / Şifre: `guest` |
| **PostgreSQL Veritabanı** | `localhost:5432` | DB: `minierp_db`, User: `postgres`, Pass: `postgres` |

---

## 📁 Dizin Yapısı

```
minierp/
├── docker-compose.yml           # Multi-container orkestrasyonu
├── .gitignore                   # target, node_modules ve IDE filtreleri
├── README.md                    # Proje tanıtım ve kullanım kılavuzu
├── docs/                        # Proje sunumu, geliştirici rehberi ve ER diyagramı
│   ├── SUNUM_REHBERI.md         # Staj sunumu ve teknik savunma soru-cevap kılavuzu
│   ├── GELISTIRICI_REHBERI.md   # Geliştirici kurulum ve katkı rehberi
│   └── er_diagram.html          # İnteraktif 25 tablolu PostgreSQL ER diyagramı
├── backend/                     # Spring Boot 3.3 + Java 21 Modüler Monolit
│   ├── Dockerfile               # Multi-stage Maven derleme ve hafif JRE runtime
│   ├── pom.xml                  # Spring Data JPA, Security, Flyway, RabbitMQ
│   └── src/main/
│       ├── java/com/minierp/
│       │   ├── core/            # Multi-tenancy, JWT Security, RabbitMQ Config, Pagination
│       │   └── modules/         # inventory, partner, quotation, order, waybill, invoice, manufacturing, treasury, audit
│       └── resources/
│           ├── application.yml
│           └── db/migration/    # Flyway master ve kiracı migration SQL betikleri
└── frontend/                    # React 18 + TypeScript + Vite + Tailwind CSS
    ├── Dockerfile               # Multi-stage Node derleme ve Nginx reverse proxy
    ├── nginx.conf               # Nginx reverse proxy ve SPA routing
    ├── package.json
    └── src/
        ├── api/                 # Axios istemcisi ve REST API servisleri
        ├── components/          # ErpDataGrid, ErpToolbar, ToastContainer, StatusBadge
        ├── context/             # AuthContext, TenantContext, ToastContext
        └── pages/               # Dashboard, Inventory, Quotations, Orders, Waybills, Invoices, Manufacturing, Partners
```

---

## 🏁 Sonuç

MiniERP; gerek mimari standartları (Schema-per-tenant, RabbitMQ EDA, Transactional & Optimistic Locking Integrity), gerek canlı veritabanı metrikleriyle çalışan profesyonel ERP kokpiti, gerekse işletmeler arası birbirine bağlı B2B senaryosuyla **staj sunumuna, kurumsal değerlendirmelere ve portfolyo sunumuna %100 hazırdır.**
