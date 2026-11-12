
package com.petcare.repository;

import com.petcare.entity.Pet;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PetRepository {

    @PersistenceContext(unitName = "PetCarePU")
    private EntityManager entityManager;

    // Yeni hayvanı veritabanına kaydeder.
    public void save(Pet pet) {
        entityManager.persist(pet);
        entityManager.flush();
    }

    // Kullanıcının kendi hayvanlarını listeler.
    public List<Pet> findByUserId(Long userId) {
        return entityManager
                .createQuery(
                        "SELECT p FROM Pet p WHERE p.user.id = :userId ORDER BY p.id",
                        Pet.class
                )
                .setParameter("userId", userId)
                .getResultList();
    }

    // Hayvanı ID bilgisine göre bulur.
    public Optional<Pet> findById(Long id) {
        return Optional.ofNullable(entityManager.find(Pet.class, id));
    }

    // Hayvan bilgilerini günceller.
    public Pet update(Pet pet) {
        return entityManager.merge(pet);
    }

    // Hayvanı veritabanından siler.
    public void delete(Pet pet) {
        Pet managedPet = entityManager.contains(pet)
                ? pet
                : entityManager.merge(pet);

        entityManager.remove(managedPet);
    }
}
