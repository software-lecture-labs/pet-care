package com.petcare.service;

import jakarta.annotation.PostConstruct;
import jakarta.ejb.Schedule;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Singleton
@Startup
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;

    private static final Duration BLOCK_DURATION =
            Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, AttemptInfo> attempts =
            new ConcurrentHashMap<>();

    private Clock clock;

    // Payara tarafından kullanılır
    public LoginAttemptService() {
        this.clock = Clock.systemUTC();
    }

    // Testlerde zamanı kontrol etmek için kullanılır
    public LoginAttemptService(Clock clock) {
        this.clock = Objects.requireNonNull(clock);
    }

    public boolean isBlocked(String email) {
        String key = normalizeEmail(email);

        AttemptInfo info = attempts.get(key);

        if (info == null) {
            return false;
        }

        if (!Instant.now(clock).isBefore(info.expiresAt())) {
            attempts.remove(key, info);
            return false;
        }

        return info.count() >= MAX_ATTEMPTS;
    }

    public void recordFailedAttempt(String email) {
        String key = normalizeEmail(email);
        Instant now = Instant.now(clock);

        attempts.compute(key, (k, info) -> {

            if (info == null ||
                    !now.isBefore(info.expiresAt())) {

                return new AttemptInfo(
                        1,
                        now.plus(BLOCK_DURATION)
                );
            }

            return new AttemptInfo(
                    Math.min(info.count() + 1, MAX_ATTEMPTS),
                    info.expiresAt()
            );
        });
    }

    public void resetAttempts(String email) {
        attempts.remove(normalizeEmail(email));
    }

    // Her 5 dakikada bir süresi dolan kayıtları temizler
    @Schedule(hour = "*", minute = "*/5", second = "0", persistent = false)
    public void cleanupExpiredAttempts() {

        Instant now = Instant.now(clock);

        attempts.entrySet().removeIf(
                entry -> !now.isBefore(entry.getValue().expiresAt())
        );
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }

    private record AttemptInfo(
            int count,
            Instant expiresAt
    ) {
    }
}