package com.petcare.service;

import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;

    private static final Duration BLOCK_DURATION =
            Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, AttemptInfo> attempts =
            new ConcurrentHashMap<>();

    public boolean isBlocked(String email) {
        String key = normalizeEmail(email);

        AttemptInfo info = attempts.get(key);

        if (info == null) {
            return false;
        }

        if (!Instant.now().isBefore(info.expiresAt())) {
            attempts.remove(key, info);
            return false;
        }

        return info.count() >= MAX_ATTEMPTS;
    }

    public void recordFailedAttempt(String email) {
        String key = normalizeEmail(email);
        Instant now = Instant.now();

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