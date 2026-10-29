package com.petcare.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    private static final Instant START_TIME =
            Instant.parse("2026-01-01T12:00:00Z");

    // Testlerde zamanı değiştirebilmek için yardımcı metot
    private LoginAttemptService createService(Instant time) {
        Clock clock = Clock.fixed(time, ZoneOffset.UTC);
        return new LoginAttemptService(clock);
    }

    @Test
    void besBasarisizDenemedenSonraGirisEngellenir() {

        LoginAttemptService service = createService(START_TIME);

        String email = "test@example.com";

        assertFalse(service.isBlocked(email));

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        assertTrue(service.isBlocked(email));
    }

    @Test
    void dortBasarisizDenemedeGirisEngellenmez() {

        LoginAttemptService service = createService(START_TIME);

        String email = "test@example.com";

        for (int i = 0; i < 4; i++) {
            service.recordFailedAttempt(email);
        }

        assertFalse(service.isBlocked(email));
    }

    @Test
    void basariliGirisSonrasiSayacSifirlanir() {

        LoginAttemptService service = createService(START_TIME);

        String email = "test@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        assertTrue(service.isBlocked(email));

        service.resetAttempts(email);

        assertFalse(service.isBlocked(email));
    }

    @Test
    void onBesDakikaDolmadanEngelDevamEder() {

        // Zamanı sabitliyoruz
        LoginAttemptService service = createService(START_TIME);

        String email = "test@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        // Clock.fixed kullanıldığı için zaman ilerlemez.
        // Dolayısıyla engel devam etmelidir.
        assertTrue(service.isBlocked(email));
    }

    @Test
    void farkliEpostaAdreslerininDenemeleriBagimsizdir() {

        LoginAttemptService service = createService(START_TIME);

        String firstEmail = "ali@example.com";
        String secondEmail = "ayse@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(firstEmail);
        }

        assertTrue(service.isBlocked(firstEmail));
        assertFalse(service.isBlocked(secondEmail));
    }

    @Test
    void suresiDolmayanKayitlarTemizlikteKorunur() {

        LoginAttemptService service = createService(START_TIME);

        String email = "test@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        service.cleanupExpiredAttempts();

        assertTrue(service.isBlocked(email));
    }

    @Test
    void onBesDakikaSonraEngelKalkar() {

        Clock baslangicSaati = Clock.fixed(
                START_TIME,
                ZoneOffset.UTC
        );

        // Test sırasında zamanı ilerletebilmek için değiştirilebilir Clock
        class TestClock extends Clock {
            private Instant currentTime = START_TIME;

            @Override
            public ZoneOffset getZone() {
                return ZoneOffset.UTC;
            }

            @Override
            public Clock withZone(java.time.ZoneId zone) {
                return Clock.fixed(currentTime, zone);
            }

            @Override
            public Instant instant() {
                return currentTime;
            }

            void advance(java.time.Duration duration) {
                currentTime = currentTime.plus(duration);
            }
        }

        TestClock clock = new TestClock();
        LoginAttemptService service = new LoginAttemptService(clock);

        String email = "test@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        assertTrue(service.isBlocked(email));

        // Zamanı 15 dakika ilerlet
        clock.advance(java.time.Duration.ofMinutes(15));

        // Engel kalkmış olmalı
        assertFalse(service.isBlocked(email));
    }

    @Test
    void suresiDolanKayitlarTemizlenir() {

        class TestClock extends Clock {
            private Instant currentTime = START_TIME;

            @Override
            public java.time.ZoneId getZone() {
                return ZoneOffset.UTC;
            }

            @Override
            public Clock withZone(java.time.ZoneId zone) {
                return Clock.fixed(currentTime, zone);
            }

            @Override
            public Instant instant() {
                return currentTime;
            }

            void advance(java.time.Duration duration) {
                currentTime = currentTime.plus(duration);
            }
        }

        TestClock clock = new TestClock();
        LoginAttemptService service = new LoginAttemptService(clock);

        String email = "test@example.com";

        for (int i = 0; i < 5; i++) {
            service.recordFailedAttempt(email);
        }

        assertTrue(service.isBlocked(email));

        // Kayıtların süresini doldur
        clock.advance(java.time.Duration.ofMinutes(16));

        // Otomatik zamanlayıcının çağıracağı metodu test et
        service.cleanupExpiredAttempts();

        assertFalse(service.isBlocked(email));
    }
}