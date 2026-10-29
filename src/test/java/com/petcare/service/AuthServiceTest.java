package com.petcare.service;

import org.junit.jupiter.api.Test;
import com.petcare.repository.UserRepository;
import org.mockito.Mockito;
import com.petcare.entity.User;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;

import java.util.Optional;

import static org.mockito.Mockito.*;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    @Test
    void bosBilgilerleKayitYapilamaz() {

        AuthService authService = new AuthService();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.register("", "", "", "")
        );

        assertEquals(
                "Lütfen tüm alanları doldurun.",
                exception.getMessage()
        );
    }

    @Test
    void kisaSifreyleKayitYapilamaz() {

        AuthService authService = new AuthService();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.register(
                        "Test",
                        "Kullanici",
                        "test@example.com",
                        "1234567"
                )
        );

        assertEquals(
                "Şifre en az 8 karakter olmalıdır.",
                exception.getMessage()
        );
    }

    @Test
    void uzunSifreyleKayitYapilamaz() {

        AuthService authService = new AuthService();

        String uzunSifre = "a".repeat(129);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.register(
                        "Test",
                        "Kullanici",
                        "test@example.com",
                        uzunSifre
                )
        );

        assertEquals(
                "Şifre en fazla 128 karakter olabilir.",
                exception.getMessage()
        );
    }

    @Test
    void ayniEpostaIleKayitYapilamaz() throws Exception {

        // Sahte repository oluştur
        UserRepository mockRepository = Mockito.mock(UserRepository.class);

        // E-posta zaten kayıtlıymış gibi davran
        Mockito.when(mockRepository.existsByEmail("test@example.com"))
                .thenReturn(true);

        // Test edilecek servisi oluştur
        AuthService authService = new AuthService();

        // Repository bağımlılığını test için yerleştir
        Field field = AuthService.class.getDeclaredField("userRepository");
        field.setAccessible(true);
        field.set(authService, mockRepository);

        // Aynı e-postayla kayıt dene
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.register(
                        "Test",
                        "Kullanici",
                        "test@example.com",
                        "Test12345!"
                )
        );

        assertEquals(
                "Bu e-posta adresi zaten kayıtlı.",
                exception.getMessage()
        );

        // Repository kontrolünün çağrıldığını doğrula
        Mockito.verify(mockRepository)
                .existsByEmail("test@example.com");
    }

    @Test
    void hataliSifreyleGirisYapilamaz() throws Exception {

        // Sahte bağımlılıkları oluştur
        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        // Kayıtlı kullanıcı oluştur
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("kayitliHash");

        // Repository kullanıcıyı bulsun
        when(mockRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        // Şifre doğrulaması başarısız olsun
        when(mockPasswordHash.verify(
                any(char[].class),
                eq("kayitliHash")
        )).thenReturn(false);

        AuthService authService = new AuthService();

        // Sahte repository'yi servise yerleştir
        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");

        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        // Sahte şifre doğrulayıcıyı servise yerleştir
        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");

        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        // Hatalı şifreyle giriş dene
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(
                        "test@example.com",
                        "YanlisSifre123"
                )
        );

        // Hata mesajını kontrol et
        assertEquals(
                "E-posta adresi veya şifre hatalı.",
                exception.getMessage()
        );

        // Şifre doğrulamasının çağrıldığını kontrol et
        verify(mockPasswordHash).verify(
                any(char[].class),
                eq("kayitliHash")
        );
    }

    @Test
    void dogruSifreyleGirisYapilabilir() throws Exception {

        // Sahte bağımlılıkları oluştur
        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        // Kayıtlı kullanıcı oluştur
        User user = new User();
        user.setFirstName("Test");
        user.setLastName("Kullanici");
        user.setEmail("test@example.com");
        user.setPasswordHash("kayitliHash");

        // Kullanıcı veritabanında bulunuyor
        when(mockRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        // Şifre doğru kabul ediliyor
        when(mockPasswordHash.verify(
                any(char[].class),
                eq("kayitliHash")
        )).thenReturn(true);

        AuthService authService = new AuthService();

        // Repository bağımlılığını yerleştir
        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");

        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        // Şifre doğrulayıcıyı yerleştir
        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");

        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        // Giriş işlemini gerçekleştir
        User result = authService.login(
                "test@example.com",
                "DogruSifre123"
        );

        // Doğru kullanıcının döndüğünü kontrol et
        assertSame(user, result);

        // Repository ve şifre doğrulaması çağrıldı mı?
        verify(mockRepository).findByEmail("test@example.com");

        verify(mockPasswordHash).verify(
                any(char[].class),
                eq("kayitliHash")
        );
    }

    @Test
    void gecerliBilgilerleKayitYapilabilir() throws Exception {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        // E-posta daha önce kullanılmamış
        when(mockRepository.existsByEmail("test@example.com"))
                .thenReturn(false);

        // Şifre hash işlemini taklit et
        when(mockPasswordHash.generate(any(char[].class)))
                .thenReturn("guvenliTestHash");

        AuthService authService = new AuthService();

        // Sahte repository'yi yerleştir
        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");

        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        // Sahte şifre doğrulayıcıyı yerleştir
        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");

        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        // Kayıt işlemini gerçekleştir
        User result = authService.register(
                "Test",
                "Kullanici",
                "test@example.com",
                "Test12345!"
        );

        // Kullanıcı bilgilerini kontrol et
        assertNotNull(result);
        assertEquals("Test", result.getFirstName());
        assertEquals("Kullanici", result.getLastName());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("guvenliTestHash", result.getPasswordHash());

        // Kullanıcı repository'ye gönderildi mi?
        verify(mockRepository).save(same(result));

        // Şifre hash işlemi çağrıldı mı?
        verify(mockPasswordHash).generate(any(char[].class));
    }

    @Test
    void emailBuyukKucukHarfVeBosluklardanArindirilir() throws Exception {

        // Sahte bağımlılıkları oluştur
        UserRepository mockRepository = mock(UserRepository.class);

        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        // E-posta veritabanında kayıtlı değil
        when(mockRepository.existsByEmail("ali@example.com"))
                .thenReturn(false);

        // Şifre hashleme işlemini taklit et
        when(mockPasswordHash.generate(any(char[].class)))
                .thenReturn("testHash");

        AuthService authService = new AuthService();

        // Repository bağımlılığını yerleştir
        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");

        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        // Şifre doğrulayıcıyı yerleştir
        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");

        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        // Büyük harfli ve boşluklu e-posta ile kayıt ol
        User user = authService.register(
                "Ali",
                "Yılmaz",
                " Ali@Example.COM ",
                "Test12345!"
        );

        // E-posta küçük harfe dönüştürülmüş olmalı
        assertEquals("ali@example.com", user.getEmail());

        // Repository'de normalize edilmiş adres aranmalı
        verify(mockRepository).existsByEmail("ali@example.com");

        // Kullanıcı kaydedilmiş olmalı
        verify(mockRepository).save(same(user));
    }

    @Test
    void farkliBuyukKucukHarflerleGirisYapilabilir() throws Exception {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        User user = new User();
        user.setEmail("ali@example.com");
        user.setPasswordHash("testHash");

        when(mockRepository.findByEmail("ali@example.com"))
                .thenReturn(Optional.of(user));

        when(mockPasswordHash.verify(
                any(char[].class),
                eq("testHash")
        )).thenReturn(true);
        AuthService authService = new AuthService();

        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");
        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");
        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        User result = authService.login(
                " ALI@Example.COM ",
                "Test12345!"
        );

        assertEquals("ali@example.com", result.getEmail());

        verify(mockRepository).findByEmail("ali@example.com");
    }

    @Test
    void bilinmeyenEmailVeYanlisSifreAyniHatayiVermeli() throws Exception {

        UserRepository mockRepository = mock(UserRepository.class);

        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        User user = new User();
        user.setEmail("ali@example.com");
        user.setPasswordHash("testHash");

        // Kayıtlı kullanıcı, yanlış şifre
        when(mockRepository.findByEmail("ali@example.com"))
                .thenReturn(Optional.of(user));

        when(mockPasswordHash.verify(
                any(char[].class),
                eq("testHash")
        )).thenReturn(false);

        // Kayıtlı olmayan kullanıcı
        when(mockRepository.findByEmail("bilinmeyen@example.com"))
                .thenReturn(Optional.empty());

        AuthService authService = new AuthService();
        Field dummyField =
                AuthService.class.getDeclaredField("dummyPasswordHash");

        dummyField.setAccessible(true);
        dummyField.set(authService, "dummyTestHash");

        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");
        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");
        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        // Yanlış şifreyle giriş
        IllegalArgumentException wrongPassword =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> authService.login(
                                "ali@example.com",
                                "YanlisSifre123"
                        )
                );

        // Bilinmeyen e-postayla giriş
        IllegalArgumentException unknownEmail =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> authService.login(
                                "bilinmeyen@example.com",
                                "YanlisSifre123"
                        )
                );

        // İki hata mesajı aynı olmalı
        assertEquals(
                wrongPassword.getMessage(),
                unknownEmail.getMessage()
        );
    }

    @Test
    void bilinmeyenEmailIcinSahteHashDogrulanmali() throws Exception {

        // Sahte bağımlılıkları oluştur
        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        // Kullanıcı veritabanında bulunmuyor
        when(mockRepository.findByEmail("bilinmeyen@example.com"))
                .thenReturn(Optional.empty());

        AuthService authService = new AuthService();

        // Repository bağımlılığını yerleştir
        Field repositoryField =
                AuthService.class.getDeclaredField("userRepository");

        repositoryField.setAccessible(true);
        repositoryField.set(authService, mockRepository);

        // PBKDF2 bağımlılığını yerleştir
        Field passwordField =
                AuthService.class.getDeclaredField("passwordHash");

        passwordField.setAccessible(true);
        passwordField.set(authService, mockPasswordHash);

        // Test için sahte hash değerini ayarla
        Field dummyField =
                AuthService.class.getDeclaredField("dummyPasswordHash");

        dummyField.setAccessible(true);
        dummyField.set(authService, "dummyTestHash");

        // Bilinmeyen e-postayla giriş yapmayı dene
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(
                        "bilinmeyen@example.com",
                        "YanlisSifre123"
                )
        );

        // Hata mesajını kontrol et
        assertEquals(
                "E-posta adresi veya şifre hatalı.",
                exception.getMessage()
        );

        // Sahte PBKDF2 doğrulaması gerçekten çağrıldı mı?
        verify(mockPasswordHash).verify(
                any(char[].class),
                eq("dummyTestHash")
        );
    }
}