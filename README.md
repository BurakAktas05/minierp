# MiniERP - Çok Şirketli (Multi-Tenant) İşletme Yönetim Sistemi

Merhaba! 👋 

Bu proje, bir işletmenin temel ticari ve operasyonel süreçlerini (Cari, Stok, Teklif, Sipariş, İrsaliye, Fatura ve Üretim) uçtan uca simüle etmek ve kendimi **Spring Boot & React** mimarisinde geliştirmek amacıyla hazırladığım full-stack bir ERP uygulamasıdır.

Projeyi geliştirirken özellikle kurumsal şirketlerin kullandığı gerçek iş akışlarını (tekliften siparişe, irsaliyeden faturaya ve depoya stok giriş/çıkışına kadar) doğru muhasebe ve depo mantığıyla kodlamaya özen gösterdim.

---

## 🛠️ Kullanılan Teknolojiler

### Backend
- **Java 21** & **Spring Boot 3.3**
- **Spring Data JPA (Hibernate)**
- **Spring Security & JWT** (Rol bazlı yetkilendirme)
- **PostgreSQL** (Schema-per-tenant multi-tenant mimarisi)
- **Flyway** (Veritabanı versiyonlama ve şema yönetimi)
- **Lombok** & **MapStruct**

### Frontend
- **React 18** & **TypeScript**
- **Vite** (Hızlı derleme ve geliştirme ortamı)
- **Tailwind CSS** (Modern ve sade arayüz tasarımı)
- **Lucide React** (İkon seti)

---

## 🚀 Öne Çıkan Özellikler & İş Mantığı

### 1. Çok Şirketli (Multi-Tenant) Yapı
- Tek bir veritabanı içerisinde her şirket için ayrı bir PostgreSQL şeması (`tenant_aktas`, `tenant_tekstil` vb.) kullanılır.
- Kullanıcı giriş yaptığında gelen JWT içindeki veya başlıktaki `X-Tenant-ID` bilgisine göre `search_path` dinamik olarak ayarlanır. Böylece firmaların verileri fiziksel olarak birbirine kesinlikle karışmaz.

### 2. Cari Yönetimi
- Cariler **Müşteri**, **Tedarikçi** veya **Müşteri & Tedarikçi (BOTH)** olarak tanımlanabilir.
- Her carinin fatura ve ödemelerine göre anlık borç/alacak bakiyesi otomatik hesaplanır.

### 3. Stok, Varyant & Emniyet Stoğu
- Ürünler tipine göre ayrılır: **Mamul (FINISHED_GOOD)**, **Hammadde (RAW_MATERIAL)** ve **Hizmet (SERVICE)**.
- Her ürünün varyantları (renk, beden, ebat vb.), barkodu ve fiili stok miktarları takip edilir.
- Stoğu azalan veya tükenen ürünler için emniyet stoku uyarıları mevcuttur.

### 4. Tekliften Faturaya Tam Ticari Döngü
Gerçek bir işletmede olduğu gibi adımlar birbirine bağlıdır:
1. **Teklif (Quotation):** Müşteriye verilen (Satış) veya tedarikçiden alınan (Satın Alma) teklif hazırlanır.
2. **Sipariş (Order):** Onaylanan teklif tek tıkla resmi siparişe dönüştürülür. Sipariş onaylandığında satılabilir stok rezerve edilir.
3. **İrsaliye (Waybill):** 
   - Satışta: Sevk irsaliyesi kesilip `DISPATCHED` yapıldığında depodan fiziki stok düşer.
   - Satın almada: Mal kabul irsaliyesi ile depoya fiziki stok girişi yapılır.
4. **Fatura (Invoice):** İrsaliyeden otomatik fatura üretilir. Onaylandığında cari hesaba borç/alacak yazılır.
5. **Tahsilat & Tediye (Payment):** Faturaya istinaden tam veya kısmi ödeme yapılabilir. Ödeme yapıldıkça faturanın durumu (`PAID` / `PARTIALLY_PAID`) ve cari bakiye anlık güncellenir.

### 5. Üretim & Reçete (BOM) Modülü
- **Üretim Reçetesi (BOM):** Bir mamulün üretilmesi için gereken hammadde oranları tanımlanır (Örn: 1 Masa = 1 Ahşap Panel + 4 Ayak + 8 Civata).
- **İş Emri (Work Order):** Reçeteye istinaden üretim başlatılır.
- **Eksi Stok Koruması:** Üretim tamamlanırken depodaki hammadde stoğu kontrol edilir; hammadde yetersizse sistem üretimi durdurur ve eksi stoğa düşülmesini engeller. Yeterliyse hammaddeler otomatik düşer ve üretilen mamul depoya girer.

---

## 💻 Kurulum ve Yerel Ortamda Çalıştırma

### Gereksinimler
- **Java 21** veya üzeri (JDK)
- **Node.js 18+** ve npm
- **PostgreSQL 14+**

### 1. Adım: Veritabanı Hazırlığı
PostgreSQL'de `minierp_db` adında bir veritabanı oluşturun:
```sql
CREATE DATABASE minierp_db;
```

`backend/src/main/resources/application.yml` dosyasındaki kullanıcı adı ve şifrenin kendi PostgreSQL ayarlarınızla uyumlu olduğunu kontrol edin:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/minierp_db
    username: postgres
    password: password
```

### 2. Adım: Backend'i Başlatma
Terminali açıp `backend` klasörüne gidin:
```bash
cd backend
mvn spring-boot:run
```
Backend ayağa kalktığında Flyway otomatik olarak tabloları oluşturup test verilerini yükleyecektir.  
Varsayılan port: `http://localhost:8080`

### 3. Adım: Frontend'i Başlatma
Yeni bir terminal açıp `frontend` klasörüne gidin:
```bash
cd frontend
npm install
npm run dev
```
Tarayıcınızdan `http://localhost:5173` adresine giderek uygulamayı açabilirsiniz.

---

## 🔑 Giriş Bilgileri (Varsayılan Hesaplar)

Giriş ekranında test edebilmeniz için hazır roller mevcuttur:

| Kullanıcı Adı | Şifre | Rol | Yetki |
|---|---|---|---|
| `admin` | `admin123` | Sistem Yöneticisi | Tüm modüller, loglar ve tenant yönetimi |
| `manager` | `manager123` | Birim Müdürü | Teklif, sipariş, irsaliye, fatura ve üretim onayları |
| `user` | `user123` | Standart Personel | Görüntüleme ve taslak kayıt girişi |

---

## 🧪 Entegrasyon Testleri

Sistemin tekliften faturaya, üretimden tahsilata kadar olan akışlarını test etmek için Node.js scriptleri yazdım. Terminalde projenin kök dizininde şu komutları çalıştırarak tüm senaryoları canlı test edebilirsiniz:

- **Müşteri Satış Döngüsü:**
  ```bash
  node test_integration_flow.cjs
  ```
- **Tedarikçi Satın Alma & Mal Kabul:**
  ```bash
  node test_purchase_integration_flow.cjs
  ```
- **Atlas Tekstil Alış & Canlı DB Doğrulaması:**
  ```bash
  node test_atlas_tekstil_flow.cjs
  ```
- **Reçete (BOM), Eksi Stok Koruması & Üretim Satışı:**
  ```bash
  node test_manufacturing_use_case.cjs
  ```

---

## 📝 Notlar & Kendime Notlar

- Multi-tenant yapıda **schema-per-tenant** yaklaşımını tercih ettim; böylece veritabanı düzeyinde izolasyon sağlanmış oldu.
- Stok işlemlerinde aynı anda birden fazla hareket olduğunda tutarsızlık olmaması için `@Version` (optimistic locking) ve `@Transactional` izolasyonu uyguladım.
- **İleride eklemeyi düşündüklerim (To-Do):**
  - [ ] Faturalar için PDF çıktısı ve e-arşiv görsel şablonu
  - [ ] Excel / CSV ile toplu ürün ve cari içe/dışa aktarma
  - [ ] Detaylı kâr/zarar ve nakit akışı rapor grafikleri

---

Her türlü geri bildirim ve katkıya açığım! ⭐
