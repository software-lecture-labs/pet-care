
package com.petcare.repository;

import com.petcare.entity.Appointment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

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
                                "WHERE id = :petId AND user_id = :userId"
                )
                .setParameter("petId", petId)
                .setParameter("userId", userId)
                .getSingleResult();

        return count.longValue() > 0;
    }
}
