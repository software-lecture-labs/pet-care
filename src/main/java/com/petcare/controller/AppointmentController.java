
package com.petcare.controller;

import com.petcare.entity.Appointment;
import com.petcare.service.AppointmentService;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/appointments")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AppointmentController {

    @Inject
    private AppointmentService appointmentService;

    @PersistenceContext
    private EntityManager em;

    @Context
    private HttpServletRequest request;

    // Oturum açmış kullanıcının ID'si
    private Long getCurrentUserId() {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object userId = session.getAttribute("userId");

        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }

        return null;
    }

    private Response error(int status, String message) {
        return Response.status(status)
                .entity(Map.of("message", message))
                .build();
    }

    // GET /api/appointments
    // Kullanıcının randevularını detaylarıyla listele
    @GET
    public Response getAppointments() {

        Long userId = getCurrentUserId();

        if (userId == null) {
            return error(401, "Oturum açmanız gerekiyor.");
        }

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

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (Object item : rows) {

            Object[] row = (Object[]) item;

            Map<String, Object> appointment =
                    new LinkedHashMap<>();

            appointment.put(
                    "id", ((Number) row[0]).longValue()
            );

            appointment.put(
                    "petId", ((Number) row[1]).longValue()
            );

            appointment.put(
                    "availabilityId",
                    ((Number) row[2]).longValue()
            );

            appointment.put("reason", row[3]);
            appointment.put("notes", row[4]);
            appointment.put("status", row[5]);
            appointment.put("startTime", row[6]);

            appointment.put(
                    "veterinarianId",
                    ((Number) row[7]).longValue()
            );

            appointment.put("vetName", row[8]);
            appointment.put("clinicName", row[9]);
            appointment.put("petName", row[10]);
            appointment.put("petType", row[11]);

            result.add(appointment);
        }

        return Response.ok(result).build();
    }

    // POST /api/appointments
    // Yeni randevu oluştur
    @POST
    public Response createAppointment(
            CreateAppointmentRequest data) {

        Long userId = getCurrentUserId();

        if (userId == null) {
            return error(401, "Oturum açmanız gerekiyor.");
        }

        if (data == null) {
            return error(400, "Randevu bilgileri eksik.");
        }

        try {

            Appointment appointment =
                    appointmentService.createAppointment(
                            userId,
                            data.getPetId(),
                            data.getAvailabilityId(),
                            data.getReason(),
                            data.getNotes()
                    );

            return Response
                    .status(Response.Status.CREATED)
                    .entity(appointment)
                    .build();

        } catch (IllegalArgumentException e) {

            return error(400, e.getMessage());

        } catch (IllegalStateException e) {

            return error(409, e.getMessage());
        }
    }

    // PUT /api/appointments/{id}/cancel
    // Randevu iptal et
    @PUT
    @Path("/{id}/cancel")
    public Response cancelAppointment(
            @PathParam("id") Long appointmentId) {

        Long userId = getCurrentUserId();

        if (userId == null) {
            return error(401, "Oturum açmanız gerekiyor.");
        }

        try {

            appointmentService.cancelAppointment(
                    userId,
                    appointmentId
            );

            return Response.ok(
                    Map.of(
                            "message",
                            "Randevu iptal edildi."
                    )
            ).build();

        } catch (IllegalArgumentException e) {

            return error(404, "Randevu bulunamadı.");

        } catch (IllegalStateException e) {

            return error(409, e.getMessage());
        }
    }

    // Frontend'den gelen JSON verisi
    public static class CreateAppointmentRequest {

        private Long petId;
        private Long availabilityId;
        private String reason;
        private String notes;

        public CreateAppointmentRequest() {
        }

        public Long getPetId() {
            return petId;
        }

        public void setPetId(Long petId) {
            this.petId = petId;
        }

        public Long getAvailabilityId() {
            return availabilityId;
        }

        public void setAvailabilityId(Long availabilityId) {
            this.availabilityId = availabilityId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }
}
