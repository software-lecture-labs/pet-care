
package com.petcare.repository;

import com.petcare.entity.Clinic;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ClinicRepository {

    @PersistenceContext(unitName = "PetCarePU")
    private EntityManager entityManager;

    // Aktif klinikleri alfabetik olarak listeler.
    public List<Clinic> findAllActive() {
        return entityManager.createQuery(
                "SELECT c FROM Clinic c " +
                        "WHERE c.active = true " +
                        "ORDER BY c.name",
                Clinic.class
        ).getResultList();
    }

    // Klinik adına göre arama yapar.
    public List<Clinic> searchByName(String name) {
        return entityManager.createQuery(
                        "SELECT c FROM Clinic c " +
                                "WHERE c.active = true " +
                                "AND LOWER(c.name) LIKE :name " +
                                "ORDER BY c.name",
                        Clinic.class
                )
                .setParameter("name", "%" + name.toLowerCase(java.util.Locale.ROOT) + "%")
                .getResultList();
    }

    // İlçeye göre aktif klinikleri listeler.
    public List<Clinic> findByDistrict(String district) {
        return entityManager.createQuery(
                        "SELECT c FROM Clinic c " +
                                "WHERE c.active = true " +
                                "AND c.district = :district " +
                                "ORDER BY c.name",
                        Clinic.class
                )
                .setParameter("district", district)
                .getResultList();
    }

    // Klinik ID'sine göre aktif klinik bulur.
    public Optional<Clinic> findActiveById(Long id) {
        return entityManager.createQuery(
                        "SELECT c FROM Clinic c " +
                                "WHERE c.id = :id AND c.active = true",
                        Clinic.class
                )
                .setParameter("id", id)
                .getResultStream()
                .findFirst();
    }

    // Klinik adı ve ilçe filtresini birlikte uygular.
    public List<Clinic> search(String name, String district) {
        return entityManager.createQuery(
                        "SELECT c FROM Clinic c " +
                                "WHERE c.active = true " +
                                "AND (:name IS NULL OR LOWER(c.name) LIKE :name) " +
                                "AND (:district IS NULL OR c.district = :district) " +
                                "ORDER BY c.name",
                        Clinic.class
                )
                .setParameter("name", name == null
                        ? null
                        : "%" + name.toLowerCase(java.util.Locale.ROOT) + "%")
                .setParameter("district", district)
                .getResultList();
    }

}
