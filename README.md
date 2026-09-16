# MiniERP - Çok Kiracılı (Multi-Tenant) B2B Kurumsal Kaynak Planlama Sistemi

MiniERP; modern işletmeler için geliştirilmiş, **PostgreSQL Schema-per-Tenant** mimarisine sahip multi-tenancy altyapısı, **RabbitMQ tabanlı asenkron stok rezervasyon ve sevkiyat olay yönetimi (EDA)** ve birbirine entegre dikey bir **B2B Tedarik Zinciri** döngüsü içeren kurumsal düzeyde bir mini ERP çözümüdür.

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
   - Her kiracının verisi PostgreSQL üzerinde izole bir şemada (`search_path`) tutulur.
   - Satır bazlı (row-level `tenant_id`) tasarımlara kıyasla kiracılar arası veri sızıntısını fiziksel düzeyde engeller, bağımsız şema yedekleme ve GDPR/KVKK uyumu sağlar.
   - Master şema (`public`) kiracı havuzunu yönetir; kiracı şemaları Flyway ile dinamik olarak oluşturulur ve tohumlanır.

2. **Olay Güdümlü Mimari (EDA - RabbitMQ):**
   - **Sipariş Onayı $\rightarrow$ Stok Rezervasyonu:** B2B siparişi onaylandığında (`CONFIRMED`), `order-reservation-queue` üzerinden `OrderConfirmedEvent` fırlatılır. Depo modülü satılabilir stoktan rezerve stoğa aktarır.
   - **Sipariş İptali $\rightarrow$ Rezerv İadesi:** Onaylı sipariş iptal edildiğinde rezerve stok otomatik olarak serbest bırakılır.
   - **İrsaliye Sevki $\rightarrow$ Fiziki Stok Düşümü:** İrsaliye sevk edildiğinde (`DISPATCHED`), `waybill-fulfillment-queue` üzerinden `WaybillDispatchedEvent` fırlatılır ve fiili stok depodan düşülür. Dağıtık kilitlenme veya deadlock riski yoktur.

3. **Uçtan Uca B2B Süreç Yaşam Döngüsü:**
   - **Teklif (Quotation)** $\rightarrow$ Müşteri Kabulü $\rightarrow$ **Sipariş (Order)** $\rightarrow$ Onay & Rezerve $\rightarrow$ **İrsaliye (Waybill)** $\rightarrow$ Sevk & Fiziki Stok Çıkışı.

4. **Hibrit & Dayanıklı (Resilient) Frontend Mimarisi:**
   - React 18 + Vite + TypeScript + Tailwind CSS.
   - Canlı backend bağlantısı varsa tüm operasyon REST API üzerinden yürür.
   - Backend kapalıyken veya test aşamasındayken dahi kiracı duyarlı `mockStore` devreye girerek tüm sistemin kesintisiz çalışmasını ve test edilmesini sağlar.

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
| **Operasyon Müdürü (Manager)** | `manager` | `manager123` | Teklifler, Sipariş Onaylama/İptal, İrsaliye Sevki, Stok Girişi |
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
2. **Stok & Varyantlar** sayfasına gidin:
   - Atlas'ın kumaşlarından imal edilen *"Klasik Oxford Slim Fit Gömlek"* ve *"Slim Fit Likralı Jean Pantolon"* ürünlerini görün.
3. **Cari Hesaplar** sayfasına gidin:
   - Tedarikçi olarak **Atlas Tekstil A.Ş.**, Müşteri olarak **Trendline Mağazacılık A.Ş.** görünür.
4. **B2B Teklifler** menüsünden Trendline Mağazacılık'a yeni bir toptan satış teklifi hazırlayın:
   - Müşteri: *Trendline Mağazacılık A.Ş.*
   - Kalem: *100 Adet Oxford Gömlek (M/Açık Mavi)*
   - Teklifi kaydedin, durumunu `ACCEPTED` yapın ve **"Siparişe Dönüştür"** butonuna tıklayın!
5. **Resmi Siparişler** sayfasına yönleneceksiniz:
   - Siparişi **"Onayla"** butonuna basarak onaylayın.
   - Arka planda RabbitMQ olayı tetiklenir ve ilgili gömlek stokları anında satılabilir stoktan **Rezerve Stok** hanesine aktarılır!
6. Sipariş satırındaki **"İrsaliye Oluştur"** butonuna basarak sevkiyat irsaliyesini türetin.
7. **İrsaliye & Sevkiyat** sayfasına gidin ve **"Sevk Et"** butonuna tıklayın:
   - Fiziki stok depodan düşer ve rezerve stok temizlenir.

### 3. Adım: Trendline Mağazacılık'ta AVM Reyon Dağıtımı ve Online Satış
1. Sol menüden **Trendline Mağazacılık & E-Ticaret A.Ş.** (`tenant_perakende`) seçin.
2. **Stok & Varyantlar** sayfasına gidin:
   - Vogue'dan tedarik edilen barkodlu vitrin gömleklerini ve jean reyon stoklarını görün.
3. **Cari Hesaplar** sayfasına gidin:
   - Tedarikçi olarak *Vogue Hazır Giyim Ltd.*, satış partnerleri olarak *Trendyol Pazaryeri* ve *Hepsiburada* görünür.
4. **İrsaliye & Sevkiyat** sayfasından Marmara Forum veya Kanyon AVM mağazalarına yapılan reyon takviye irsaliyelerini inceleyin.

---

## 📦 İşletme Modülleri Kılavuzu

### 1. Genel Bakış & KPI Dashboard (`/`)
- Toplam ürün adedi, aktif SKU (varyant) sayısı, depodaki fiziksel stok ve siparişlere rezerve edilmiş stok toplamı.
- Kritik/Azalan stok uyarı paneli (satılabilir stok $\le 15$ veya rezerv oranı yüksek ürünler).
- Bekleyen teklifler ve onay bekleyen son siparişler tablosu.

### 2. Stok & Varyantlar (`/inventory`)
- Ana ürün kartları ve alt varyant (SKU) hiyerarşisi.
- Her varyant için: **Fiili Stok**, **Rezerve Stok**, **Satılabilir Stok** takibi (`Satılabilir = Fiili - Rezerve`).
- **Hızlı Stok Hareketi:** *"Manuel Stok Ayarla"* butonu ile depoya mal girişi veya sayım eksiği düşümü.
- Dinamik JSONB ürün özellikleri (kumaş gramajı, en, yıkama talimatı vb.).

### 3. Kategoriler (`/categories`)
- Ürün grubu ağacı ve departman sınıflandırması.

### 4. Cari Hesaplar (`/partners`)
- Müşteri (`CUSTOMER`), Tedarikçi (`SUPPLIER`) ve Her İkisi (`BOTH`) carileri.
- Vergi numarası, vergi dairesi, adres, e-posta, telefon ve JSONB metadata (vade günü, kredi limiti).

### 5. B2B Teklifler (`/quotations`)
- Alış (`PURCHASE`) ve Satış (`SALES`) teklifleri.
- Teklif Durumları: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `CONVERTED`.
- Kabul edilen tekliften tek tıkla resmi sipariş oluşturma.

### 6. Resmi Siparişler (`/orders`)
- Alış Siparişi (`PURCHASE_ORDER`) ve Satış Siparişi (`SALES_ORDER`).
- Durum Yönetimi: `DRAFT` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED` / `CANCELLED`.
- **Stok Koruması:** `CONFIRMED` yapıldığında otomatik stok rezervasyonu; `CANCELLED` yapıldığında otomatik rezerv iadesi.
- Onaylı siparişten tek tıkla sevk/tesellüm irsaliyesi türetme.

### 7. İrsaliye & Sevkiyat (`/waybills`)
- Sevk İrsaliyesi (`DISPATCH`) ve Alış İrsaliyesi (`RECEIPT`).
- Nakliyeci firma, araç plakası ve kargo takip numarası (`trackingNumber`) kaydı.
- `DISPATCHED` durumuna alındığında depodan fiziki stok çıkışının tamamlanması.

### 8. Sistem Denetim Günlüğü (`/audit-logs`)
- Yalnızca `ROLE_ADMIN` yetkisine sahip kullanıcılar erişebilir.
- Yapılan işlemler, işlem saati, kullanıcı adı, IP adresi ve eski/yeni değer değişimleri (diff).

---

## 🐳 Docker ile Kurulum ve Çalıştırma

Projeyi herhangi bir bilgisayarda veya sunucuda tek komutla ayağa kaldırabilirsiniz:

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
| **Frontend Web Portalı** | [http://localhost:3000](http://localhost:3000) | Kullanıcı Arayüzü |
| **Backend REST API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Spring Boot API |
| **RabbitMQ Yönetim Paneli** | [http://localhost:15672](http://localhost:15672) | Kullanıcı: `guest` / Şifre: `guest` |
| **PostgreSQL Veritabanı** | `localhost:5432` | DB: `minierp_db`, User: `postgres`, Pass: `postgres` |

### Kapatma Komutu

```bash
docker compose down
```
*(Verileri de sıfırlamak isterseniz: `docker compose down -v`)*

---

## 📁 Dizin Yapısı

```
minierp/
├── docker-compose.yml           # Multi-container orkestrasyonu
├── .gitignore                   # target, node_modules ve IDE dosyalarını filtreler
├── README.md                    # Bu dokümantasyon ve kullanım kılavuzu
├── backend/                     # Spring Boot 3.3 + Java 21 Modüler Monolit
│   ├── Dockerfile               # Multi-stage Maven derleme ve hafif JRE runtime
│   ├── pom.xml                  # Spring Data JPA, Security, Flyway, RabbitMQ bağımlılıkları
│   └── src/main/
│       ├── java/com/minierp/
│       │   ├── core/            # Multi-tenancy, JWT Security, RabbitMQ Config, DataInitializer
│       │   └── modules/         # inventory, partner, quotation, order, waybill, tenant, audit
│       └── resources/
│           ├── application.yml
│           └── db/migration/    # Flyway master ve kiracı migration SQL betikleri
└── frontend/                    # React 18 + TypeScript + Vite + Tailwind CSS
    ├── Dockerfile               # Multi-stage Node derleme ve Nginx reverse proxy
    ├── nginx.conf               # Nginx reverse proxy ve SPA routing
    ├── package.json
    └── src/
        ├── api/                 # Axios istemcisi ve Kiracı Duyarlı mockStore
        ├── components/          # StatCard, StatusBadge, Table, Dialog, Layout bileşenleri
        ├── context/             # AuthContext ve TenantContext
        └── pages/               # Dashboard, Inventory, Quotations, Orders, Waybills, Partners vb.
```

---

## 🏁 Sonuç

MiniERP; gerek mimari standartları (Schema-per-tenant, RabbitMQ EDA, Transactional Integrity), gerekse işletmeler arası birbirine bağlı B2B senaryosuyla üretime, portfolyo sunumuna ve kurumsal değerlendirmelere tam anlamıyla hazırdır.
