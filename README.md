# PetCare 🐾

PetCare, evcil hayvan sahiplerinin hayvanlarının sağlık bilgilerini, aşılarını, veteriner randevularını ve bakım süreçlerini tek bir platform üzerinden yönetmelerini amaçlayan bir web uygulamasıdır.

Proje, kullanıcı dostu bir arayüz ve güvenli bir altyapı hedeflenerek geliştirilmektedir.

## Özellikler

### Tamamlanan Özellikler

- Kullanıcı kaydı, girişi ve çıkışı
- Oturum yönetimi
- Şifrelerin PBKDF2 algoritmasıyla hashlenmesi
- Form doğrulamaları ve e-posta benzersizlik kontrolü
- Başarısız giriş denemelerinin sınırlandırılması (Rate Limiting)
- Validasyon hatalarında ilgili alan adlarının gösterilmesi

### Planlanan Özellikler

- Evcil hayvan profili yönetimi
- Aşı ve sağlık kayıtları
- Veteriner randevuları
- Hatırlatıcılar
- Pet sitter ve rezervasyon işlemleri

## Kullanılan Teknolojiler

| Alan | Teknolojiler |
|---|---|
| Backend | Java 21, Jakarta EE 10 |
| Frontend | HTML, CSS, JavaScript |
| Veritabanı | PostgreSQL 16 |
| ORM | JPA (EclipseLink) |
| Sunucu | Payara Server 6 |
| Test | JUnit 5, Mockito |
| Diğer | Maven, Git, GitHub |

## Veteriner Ara Modülü

Veteriner Ara modülü, kullanıcıların veteriner kliniklerini listeleyebilmesini, klinik adı veya ilçe üzerinden arama yapabilmesini ve klinik detaylarına ulaşabilmesini sağlar.

### Modül Özellikleri

- **Klinik Listeleme:** Veritabanındaki aktif veteriner kliniklerinin görüntülenmesi.
- **Klinik Arama:** Klinik adına göre arama yapılması.
- **İlçe Filtreleme:** İstanbul'daki ilçelere göre kliniklerin filtrelenmesi.
- **Klinik Detayları:** Klinik adı, adres, ilçe ve iletişim bilgilerinin görüntülenmesi.
- **Harita Entegrasyonu:** Google Maps üzerinden klinik adreslerinin aranması ve yol tarifi bağlantılarının sunulması.
- **Responsive Arayüz:** Farklı ekran boyutlarına uyumlu kullanıcı arayüzü.

### Backend Mimarisi

Modül, projenin katmanlı mimarisine uygun olarak geliştirilmiştir.

| Dosya | Görevi |
|---|---|
| `ClinicController.java` | Klinik REST API isteklerini karşılar. |
| `ClinicService.java` | Klinik işlemlerinin iş mantığını yönetir. |
| `ClinicRepository.java` | Klinik verilerinin veritabanından alınmasını sağlar. |
| `Clinic.java` | Klinik veritabanı modelini temsil eder. |

### REST API

| Metot | Endpoint | Açıklama |
|---|---|---|
| GET | `/api/clinics` | Aktif klinikleri listeler. |
| GET | `/api/clinics?name=...` | Klinik adına göre arama yapar. |
| GET | `/api/clinics?district=...` | İlçeye göre klinikleri filtreler. |
| GET | `/api/clinics/{id}` | Belirtilen kliniğin detaylarını getirir. |

API adresleri `/PetCare` uygulama context root'u altında çalışmaktadır.

### Frontend Dosyaları

- `veterinarians.html` — Veteriner Ara sayfası
- `veterinarians.css` — Sayfa tasarımı ve responsive stiller
- `veterinarians.js` — API bağlantıları, arama, filtreleme ve harita işlemleri
- `leaflet-fallback.css` — Harita bileşeni için yedek stiller

### Veritabanı

Klinik verileri PostgreSQL üzerinde `clinics` tablosunda tutulmaktadır.

İlgili SQL dosyaları:

- `clinics_schema.sql` — Klinik tablosunu oluşturur.
- `clinics_seed.sql` — Geliştirme amaçlı başlangıç verilerini içerir.
- `clinics_real_seed.sql` — Klinik kayıtlarını ekler.

SQL dosyaları `src/main/resources/db/` dizininde bulunmaktadır.

**Not:** Klinik arama ve harita özellikleri, randevu oluşturma işleminden bağımsızdır. Listelenen tüm kliniklerde uygulama üzerinden randevu alınabildiği anlamına gelmez. Harita araması da adresin kesin olarak doğrulandığını garanti etmez.




## Proje Mimarisi

PetCare, katmanlı mimari kullanılarak geliştirilmektedir.

```text
src/main/java/com/petcare/
│
├── config/         → REST API yapılandırması
├── controller/     → REST API işlemleri
├── entity/         → Veri modelleri
├── exception/      → Hata yönetimi
├── repository/     → Veritabanı işlemleri
└── service/        → İş mantığı ve güvenlik
```

Katmanların sorumlulukları:

- **Controller:** HTTP isteklerini karşılar ve API yanıtlarını oluşturur.
- **Service:** İş kurallarını ve kimlik doğrulama işlemlerini yönetir.
- **Repository:** Veritabanı işlemlerini gerçekleştirir.
- **Entity:** Veritabanında saklanan veri modellerini temsil eder.
- **Exception:** Validasyon hatalarını uygun HTTP yanıtlarına dönüştürür.
- **Config:** REST API yapılandırmasını içerir.

## Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/software-lecture-labs/pet-care.git
cd pet-care
```

### 2. Veritabanını Oluşturun

PostgreSQL üzerinde `petcare_db` veritabanını oluşturun.

pgAdmin üzerinden oluşturduğunuz veritabanına bağlanarak
aşağıdaki SQL dosyalarını belirtilen sırayla çalıştırın:

| Sıra | SQL Dosyası | Açıklama |
|---|---|---|
| 1 | `schema.sql` | Kullanıcı ve hayvan tablolarını oluşturur. |
| 2 | `appointments_schema.sql` | Veteriner, müsait saat ve randevu tablolarını oluşturur. |
| 3 | `appointments_seed.sql` | Geliştirme ve test için örnek veterinerleri ve müsait saatleri ekler. |

SQL dosyaları aşağıdaki dizinde bulunmaktadır:

```text
src/main/resources/db/
```

#### Randevu Modülü Bağımlılığı

Randevu modülü, Hayvanlarım modülündeki `pets` tablosuna
bağımlıdır.

Modüller henüz birleştirilmediyse `schema.sql` dosyasının
`feature/pets-page` branch'indeki sürümü kullanılmalıdır.

Randevular modülünün arayüz üzerinden eksiksiz
kullanılabilmesi için Hayvanlarım modülünün de
uygulamaya dahil edilmesi gerekmektedir.

#### Mevcut Veritabanının Güncellenmesi

Eski veritabanı şemasını kullanan geliştiriciler,
kullanıcı veya evcil hayvan silindiğinde ilişkili
randevuların da otomatik olarak silinmesi için
aşağıdaki SQL sorgusunu çalıştırmalıdır:

```sql
BEGIN;

ALTER TABLE appointments
DROP CONSTRAINT fk_appointment_user,
    ADD CONSTRAINT fk_appointment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE appointments
DROP CONSTRAINT fk_appointment_pet,
    ADD CONSTRAINT fk_appointment_pet
        FOREIGN KEY (pet_id)
        REFERENCES pets(id) ON DELETE CASCADE;

COMMIT;
```

Yeni kurulumlarda veya CASCADE kuralları zaten tanımlanmış
veritabanlarında bu işlemin yapılmasına gerek yoktur.

`ON DELETE CASCADE`, hesap ve evcil hayvan silme işlemlerinde
veri bütünlüğünü sağlamak amacıyla tercih edilmiştir.
Bu yaklaşım geçmiş randevuları da sildiğinden, ileride
veteriner randevu geçmişi modülü geliştirilirse yeniden
değerlendirilmelidir.

#### Örnek Veteriner ve Randevu Verileri

`appointments_seed.sql` dosyası geliştirme ve test
ortamlarında kullanılmak üzere hazırlanmıştır.

Dosya çalıştırıldığında:

- 6 örnek veteriner oluşturulur.
- Yarından itibaren 7 günlük müsait saat oluşturulur.
- Her veteriner için günlük 12 randevu aralığı oluşturulur.
- Her randevu aralığı 30 dakikadır.
- Boş veritabanında toplam 504 müsait randevu aralığı oluşturulur.
- Saatler Türkiye saat dilimine göre belirlenir.
- Kullanıcılar adına otomatik randevu oluşturulmaz.

Seed dosyası aynı gün içerisinde sıralı olarak yeniden
çalıştırıldığında mükerrer kayıt oluşturmaz.

İleri tarihli müsait saatler eklemek için dosya daha
sonraki günlerde tekrar çalıştırılabilir.

> **Not:** Seed dosyası yalnızca geliştirme ve test
> ortamlarında kullanılmalıdır. Üretim ortamında
> çalıştırılması önerilmez.

### 3. Payara Server'ı Yapılandırın

Payara yönetim paneli:

`http://localhost:4848`

#### JDBC Connection Pool

| Özellik | Değer |
|---|---|
| Pool Name | PetCarePool |
| Resource Type | javax.sql.DataSource |
| Database Driver Vendor | PostgreSQL |
| DatabaseName | petcare_db |
| ServerName | localhost |
| PortNumber | 5432 |
| User / Password | PostgreSQL bağlantı bilgileriniz |

PostgreSQL JDBC sürücüsünün Payara tarafından erişilebilir olduğundan emin olun.

Bağlantıyı **Ping** işlemiyle doğrulayın.

#### JDBC Resource

- **JNDI Name:** `jdbc/PetCareDS`
- **Pool Name:** `PetCarePool`


### Fotoğraf Yükleme Klasörünün Yapılandırılması

Evcil hayvan fotoğrafları, uygulamanın dağıtım klasörü dışında
saklanır. Fotoğrafların kaydedileceği dizin `PETCARE_UPLOAD_DIR`
ortam değişkeni üzerinden belirlenir.

Bu değişkenin tanımlanması zorunludur.

İşletim sistemine göre örnek dizinler:

- Windows: `C:\PetCare\uploads`
- Linux: `/var/lib/petcare/uploads`
- macOS: `/Users/Shared/petcare/uploads`
- Docker: `/app/uploads`

Windows PowerShell üzerinden örnek tanımlama:

```powershell
$env:PETCARE_UPLOAD_DIR = "C:\PetCare\uploads"
```

Linux/macOS terminalinde örnek tanımlama:

```bash
export PETCARE_UPLOAD_DIR=/var/lib/petcare/uploads
```

**Önemli:** Ortam değişkeni, Payara Server'ı çalıştıran
işlem tarafından erişilebilir olmalıdır. Değişken
tanımlandıktan sonra Payara Server yeniden başlatılmalıdır.

Uygulama, belirtilen klasör mevcut değilse fotoğraf
kaydedilirken klasörü otomatik olarak oluşturur.
Payara'nın ilgili dizinde yazma ve okuma izinleri
bulunmalıdır.

Docker ortamında fotoğrafların kalıcı olması için
yükleme klasörü bir volume ile eşleştirilmelidir.

Fotoğraf yükleme sınırları:
- Desteklenen formatlar: JPEG ve PNG
- Maksimum dosya boyutu: 5 MB
- Maksimum çözünürlük: 4096 × 4096 piksel
```

### 4. Projeyi Çalıştırın

Projeyi Maven ile derleyin:

```bash
mvn clean package
```

Oluşan WAR dosyasını Payara üzerinden deploy edin:

```text
target/PetCare.war
```

**Context Root:** `/PetCare`

**Uygulama adresi:**

`http://localhost:8080/PetCare/`

> **Not:** Maven komutu terminalde tanınmıyorsa IntelliJ IDEA üzerinden Maven → Lifecycle → package kullanılabilir.

## Güvenlik

Kullanıcı kimlik doğrulama sisteminde aşağıdaki güvenlik önlemleri uygulanmıştır:

- PBKDF2-HMAC-SHA256 ile şifre hashleme
- 600.000 PBKDF2 iterasyonu
- HttpOnly oturum çerezleri
- 30 dakikalık oturum süresi
- E-posta ve şifre doğrulamaları
- 15 dakikalık pencere içerisinde en fazla 5 başarısız giriş denemesi
- Başarılı giriş sonrasında başarısız deneme sayacının sıfırlanması
- Süresi dolan giriş denemesi kayıtlarının periyodik olarak temizlenmesi

### Rate Limiting Mekanizması

PetCare'de başarısız giriş denemeleri e-posta adresi bazında takip edilmektedir.

Bir e-posta adresi için 15 dakika içerisinde 5 başarısız giriş denemesi gerçekleştiğinde ilgili e-posta adresi geçici olarak engellenmektedir.

Engelleme süresi dolduğunda yeniden giriş yapılabilir.

Giriş denemeleri sunucu belleğinde `ConcurrentHashMap` kullanılarak saklanmaktadır.

Süre kontrolünde `Clock` kullanılması sayesinde zaman bağımlı işlemler birim testlerinde gerçek süreyi beklemeden doğrulanabilmektedir.

Süresi dolan kayıtlar, Jakarta EE zamanlayıcısı aracılığıyla periyodik olarak temizlenmektedir.

## Testler

JUnit 5 ve Mockito kullanılarak kullanıcı kaydı, giriş işlemleri ve rate limiting mekanizması için birim testleri hazırlanmıştır.

Testlerde aşağıdaki durumlar kontrol edilmektedir:

- Geçersiz kayıt bilgilerinin reddedilmesi
- Aynı e-posta adresiyle tekrar kayıt yapılmasının engellenmesi
- Doğru ve yanlış şifreyle giriş işlemleri
- E-posta adreslerinin normalize edilmesi
- Başarısız giriş denemelerinin sayılması
- Beş başarısız giriş denemesinden sonra engelleme
- Başarılı giriş sonrasında sayacın sıfırlanması
- Engelleme süresinin dolması
- Süresi dolan kayıtların temizlenmesi

Testleri çalıştırmak için:

```bash
mvn test
```


