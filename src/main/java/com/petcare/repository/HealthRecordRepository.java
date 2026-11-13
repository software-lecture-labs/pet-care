
package com.petcare.repository;

import com.petcare.entity.HealthRecord;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class HealthRecordRepository {

    @PersistenceContext(unitName = "PetCarePU")
    private EntityManager entityManager;

    // Yeni sağlık kaydını veritabanına ekler.
    public void save(HealthRecord healthRecord) {
        entityManager.persist(healthRecord);
        entityManager.flush();
    }

    // Belirli bir hayvanın sağlık kayıtlarını listeler.
    // En yeni sağlık işlemi önce gösterilir.
    public List<HealthRecord> findByPetId(Long petId) {
        return entityManager
                .createQuery(
                        "SELECT h FROM HealthRecord h " +
                                "WHERE h.pet.id = :petId " +
                                "ORDER BY h.recordDate DESC, h.id DESC",
                        HealthRecord.class
                )
                .setParameter("petId", petId)
                .getResultList();
    }

    // Sağlık kaydını ID bilgisine göre bulur.
    public Optional<HealthRecord> findById(Long id) {
        return Optional.ofNullable(
                entityManager.find(HealthRecord.class, id)
        );
    }

    // Mevcut sağlık kaydını günceller.
    public HealthRecord update(HealthRecord healthRecord) {
        return entityManager.merge(healthRecord);
    }

    // Sağlık kaydını veritabanından siler.
    public void delete(HealthRecord healthRecord) {
        HealthRecord managedRecord =
                entityManager.contains(healthRecord)
                        ? healthRecord
                        : entityManager.merge(healthRecord);

        entityManager.remove(managedRecord);
    }
}

