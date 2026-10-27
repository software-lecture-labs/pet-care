package com.petcare.service;

import com.petcare.entity.User;
import com.petcare.repository.UserRepository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;
import jakarta.transaction.Transactional;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class AuthService {

    @Inject
    private UserRepository userRepository;

    @Inject
    private Pbkdf2PasswordHash passwordHash;

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

        // 6. E-posta daha önce kullanılmış mı?
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Bu e-posta adresi zaten kayıtlı."
            );
        }

        // 7. Şifreyi güvenli şekilde hash'le
        Map<String, String> parameters = new HashMap<>();
        parameters.put("Pbkdf2PasswordHash.Iterations", "210000");

        passwordHash.initialize(parameters);

        String hashedPassword = passwordHash.generate(password.toCharArray());

        // 8. Kullanıcı nesnesini oluştur
        User user = new User();

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPasswordHash(hashedPassword);

        // 9. PostgreSQL'e kaydet
        userRepository.save(user);

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
                .orElseThrow(() -> new IllegalArgumentException(
                        "E-posta adresi veya şifre hatalı."
                ));

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
}