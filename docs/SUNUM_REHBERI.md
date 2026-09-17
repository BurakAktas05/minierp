# 🎙️ MiniERP Proje Sunumu ve Teknik Savunma Kılavuzu

Bu kılavuz; **ERP Çözüm Ortağında** stajyer veya geliştirici olarak görev yapan bir uzmanın, geliştirdiği MiniERP sistemini şirket yöneticilerine, kıdemli yazılımcılara ve değerlendirme kuruluna profesyonelce sunabilmesi için hazırlanmıştır.

---

## 📌 1. Sunum Girişi (1 Dakikalık Asansör Konuşması)

> *"Sayın yöneticilerim ve hocalarım;*  
> *Sizlere sunduğum **MiniERP**, günümüz orta ve büyük ölçekli işletmelerinin en kritik ihtiyaçlarını karşılamak üzere tasarlanmış, **PostgreSQL Schema-per-Tenant** mimarisiyle çalışan, olay güdümlü (**EDA - RabbitMQ**), tam entegre bir kurumsal kaynak planlama sistemidir.*  
> *Sistemde yapay veya sahte (mock) hiçbir veri kullanılmamıştır; gösterge panelinden cari hesap ekstresine kadar her şey doğrudan veritabanı motorundaki hareketlerden anlık olarak hesaplanmaktadır.*  
> *Stok tutarlılığı, üretimde hammadde eksi bakiye koruması, atomik transaction garantisi ve kurumsal Logo/SAP/DİA standartlarındaki kullanıcı deneyimiyle projeyi uçtan uca çalışır hale getirdim."*

---

## 🎬 2. Adım Adım Canlı Demo Senaryosu (5-7 Dakika)

Sunum sırasında tarayıcıyı açarak şu senaryoyu sırasıyla uygulayın:

### 1. Adım: Giriş ve Kurumsal Dashboard
* **Eylem:** Giriş ekranında `tenant_tekstil` (Atlas Tekstil) veya `tenant_moda` (Vogue Hazır Giyim) seçerek `admin` / `admin123` ile giriş yapın.
* **Vurgulanacak Noktalar:**
  * Dashboard üzerindeki **Kasa/Banka Likiditesi**, **Toplam Faturalanan**, **Açık Cari Alacak** ve **Depo Stok Değeri** kartlarını gösterin.
  * *"Buradaki hiçbir sayı sabit (hardcoded) veya tahmini değildir. Doğrudan PostgreSQL tablolarındaki canlı kayıtların toplanmasıyla anlık üretilir."*
  * Aşağıdaki **Kritik Emniyet Stoku** tablosunu gösterin: Net stoku 15 adedin altına inen veya tükenen ürünlerin otomatik alarm verdiğini belirtin.

### 2. Adım: B2B Sipariş ve Otomatik Stok Rezervasyonu
* **Eylem:** **B2B Teklifler** (`/quotations`) veya **Resmi Siparişler** (`/orders`) ekranına gidin.
* **Vurgulanacak Noktalar:**
  * Yeni bir sipariş açın veya mevcut bir taslak siparişi `CONFIRMED` (Onaylandı) durumuna getirin.
  * Sayfa yenilenmeden sağ altta beliren **yeşil Toast bildirimini** gösterin (*"Native JS alert yerine modern ve engelsiz toast notification kullanıldı"*).
  * **Stok & Varyantlar** (`/inventory`) sayfasına geçin.
  * Sipariş edilen ürünün **Fiili Stoku** değişmezken, **Rezerve Stok** miktarının arttığını ve **Satılabilir Net Stok**'un düştüğünü canlı olarak gösterin.
  * *"Sistem bu sayede aynı ürünü birden fazla müşteriye satma (çift satış / race condition) riskini sıfırlar."*

### 3. Adım: İrsaliye Sevkiyatı ve Fiziki Stok Çıkışı
* **Eylem:** **İrsaliye & Sevkiyat** (`/waybills`) ekranına gidin.
* **Vurgulanacak Noktalar:**
  * İlgili siparişe bağlı sevk irsaliyesini açın. Araç plakası, sevk tarihi ve taşıyıcı bilgilerini girip **"Sevk Et" (DISPATCHED)** butonuna tıklayın.
  * Yeniden Stok ekranına dönün: Rezerve stok kalkmış, depodaki **Fiili Stok fiziken düşmüştür**.
  * Resmi yazdırma butonuna basarak kurumsal matbu irsaliye şablonu modalını açın.

### 4. Adım: Faturalama, Muhasebeleşme ve Kasa/Banka Tahsilatı
* **Eylem:** **Fatura Yönetimi** (`/invoices`) ekranına gidin.
* **Vurgulanacak Noktalar:**
  * İrsaliye üzerinden fatura oluşturulmasını veya satış faturası kaydını gösterin (KDV, tevkifat, iskonto).
  * Fatura onaylandığında Carinin (`/partners`) borç hanesine anında yansıdığını gösterin.
  * Fatura üzerinden **"Tahsilat Ekle"** butonuna basarak Kasa veya Banka hesabını seçip kısmi ödeme kaydedin.
  * Fatura durumunun `PARTIALLY_PAID` olduğunu, kalan bakiyenin düştüğünü ve Kasa/Banka mevcudunun arttığını gösterin.

### 5. Adım: Üretim Emri ve Eksi Bakiye Önleme Güvencesi
* **Eylem:** **Üretim & Reçete (BOM)** (`/manufacturing`) ekranına gidin.
* **Vurgulanacak Noktalar:**
  * *"Bir ERP sisteminin en tehlikeli açığı, depoda olmayan hammaddeyle üretime izin verip stokları eksiye düşürmesidir."*
  * Stoğu yetersiz olan bir hammaddeyle iş emrini tamamlamaya çalışın.
  * Sistemin işlemi durdurup: **"Üretim tamamlanamaz! Yetersiz hammadde stoğu: [Bileşen], Mevcut: X, Gereken: Y"** şeklinde kırmızı hata toast'u verdiğini ve veritabanının atomik olarak korunduğunu gösterin.

---

## 🧠 3. Kıdemli Yazılımcıların Sorabileceği Sorular ve Teknik Cevaplar

### Soru 1: "Neden Row-Level (tenant_id kolonu) yerine Schema-per-Tenant tercih ettin?"
> **Cevap:**  
> *"Row-level tenancy'de yazılımcının `WHERE tenant_id = ?` filtresini tek bir sorguda dahi unutması, şirketler arası felaket boyutunda bir veri sızıntısına (data leak) yol açar. Schema-per-Tenant yaklaşımında ise her kiracı PostgreSQL üzerinde `tenant_tekstil`, `tenant_moda` gibi izole fiziksel şemalara sahiptir. Hibernate `CurrentTenantIdentifierResolver` ve `MultiTenantConnectionProvider` ile `search_path` bağlantı düzeyinde ayarlanır. Veritabanı motoru seviyesinde fiziksel izolasyon sağlandığı için hem GDPR/KVKK uyumludur hem de her kiracının şeması bağımsız olarak yedeklenebilir."*

### Soru 2: "Eşzamanlı (Concurrent) işlemlerde iki kullanıcı aynı anda stok düşmeye çalışırsa ne olur?"
> **Cevap:**  
> *"Entity'ler üzerinde `@Version` alanı ile **Optimistic Locking (İyimser Kilitleme)** uygulanmıştır. İki kullanıcı aynı varyantı aynı anda güncellemeye kalkarsa, ikinci gelen işlem `OptimisticLockingFailureException` alır. Backend'deki `GlobalExceptionHandler` bunu yakalar ve HTTP 409 Conflict koduyla kullanıcıya anlaşılır bir 'Kayıt başka bir kullanıcı tarafından güncellendi' mesajı döner. Kirli veri (dirty write) veya negatif stok oluşması kesin olarak engellenir."*

### Soru 3: "Cari bakiye hesaplamasında on binlerce fatura olduğunda sistem yavaşlamaz mı?"
> **Cevap:**  
> *"İlk prototipte `findAll()` ile kayıtlar belleğe çekiliyordu; bunu refactor ettik. `InvoiceRepository` ve `PaymentRepository` içerisine `GROUP BY partner_id` yapan indeksli SQL SUM agregasyon sorguları yazdık. Artık 50.000 fatura olsa bile hesaplama doğrudan PostgreSQL motorunda indeksler üzerinden mikrosaniyeler içinde tamamlanır ve JVM belleği şişmez."*

### Soru 4: "Dashboard istatistikleri sunucuyu yorar mı? Nasıl optimize ettin?"
> **Cevap:**  
> *"Dashboard'da hiçbir sahte (mock) veri yok. Bütün kartlar canlı API çağrılarıyla paralel olarak `Promise.all` üzerinden çekilir. Tablolarda sayfalama (pagination) kullanılarak yalnızca ihtiyaç duyulan 10, 25 veya 50 satırlık veriler DOM'a basılır. Böylece tarayıcı performansı ve network trafiği her zaman optimize kalır."*

### Soru 5: "RabbitMQ çökerse veya kapalıysa sistem durur mu?"
> **Cevap:**  
> *"Hayır, dayanıklılık (resilience) önceliğimizdir. `application.yml` dosyasında `spring.rabbitmq.listener.simple.auto-startup: false` ve `missing-queues-fatal: false` yapılandırılmıştır. RabbitMQ erişilemez durumdaysa sistem Spring Application Events ile asenkron olayları uygulama içi event bus üzerinden güvenle yürütmeye devam eder."*

---

## 📊 4. Teknik Mimari Künyesi

| Katman | Teknoloji | Görev / Standart |
|---|---|---|
| **Backend** | Spring Boot 3.3.4, Java 21 | Modüler Monolit, Clean Architecture |
| **Veritabanı** | PostgreSQL 16 | Schema-per-Tenant, Flyway Migrations |
| **Mesajlaşma** | RabbitMQ 3.13 / AMQP | Asenkron Stok Rezervasyonu & Sevkiyat |
| **Güvenlik** | Spring Security 6 + JWT | Stateless Authentication, Role-based (Admin/Manager/User) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind | Logo/DİA ERP Kurumsal Teması, Dense Grid |
| **Bildirimler** | Zero-dependency React Toast Context | Slide-in animasyonlu, tip güvenli bildirimler |
| **Sayfalama** | Custom ErpDataGrid | Dinamik page-size, client/server pagination desteği |
