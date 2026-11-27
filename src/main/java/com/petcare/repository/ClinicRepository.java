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

    // Klinik adı ve ilçe filtresini Türkçe dil kurallarına göre uygular.
    // Klinik adı ve ilçe filtresini Türkçe dil kurallarına göre uygular.
    public List<Clinic> search(String name, String district) {

        List<?> results = entityManager.createNativeQuery(
                        """
                        SELECT c.id
                        FROM clinics c
                        WHERE c.is_active = true
                        AND LOWER(c.name COLLATE "tr-TR-x-icu")
                            LIKE LOWER(CAST(? AS text) COLLATE "tr-TR-x-icu")
                        AND (
                            CAST(? AS text) IS NULL
                            OR LOWER(c.district COLLATE "tr-TR-x-icu")
                                = LOWER(CAST(? AS text) COLLATE "tr-TR-x-icu")
                        )
                        """
                )
                .setParameter(1, name == null ? "%" : "%" + name + "%")
                .setParameter(2, district)
                .setParameter(3, district)
                .getResultList();

        List<Long> clinicIds = results.stream()
                .map(value -> ((Number) value).longValue())
                .toList();

        if (clinicIds.isEmpty()) {
            return List.of();
        }

        return entityManager.createQuery(
                        "SELECT c FROM Clinic c " +
                                "WHERE c.active = true " +
                                "AND c.id IN :ids " +
                                "ORDER BY c.name",
                        Clinic.class
                )
                .setParameter("ids", clinicIds)
                .getResultList();
    }
}
