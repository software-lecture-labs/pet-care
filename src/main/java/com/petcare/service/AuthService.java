package com.petcare.service;

import com.petcare.entity.User;
import com.petcare.repository.UserRepository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import jakarta.transaction.Transactional;
import java.util.Optional;
import java.sql.SQLException;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Locale;

@ApplicationScoped
public class AuthService {

    @Inject
    private UserRepository userRepository;

    @Inject
    private Pbkdf2PasswordHash passwordHash;
    private String dummyPasswordHash;
    @PostConstruct
    public void initializePasswordHash() {

        passwordHash.initialize(Map.of(
                "Pbkdf2PasswordHash.Algorithm", "PBKDF2WithHmacSHA256",
                "Pbkdf2PasswordHash.Iterations", "600000"
        ));

        // Kayıtlı olmayan kullanıcılar için sahte hash oluştur
        dummyPasswordHash = passwordHash.generate(
                "PetCareDummyPassword2026!".toCharArray()
        );
    }

    @Transactional
    public User register(
            String firstName,
            String lastName,
            String email,
            String password
    ) {

        // 1. Boş alan kontrolü
        if (firstName == null || firstName.isBlank()
                || lastName == null || lastName.isBlank()
                || email == null || email.isBlank()
                || password == null || password.isBlank()) {

            throw new IllegalArgumentException(
                    "Lütfen tüm alanları doldurun."
            );
        }

        // 2. İsimleri düzenle
        firstName = firstName.trim();
        lastName = lastName.trim();

        // 3. E-posta adresini standartlaştır
        email = email.trim().toLowerCase(Locale.ROOT);

        // 4. Uzunluk kontrolleri
        if (firstName.length() > 50 || lastName.length() > 50) {
            throw new IllegalArgumentException(
                    "Ad ve soyad en fazla 50 karakter olabilir."
            );
        }

        if (email.length() > 254 || !email.matches(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        )) {
            throw new IllegalArgumentException(
                    "Geçerli bir e-posta adresi girin."
            );
        }

        // 5. Şifre uzunluğu kontrolü
        if (password.length() < 8) {
            throw new IllegalArgumentException(
                    "Şifre en az 8 karakter olmalıdır."
            );
        }
        if (password.length() > 128) {
            throw new IllegalArgumentException(
                    "Şifre en fazla 128 karakter olabilir."
            );
        }

        // 6. E-posta daha önce kullanılmış mı?
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Bu e-posta adresi zaten kayıtlı."
            );
        }

        String hashedPassword = passwordHash.generate(password.toCharArray());

        // 8. Kullanıcı nesnesini oluştur
        User user = new User();

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPasswordHash(hashedPassword);

        // 9. PostgreSQL'e kaydet
        try {
            userRepository.save(user);
        } catch (jakarta.persistence.PersistenceException exception) {
            if (isUniqueEmailViolation(exception)) {
                throw new IllegalArgumentException(
                        "Bu e-posta adresi zaten kayıtlı.",
                        exception
                );
            }

            throw exception;
        }

        return user;
    }

    // Kullanıcının giriş bilgilerini doğrular.
    public User login(String email, String password) {

        // Boş alan kontrolü
        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {

            throw new IllegalArgumentException(
                    "E-posta ve şifre alanlarını doldurun."
            );
        }

        // E-posta adresini standartlaştır
        email = email.trim().toLowerCase(Locale.ROOT);

        // Kullanıcıyı veritabanında ara
        User user = userRepository.findByEmail(email)
                .orElse(null);

        // Kullanıcı bulunamadığında da PBKDF2 doğrulaması yap
        if (user == null) {

            passwordHash.verify(
                    password.toCharArray(),
                    dummyPasswordHash
            );

            throw new IllegalArgumentException(
                    "E-posta adresi veya şifre hatalı."
            );
        }

        // Girilen şifreyi kayıtlı hash ile doğrula
        boolean passwordCorrect = passwordHash.verify(
                password.toCharArray(),
                user.getPasswordHash()
        );

        if (!passwordCorrect) {
            throw new IllegalArgumentException(
                    "E-posta adresi veya şifre hatalı."
            );
        }

        return user;
    }

    // Kullanıcıyı ID üzerinden bulur.
    public Optional<User> currentUser(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }

        return userRepository.findById(userId);
    }
    private boolean isUniqueEmailViolation(Throwable exception) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof SQLException sqlException) {
                if ("23505".equals(sqlException.getSQLState())) {
                    return true;
                }
            }

            cause = cause.getCause();
        }

        return false;
    }
}