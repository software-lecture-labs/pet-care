package com.petcare.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    @Test
    void besBasarisizDenemedenSonraGirisEngellenir() {

        LoginAttemptService service = new LoginAttemptService();

        String email = "test@example.com";

        // Başlangıçta engel olmamalı
        assertFalse(service.isBlocked(email));

        // 5 başarısız giriş denemesi
        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        // Artık giriş engellenmeli
        assertTrue(service.isBlocked(email));
    }

    @Test
    void dortBasarisizDenemedeGirisEngellenmez() {

        LoginAttemptService service = new LoginAttemptService();

        String email = "test@example.com";

        for (int i = 0; i < 4; i++) {
            service.recordFailedAttempt(email);
        }

        assertFalse(service.isBlocked(email));
    }

    @Test
    void basariliGirisSonrasiSayacSifirlanir() {

        LoginAttemptService service = new LoginAttemptService();

        String email = "test@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        assertTrue(service.isBlocked(email));

        // Başarılı giriş sonrasında çağrılan metot
        service.resetAttempts(email);

        // Engel kaldırılmış olmalı
        assertFalse(service.isBlocked(email));
    }
}