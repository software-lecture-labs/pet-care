package com.petcare.service;

import com.petcare.entity.User;
import com.petcare.repository.UserRepository;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Test
    void bosBilgilerleKayitYapilamaz() {

        AuthService authService = new AuthService(
                mock(UserRepository.class),
                mock(Pbkdf2PasswordHash.class)
        );

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

        AuthService authService = new AuthService(
                mock(UserRepository.class),
                mock(Pbkdf2PasswordHash.class)
        );

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

        AuthService authService = new AuthService(
                mock(UserRepository.class),
                mock(Pbkdf2PasswordHash.class)
        );

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
    void ayniEpostaIleKayitYapilamaz() {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        when(mockRepository.existsByEmail("test@example.com"))
                .thenReturn(true);

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

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

        verify(mockRepository)
                .existsByEmail("test@example.com");
    }

    @Test
    void hataliSifreyleGirisYapilamaz() {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("kayitliHash");

        when(mockRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(mockPasswordHash.verify(
                any(char[].class),
                eq("kayitliHash")
        )).thenReturn(false);

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(
                        "test@example.com",
                        "YanlisSifre123"
                )
        );

        assertEquals(
                "E-posta adresi veya şifre hatalı.",
                exception.getMessage()
        );

        verify(mockPasswordHash).verify(
                any(char[].class),
                eq("kayitliHash")
        );
    }

    @Test
    void dogruSifreyleGirisYapilabilir() {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        User user = new User();
        user.setFirstName("Test");
        user.setLastName("Kullanici");
        user.setEmail("test@example.com");
        user.setPasswordHash("kayitliHash");

        when(mockRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(mockPasswordHash.verify(
                any(char[].class),
                eq("kayitliHash")
        )).thenReturn(true);

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        User result = authService.login(
                "test@example.com",
                "DogruSifre123"
        );

        assertSame(user, result);

        verify(mockRepository)
                .findByEmail("test@example.com");

        verify(mockPasswordHash).verify(
                any(char[].class),
                eq("kayitliHash")
        );
    }

    @Test
    void gecerliBilgilerleKayitYapilabilir() {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        when(mockRepository.existsByEmail("test@example.com"))
                .thenReturn(false);

        when(mockPasswordHash.generate(any(char[].class)))
                .thenReturn("guvenliTestHash");

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        User result = authService.register(
                "Test",
                "Kullanici",
                "test@example.com",
                "Test12345!"
        );

        assertNotNull(result);
        assertEquals("Test", result.getFirstName());
        assertEquals("Kullanici", result.getLastName());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("guvenliTestHash", result.getPasswordHash());

        verify(mockRepository).save(same(result));

        verify(mockPasswordHash)
                .generate(any(char[].class));
    }

    @Test
    void emailBuyukKucukHarfVeBosluklardanArindirilir() {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        when(mockRepository.existsByEmail("ali@example.com"))
                .thenReturn(false);

        when(mockPasswordHash.generate(any(char[].class)))
                .thenReturn("testHash");

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        User user = authService.register(
                "Ali",
                "Yılmaz",
                " Ali@Example.COM ",
                "Test12345!"
        );

        assertEquals("ali@example.com", user.getEmail());

        verify(mockRepository)
                .existsByEmail("ali@example.com");

        verify(mockRepository).save(same(user));
    }

    @Test
    void farkliBuyukKucukHarflerleGirisYapilabilir() {

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

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        User result = authService.login(
                " ALI@Example.COM ",
                "Test12345!"
        );

        assertEquals("ali@example.com", result.getEmail());

        verify(mockRepository)
                .findByEmail("ali@example.com");
    }

    @Test
    void bilinmeyenEmailVeYanlisSifreAyniHatayiVermeli() {

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
        )).thenReturn(false);

        when(mockRepository.findByEmail("bilinmeyen@example.com"))
                .thenReturn(Optional.empty());

        when(mockPasswordHash.generate(any(char[].class)))
                .thenReturn("dummyTestHash");

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        authService.initializePasswordHash();

        IllegalArgumentException wrongPassword = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(
                        "ali@example.com",
                        "YanlisSifre123"
                )
        );

        IllegalArgumentException unknownEmail = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(
                        "bilinmeyen@example.com",
                        "YanlisSifre123"
                )
        );

        assertEquals(
                wrongPassword.getMessage(),
                unknownEmail.getMessage()
        );
    }

    @Test
    void bilinmeyenEmailIcinSahteHashDogrulanmali() {

        UserRepository mockRepository = mock(UserRepository.class);
        Pbkdf2PasswordHash mockPasswordHash =
                mock(Pbkdf2PasswordHash.class);

        when(mockRepository.findByEmail("bilinmeyen@example.com"))
                .thenReturn(Optional.empty());

        when(mockPasswordHash.generate(any(char[].class)))
                .thenReturn("dummyTestHash");

        AuthService authService = new AuthService(
                mockRepository,
                mockPasswordHash
        );

        authService.initializePasswordHash();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(
                        "bilinmeyen@example.com",
                        "YanlisSifre123"
                )
        );

        assertEquals(
                "E-posta adresi veya şifre hatalı.",
                exception.getMessage()
        );

        verify(mockPasswordHash).verify(
                any(char[].class),
                eq("dummyTestHash")
        );
    }
}