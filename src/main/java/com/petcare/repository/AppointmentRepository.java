
package com.petcare.repository;

import com.petcare.entity.Appointment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class AppointmentRepository {

    @PersistenceContext
    private EntityManager em;

    // Kullanıcının bütün randevularını getirir
    public List<Appointment> findByUserId(Long userId) {
        return em.createQuery(
                        "SELECT a FROM Appointment a " +
                                "WHERE a.userId = :userId " +
                                "ORDER BY a.createdAt DESC",
                        Appointment.class
                )
                .setParameter("userId", userId)
                .getResultList();
    }

    // Kullanıcının randevularını detaylarıyla getirir
    public List<Map<String, Object>> findDetailsByUserId(Long userId) {

        List<?> rows = em.createNativeQuery("""
                SELECT
                    a.id,
                    a.pet_id,
                    a.availability_id,
                    a.reason,
                    a.notes,
                    a.status,
                    to_char(
                        va.start_time AT TIME ZONE 'UTC',
                        'YYYY-MM-DD"T"HH24":"MI":"SS"Z"'
                    ) AS start_time,
                    v.id AS veterinarian_id,
                    v.full_name,
                    v.clinic_name,
                    p.name AS pet_name,
                    p.type AS pet_type
                FROM appointments a
                JOIN pets p
                    ON p.id = a.pet_id
                JOIN vet_availability va
                    ON va.id = a.availability_id
                JOIN veterinarians v
                    ON v.id = va.veterinarian_id
                WHERE a.user_id = ?1
                    AND p.user_id = ?2
                ORDER BY va.start_time DESC
                """)
                .setParameter(1, userId)
                .setParameter(2, userId)
                .getResultList();

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object item : rows) {

            Object[] row = (Object[]) item;
            Map<String, Object> appointment = new LinkedHashMap<>();

            appointment.put("id", ((Number) row[0]).longValue());
            appointment.put("petId", ((Number) row[1]).longValue());
            appointment.put("availabilityId", ((Number) row[2]).longValue());
            appointment.put("reason", row[3]);
            appointment.put("notes", row[4]);
            appointment.put("status", row[5]);
            appointment.put("startTime", row[6]);
            appointment.put("veterinarianId", ((Number) row[7]).longValue());
            appointment.put("vetName", row[8]);
            appointment.put("clinicName", row[9]);
            appointment.put("petName", row[10]);
            appointment.put("petType", row[11]);

            result.add(appointment);
        }

        return result;
    }

    // ID ile randevu bulur
    public Appointment findById(Long id) {
        return em.find(Appointment.class, id);
    }

    // Yeni randevu kaydeder
    public void save(Appointment appointment) {
        em.persist(appointment);
    }

    // Randevunun durumunu günceller
    public void update(Appointment appointment) {
        em.merge(appointment);
    }

    // Hayvanın giriş yapan kullanıcıya ait olduğunu kontrol eder
    public boolean isPetOwnedByUser(Long petId, Long userId) {

        Number count = (Number) em.createNativeQuery(
                        "SELECT COUNT(*) FROM pets " +
                                "WHERE id = ?1 AND user_id = ?2"
                )
                .setParameter(1, petId)
                .setParameter(2, userId)
                .getSingleResult();

        return count.longValue() > 0;
    }

    // Veterinerin ve seçilen randevu saatinin uygunluğunu kontrol eder
    public boolean isAvailabilityValid(Long availabilityId) {

        Number count = (Number) em.createNativeQuery("""
                        SELECT COUNT(*)
                        FROM vet_availability va
                        JOIN veterinarians v
                            ON v.id = va.veterinarian_id
                        WHERE va.id = ?1
                            AND va.is_active = TRUE
                            AND v.is_active = TRUE
                            AND va.start_time > CURRENT_TIMESTAMP
                        """)
                .setParameter(1, availabilityId)
                .getSingleResult();

        return count.longValue() > 0;
    }

    // Seçilen randevu saatinin dolu olup olmadığını kontrol eder
    public boolean isAvailabilityBooked(Long availabilityId) {

        Number count = (Number) em.createNativeQuery("""
                        SELECT COUNT(*) FROM appointments
                        WHERE availability_id = ?1
                            AND status = 'scheduled'
                        """)
                .setParameter(1, availabilityId)
                .getSingleResult();

        return count.longValue() > 0;
    }

    // Veritabanı kısıtlarının hemen kontrol edilmesini sağlar
    public void flush() {
        em.flush();
    }
}
