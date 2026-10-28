PetCare

PetCare, evcil hayvan sahiplerinin hayvanlarının sağlık bilgilerini, aşılarını, veteriner randevularını ve bakım süreçlerini tek bir platform üzerinden yönetmelerini amaçlayan bir web uygulamasıdır.

Proje, kullanıcı dostu bir arayüz ve güvenli bir altyapı hedeflenerek geliştirilmektedir.

**Özellikler**

Tamamlanan

- Kullanıcı kaydı, girişi ve çıkışı

- Oturum yönetimi

- Şifrelerin PBKDF2 ile hashlenmesi

- Form doğrulamaları ve e-posta benzersizlik kontrolü

- Başarısız giriş denemelerinin sınırlandırılması (Rate Limiting)

Planlanan

- Evcil hayvan profili yönetimi

- Aşı ve sağlık kayıtları
 
- Veteriner randevuları

- Hatırlatıcılar

- Pet sitter ve rezervasyon işlemleri

Kullanılan Teknolojiler
| Alan | Teknolojiler |
|---|---|
| Backend | Java 21, Jakarta EE 10 |
| Frontend | HTML, CSS, JavaScript |
| Veritabanı | PostgreSQL 16 |
| ORM | JPA (EclipseLink) |
| Sunucu | Payara Server 6 |
| Test | JUnit 5, Mockito |
| Diğer | Maven, Git, GitHub |

Proje Mimarisi

PetCare, katmanlı mimari kullanılarak geliştirilmektedir.

src/main/java/com/petcare/
│
├── controller/    → REST API işlemleri
├── service/       → İş mantığı ve güvenlik
├── repository/    → Veritabanı işlemleri
└── entity/        → Veri modelleri

Kurulum

1. Projeyi Klonlayın

git clone https://github.com/software-lecture-labs/pet-care.git
cd pet-care

2. Veritabanını Oluşturun

PostgreSQL üzerinde petcare_db veritabanını oluşturun.

Ardından aşağıdaki SQL dosyasını çalıştırın:

src/main/resources/db/schema.sql

3. Payara Server'ı Yapılandırın

Payara yönetim paneli: http://localhost:4848

**JDBC Connection Pool**

| Özellik | Değer |
|---|---|
| Pool Name | PetCarePool |
| Resource Type | javax.sql.DataSource |
| Database Driver Vendor | PostgreSQL |
| DatabaseName | petcare_db |
| ServerName | localhost |
| PortNumber | 5432 |
| User / Password | PostgreSQL bilgileriniz |

PostgreSQL JDBC sürücüsünün Payara tarafından erişilebilir olduğundan emin olun ve bağlantıyı Ping ile doğrulayın.

**JDBC Resource**

- JNDI Name: `jdbc/PetCareDS`
- Pool Name: `PetCarePool`

4. Projeyi Çalıştırın

mvn clean package

Oluşan target/PetCare.war dosyasını Payara üzerinden deploy edin.

Context Root: PetCare

Uygulama: http://localhost:8080/PetCare/

Maven terminalde tanınmıyorsa IntelliJ IDEA üzerinden Maven → Lifecycle → package kullanılabilir.

Güvenlik

Kullanıcı kimlik doğrulama sisteminde aşağıdaki önlemler uygulanmıştır:

- PBKDF2-HMAC-SHA256 ile şifre hashleme

- 600.000 PBKDF2 iterasyonu

- HttpOnly oturum çerezleri

- 30 dakikalık oturum süresi

- E-posta ve şifre doğrulamaları

- 15 dakikalık pencere içinde 5 başarısız giriş denemesi sınırı

Rate limiting şu anda sunucu belleğinde çalışmaktadır. HTTPS, Secure Cookie ve ek güvenlik iyileştirmeleri geliştirme planındadır.

Testler

JUnit 5 ve Mockito kullanılarak kullanıcı kayıt, giriş ve rate limiting işlemleri için 10 birim testi hazırlanmıştır.

Testleri çalıştırmak için:

mvn test

