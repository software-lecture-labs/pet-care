package com.petcare.repository;

import com.petcare.entity.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UserRepository {

    @PersistenceContext(unitName = "PetCarePU")
    private EntityManager entityManager;

    // Yeni kullanıcıyı veritabanına kaydeder.
    public void save(User user) {
        entityManager.persist(user);
    }

    // E-posta adresine göre kullanıcı arar.
    public Optional<User> findByEmail(String email) {

        List<User> users = entityManager
                .createQuery(
                        "SELECT u FROM User u WHERE u.email = :email",
                        User.class
                )
                .setParameter("email", email)
                .setMaxResults(1)
                .getResultList();

        return users.stream().findFirst();
    }

    // E-posta adresinin kayıtlı olup olmadığını kontrol eder.
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    // Kullanıcıyı ID bilgisine göre bulur
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(entityManager.find(User.class, id));
    }
}