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
- Veteriner kliniklerinin listelenmesi, aranması ve ilçe bazında filtrelenmesi
- Klinik detayları, Google Maps konum araması ve yol tarifi bağlantıları

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

## Proje Mimarisi

PetCare, katmanlı mimari kullanılarak geliştirilmektedir.

```text
src/main/java/com/petcare/
│
├── config/         → REST API yapılandırması
├── controller/     → REST API işlemleri
├── dto/            → API veri aktarım modelleri
├── entity/         → Veri modelleri
├── exception/      → Hata yönetimi
├── repository/     → Veritabanı işlemleri
└── service/        → İş mantığı ve güvenlik
```

Katmanların sorumlulukları:

- **Controller:** HTTP isteklerini karşılar ve API yanıtlarını oluşturur.
- **DTO:** API üzerinden taşınan verilerin yapısını tanımlar.
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
| 3 | `health_records_schema.sql` | Hayvanlara ait sağlık kayıtları tablosunu oluşturur. |
| 4 | `clinics_schema.sql` | Klinik tablosunu ve veteriner-klinik ilişkisini oluşturur. |
| 5 | `appointments_seed.sql` | Geliştirme ve test için örnek veterinerleri ve müsait saatleri ekler. |
| 6 | `clinics_real_seed.sql` | Veteriner Ara sayfası için klinik kayıtlarını ekler. |
| 7 (isteğe bağlı) | `clinics_seed.sql` | Geliştirme ve test için demo klinik kaydını ekler. |

SQL dosyaları aşağıdaki dizinde bulunmaktadır:

```text
src/main/resources/db/
```

#### Klinik Modülü Bağımlılığı

`clinics_schema.sql`, `veterinarians` tablosuna foreign key alanı eklediği için `appointments_schema.sql` dosyasından sonra çalıştırılmalıdır. Klinik seed dosyaları ise `clinics_schema.sql` dosyasından sonra çalıştırılır. `health_records_schema.sql`, `pets` tablosuna bağımlıdır ve `schema.sql` sonrasında çalıştırılmalıdır.

`clinics_seed.sql` isteğe bağlıdır. Bu dosyadaki eski demo veteriner (Dr. Ahmet Yılmaz), güncel `appointments_seed.sql` dosyasındaki altı örnek veteriner arasında bulunmadığından yeni kurulumda otomatik bağlantı oluşmaz. Demo klinik Veteriner Ara arayüzünde gösterilmez. Klinik listesi için `clinics_real_seed.sql` yeterlidir; randevu modülünün başlangıç verileri bağımsızdır.

Mevcut veritabanında gerekli tablolar zaten varsa veritabanını silmeden eksik klinik şeması ve gerekli seed dosyaları çalıştırılabilir.

**Not:** Klinik arama ve harita özellikleri, randevu oluşturma işleminden bağımsızdır. Listelenen tüm kliniklerde uygulama üzerinden randevu alınabildiği anlamına gelmez. Harita araması da adresin kesin olarak doğrulandığını garanti etmez.

#### Türkçe Arama ve PostgreSQL Gereksinimi

Klinik adı ve ilçe karşılaştırmalarında PostgreSQL tarafında `tr-TR-x-icu` collation kullanılır. Aranan metin ve veritabanındaki değer aynı Türkçe dil kurallarıyla küçük harfe dönüştürülür. Klinik ID değerleri native SQL ile belirlenir, ilgili `Clinic` nesneleri JPQL ile getirilir. Bu yaklaşım EclipseLink ile native SQL sonuçlarının entity eşleştirmesinde karşılaşılan sorunu önler.

PostgreSQL kurulumunda ICU desteği ve aşağıdaki collation bulunmalıdır. pgAdmin üzerinden kontrol edilebilir:

```sql
SELECT collname, collprovider
FROM pg_collation
WHERE collname = 'tr-TR-x-icu';
```

Sorgu sonuç döndürmüyorsa ICU destekli PostgreSQL kurulumu ve ilgili collation sağlanmalıdır. Veritabanının genel dil ayarını değiştirmek gerekmez.

#### Veteriner ve Klinik İlişkisi

`veterinarians.clinic_id`, `clinics.id` alanına bağlı, boş bırakılabilir bir foreign key alanıdır. Mevcut randevu sorguları ve başlangıç verileri `veterinarians.clinic_name` alanına bağımlı olduğu için bu alan korunmuştur. Klinik ve randevu modülleri entegre edilirken mevcut kayıtların eşleştirilmesi, sorguların ve testlerin güncellenmesi sonrasında `clinic_name` alanının kaldırılması değerlendirilecektir.

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
