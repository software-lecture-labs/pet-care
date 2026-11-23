
package com.petcare.controller;

import com.petcare.entity.HealthRecord;
import com.petcare.exception.PetNotFoundException;
import com.petcare.service.HealthRecordService;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Path("/health-records")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class HealthRecordController {

    private final HealthRecordService healthRecordService;

    @Inject
    public HealthRecordController(
            HealthRecordService healthRecordService
    ) {
        this.healthRecordService = healthRecordService;
    }

    // Giriş yapan kullanıcının kimliğini oturumdan al.
    private Long getCurrentUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object userId = session.getAttribute("userId");

        return userId instanceof Long ? (Long) userId : null;
    }

    // İstemciye gönderilecek sağlık kaydı bilgileri.
    public record HealthRecordResponse(
            Long id,
            Long petId,
            String type,
            String title,
            String description,
            String clinic,
            LocalDate date
    ) {
        public static HealthRecordResponse from(HealthRecord record) {
            return new HealthRecordResponse(
                    record.getId(),
                    record.getPet().getId(),
                    record.getType(),
                    record.getTitle(),
                    record.getDescription(),
                    record.getClinic(),
                    record.getRecordDate()
            );
        }
    }

    // Formdan gelen sağlık kaydı bilgileri.
    public record HealthRecordRequest(
            Long petId,
            String type,
            String title,
            String description,
            String clinic,
            LocalDate date
    ) {
    }

    private HealthRecord toHealthRecord(HealthRecordRequest request) {
        HealthRecord record = new HealthRecord();

        record.setType(request.type());
        record.setTitle(request.title());
        record.setDescription(request.description());
        record.setClinic(request.clinic());
        record.setRecordDate(request.date());

        return record;
    }

    // Belirli bir hayvanın sağlık kayıtlarını listele.
    // GET /api/health-records?petId=1
    @GET
    public Response getRecords(
            @QueryParam("petId") Long petId,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        if (petId == null || petId <= 0) {
            return error(
                    Response.Status.BAD_REQUEST,
                    "Geçerli bir hayvan ID bilgisi gereklidir."
            );
        }

        try {
            List<HealthRecordResponse> records =
                    healthRecordService.getRecordsByPet(userId, petId)
                            .stream()
                            .map(HealthRecordResponse::from)
                            .toList();

            return Response.ok(records).build();

        } catch (PetNotFoundException exception) {
            return error(
                    Response.Status.NOT_FOUND,
                    exception.getMessage()
            );
        } catch (IllegalArgumentException exception) {
            return error(
                    Response.Status.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    // Yeni sağlık kaydı oluştur.
    // POST /api/health-records
    @POST
    public Response addRecord(
            HealthRecordRequest recordRequest,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        if (recordRequest == null) {
            return error(
                    Response.Status.BAD_REQUEST,
                    "Sağlık kaydı bilgileri gereklidir."
            );
        }

        try {
            HealthRecord record = healthRecordService.addRecord(
                    userId,
                    recordRequest.petId(),
                    toHealthRecord(recordRequest)
            );

            return Response
                    .status(Response.Status.CREATED)
                    .entity(HealthRecordResponse.from(record))
                    .build();

        } catch (PetNotFoundException exception) {
            return error(
                    Response.Status.NOT_FOUND,
                    exception.getMessage()
            );
        } catch (IllegalArgumentException exception) {
            return error(
                    Response.Status.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    // Belirli bir sağlık kaydını getir.
    // GET /api/health-records/1
    @GET
    @Path("/{id}")
    public Response getRecord(
            @PathParam("id") Long recordId,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        try {
            HealthRecord record = healthRecordService.getRecord(
                    userId,
                    recordId
            );

            return Response
                    .ok(HealthRecordResponse.from(record))
                    .build();

        } catch (PetNotFoundException exception) {
            return error(
                    Response.Status.NOT_FOUND,
                    exception.getMessage()
            );
        } catch (IllegalArgumentException exception) {
            return error(
                    Response.Status.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    // Sağlık kaydını güncelle.
    // PUT /api/health-records/1
    @PUT
    @Path("/{id}")
    public Response updateRecord(
            @PathParam("id") Long recordId,
            HealthRecordRequest recordRequest,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        if (recordRequest == null) {
            return error(
                    Response.Status.BAD_REQUEST,
                    "Güncellenecek bilgiler gereklidir."
            );
        }

        try {
            HealthRecord record = healthRecordService.updateRecord(
                    userId,
                    recordId,
                    toHealthRecord(recordRequest)
            );

            return Response
                    .ok(HealthRecordResponse.from(record))
                    .build();

        } catch (PetNotFoundException exception) {
            return error(
                    Response.Status.NOT_FOUND,
                    exception.getMessage()
            );
        } catch (IllegalArgumentException exception) {
            return error(
                    Response.Status.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    // Sağlık kaydını sil.
    // DELETE /api/health-records/1
    @DELETE
    @Path("/{id}")
    public Response deleteRecord(
            @PathParam("id") Long recordId,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        try {
            healthRecordService.deleteRecord(userId, recordId);

            return Response.noContent().build();

        } catch (PetNotFoundException exception) {
            return error(
                    Response.Status.NOT_FOUND,
                    exception.getMessage()
            );
        } catch (IllegalArgumentException exception) {
            return error(
                    Response.Status.BAD_REQUEST,
                    exception.getMessage()
            );
        }
    }

    private Response unauthorized() {
        return error(
                Response.Status.UNAUTHORIZED,
                "Lütfen giriş yapın."
        );
    }

    private Response error(Response.Status status, String message) {
        return Response.status(status)
                .entity(Map.of("message", message))
                .build();
    }
}
