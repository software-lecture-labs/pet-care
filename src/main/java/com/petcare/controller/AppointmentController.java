
package com.petcare.controller;

import com.petcare.entity.Appointment;
import com.petcare.service.AppointmentService;
import com.petcare.exception.AppointmentSlotConflictException;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/appointments")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AppointmentController {

    private final AppointmentService appointmentService;

    // Payara CDI için parametresiz constructor
    protected AppointmentController() {
        this.appointmentService = null;
    }

    // Constructor Injection
    @Inject
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

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

        List<Map<String, Object>> appointments =
                appointmentService.getAppointmentDetails(userId);

        return Response.ok(appointments).build();
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

        } catch (AppointmentSlotConflictException e) {

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
