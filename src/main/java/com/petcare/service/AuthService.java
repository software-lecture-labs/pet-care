package com.petcare.service;

import com.petcare.entity.User;
import com.petcare.repository.UserRepository;
import com.petcare.entity.Pet;
import com.petcare.repository.PetRepository;
import com.petcare.storage.PetPhotoStorage;

import jakarta.annotation.Resource;
import jakarta.transaction.Status;
import jakarta.transaction.TransactionSynchronizationRegistry;

import java.util.List;

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

    private final UserRepository userRepository;
    private final Pbkdf2PasswordHash passwordHash;

    private final PetRepository petRepository;
    private final PetPhotoStorage petPhotoStorage;

    @Resource
    private TransactionSynchronizationRegistry transactionRegistry;

    // Payara CDI için parametresiz constructor
    protected AuthService() {
        this.userRepository = null;
        this.passwordHash = null;
        this.petRepository = null;
        this.petPhotoStorage = null;
    }

    // Constructor Injection
    @Inject
    public AuthService(
            UserRepository userRepository,
            Pbkdf2PasswordHash passwordHash,
            PetRepository petRepository,
            PetPhotoStorage petPhotoStorage
    ) {
        this.userRepository = userRepository;
        this.passwordHash = passwordHash;
        this.petRepository = petRepository;
        this.petPhotoStorage = petPhotoStorage;
    }

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

    // Kullanıcı hesabını ve fotoğraflarını güvenli şekilde siler.
    @Transactional
    public void deleteAccount(Long userId) {

        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "Geçersiz kullanıcı bilgisi."
            );
        }

        // Kullanıcının varlığını kontrol et.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Kullanıcı bulunamadı."
                ));

        // Kullanıcının fotoğraf yollarını al.
        List<String> photoPaths = petRepository.findByUserId(userId)
                .stream()
                .map(Pet::getPhotoPath)
                .filter(path -> path != null && !path.isBlank())
                .distinct()
                .toList();

        // Kullanıcıyı sil.
        userRepository.delete(user);

        // Transaction başarılı olursa fotoğrafları sil.
        transactionRegistry.registerInterposedSynchronization(
                new jakarta.transaction.Synchronization() {

                    @Override
                    public void beforeCompletion() {
                    }

                    @Override
                    public void afterCompletion(int status) {

                        if (status != Status.STATUS_COMMITTED) {
                            return;
                        }

                        for (String photoPath : photoPaths) {
                            try {
                                petPhotoStorage.deletePhoto(photoPath);
                            } catch (Exception exception) {
                                java.util.logging.Logger
                                        .getLogger(AuthService.class.getName())
                                        .log(
                                                java.util.logging.Level.WARNING,
                                                "Fotoğraf silinemedi: " + photoPath,
                                                exception
                                        );
                            }
                        }
                    }
                }
        );
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