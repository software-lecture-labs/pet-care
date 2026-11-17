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

Ardından aşağıdaki SQL dosyasını çalıştırın:

```text
src/main/resources/db/schema.sql
```

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


