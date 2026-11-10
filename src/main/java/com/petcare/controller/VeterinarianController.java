
package com.petcare.controller;

import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Path("/veterinarians")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class VeterinarianController {

    @PersistenceContext
    private EntityManager em;

    // GET /api/veterinarians
    // Aktif veterinerleri listele
    @GET
    public Response getVeterinarians() {

        List<?> rows = em.createNativeQuery(
                "SELECT id, full_name, specialty, clinic_name " +
                        "FROM veterinarians " +
                        "WHERE is_active = TRUE " +
                        "ORDER BY full_name"
        ).getResultList();

        List<Map<String, Object>> veterinarians =
                new ArrayList<>();

        for (Object item : rows) {

            Object[] row = (Object[]) item;

            Map<String, Object> vet = new LinkedHashMap<>();

            vet.put("id", ((Number) row[0]).longValue());
            vet.put("fullName", row[1]);
            vet.put("specialty", row[2]);
            vet.put("clinicName", row[3]);

            veterinarians.add(vet);
        }

        return Response.ok(veterinarians).build();
    }

    // GET /api/veterinarians/{id}/availability
    // Veterinerin boş ve gelecekteki saatlerini getir
    @GET
    @Path("/{id}/availability")
    public Response getAvailability(
            @PathParam("id") Long veterinarianId) {

        if (veterinarianId == null || veterinarianId <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message", "Geçersiz veteriner ID."
                    ))
                    .build();
        }

        List<?> rows = em.createNativeQuery("""
                SELECT
                    va.id,
                    to_char(
                        va.start_time AT TIME ZONE 'UTC',
                        'YYYY-MM-DD"T"HH24:MI:SS"Z"'
                    ),
                    to_char(
                        va.end_time AT TIME ZONE 'UTC',
                        'YYYY-MM-DD"T"HH24:MI:SS"Z"'
                    )
                FROM vet_availability va
                JOIN veterinarians v
                    ON v.id = va.veterinarian_id
                WHERE va.veterinarian_id = :vetId
                  AND va.is_active = TRUE
                  AND v.is_active = TRUE
                  AND va.start_time > CURRENT_TIMESTAMP
                  AND NOT EXISTS (
                      SELECT 1
                      FROM appointments a
                      WHERE a.availability_id = va.id
                        AND a.status = 'scheduled'
                  )
                ORDER BY va.start_time
                """)
                .setParameter("vetId", veterinarianId)
                .getResultList();

        List<Map<String, Object>> availableSlots =
                new ArrayList<>();

        for (Object item : rows) {

            Object[] row = (Object[]) item;

            Map<String, Object> slot =
                    new LinkedHashMap<>();

            slot.put("id", ((Number) row[0]).longValue());
            slot.put("startTime", row[1]);
            slot.put("endTime", row[2]);

            availableSlots.add(slot);
        }

        return Response.ok(availableSlots).build();
    }
}
