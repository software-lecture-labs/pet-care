
package com.petcare.service;

import com.petcare.entity.Appointment;
import com.petcare.repository.AppointmentRepository;
import com.petcare.exception.AppointmentSlotConflictException;
import com.petcare.dto.AppointmentDetail;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    // Payara CDI için parametresiz constructor
    protected AppointmentService() {
        this.appointmentRepository = null;
    }

    // Constructor Injection
    @Inject
    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    // Kullanıcının randevularını listele
    public List<Appointment> getAppointments(Long userId) {

        if (userId == null) {
            throw new SecurityException("Oturum bulunamadı.");
        }

        return appointmentRepository.findByUserId(userId);
    }

    // Kullanıcının randevularını detaylarıyla listele
    public List<AppointmentDetail> getAppointmentDetails(Long userId) {
        if (userId == null) {
            throw new SecurityException("Oturum bulunamadı.");
        }

        return appointmentRepository.findDetailsByUserId(userId);
    }

    // Yeni randevu oluştur
    @Transactional
    public Appointment createAppointment(
            Long userId,
            Long petId,
            Long availabilityId,
            String reason,
            String notes) {

        if (userId == null) {
            throw new SecurityException("Oturum bulunamadı.");
        }

        if (petId == null || availabilityId == null) {
            throw new IllegalArgumentException(
                    "Hayvan ve randevu saati seçilmelidir."
            );
        }

        // Randevu nedeni uzunluk kontrolü
        if (reason != null && reason.length() > 255) {
            throw new IllegalArgumentException(
                    "Randevu nedeni en fazla 255 karakter olabilir."
            );
        }

        // Randevu notu uzunluk kontrolü
        if (notes != null && notes.length() > 1000) {
            throw new IllegalArgumentException(
                    "Randevu notu en fazla 1000 karakter olabilir."
            );
        }

        // Hayvan bu kullanıcıya mı ait?
        if (!appointmentRepository.isPetOwnedByUser(petId, userId)) {
            throw new IllegalArgumentException(
                    "Seçilen hayvan size ait değil veya bulunamadı."
            );
        }

        // Veteriner ve seçilen saat aktif ve gelecekte mi?
        if (!appointmentRepository.isAvailabilityValid(availabilityId)) {
            throw new IllegalArgumentException(
                    "Seçilen randevu saati uygun değil."
            );
        }

        // Aynı saat daha önce alınmış mı?
        if (appointmentRepository.isAvailabilityBooked(availabilityId)) {
            throw new AppointmentSlotConflictException(
                    "Bu randevu saati dolu."
            );
        }

        Appointment appointment = new Appointment();

        appointment.setUserId(userId);
        appointment.setPetId(petId);
        appointment.setAvailabilityId(availabilityId);
        appointment.setReason(reason);
        appointment.setNotes(notes);
        appointment.setStatus("scheduled");

        appointmentRepository.save(appointment);

        // Veritabanı kısıtlarını hemen kontrol et
        appointmentRepository.flush();

        return appointment;
    }

    // Randevu iptal et
    @Transactional
    public void cancelAppointment(Long userId, Long appointmentId) {

        if (userId == null) {
            throw new SecurityException("Oturum bulunamadı.");
        }

        Appointment appointment =
                appointmentRepository.findById(appointmentId);

        if (appointment == null ||
                !userId.equals(appointment.getUserId())) {
            throw new IllegalArgumentException(
                    "Randevu bulunamadı."
            );
        }

        if (!"scheduled".equals(appointment.getStatus())) {
            throw new IllegalStateException(
                    "Bu randevu iptal edilemez."
            );
        }

        appointment.setStatus("cancelled");
        appointmentRepository.update(appointment);
    }
}