
package com.petcare.controller;

import com.petcare.dto.ClinicResponse;
import com.petcare.entity.Clinic;
import com.petcare.service.ClinicService;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/clinics")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class ClinicController {

    private final ClinicService clinicService;

    // CDI proxy oluşturulabilmesi için gerekli.
    protected ClinicController() {
        this.clinicService = null;
    }

    // Constructor Injection
    @Inject
    public ClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }
    // GET /api/clinics
    // Klinik adına ve ilçeye göre filtreleme yapar.
    @GET
    public Response getClinics(
            @QueryParam("name") String name,
            @QueryParam("district") String district) {

        List<ClinicResponse> clinics = clinicService
                .getClinics(name, district)
                .stream()
                .map(this::toResponse)
                .toList();

        return Response.ok(clinics).build();
    }

    // GET /api/clinics/{id}
    // Seçilen kliniğin detaylarını getirir.
    @GET
    @Path("/{id}")
    public Response getClinicById(@PathParam("id") Long id) {

        if (id == null || id <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message", "Geçersiz klinik ID."
                    ))
                    .build();
        }

        return clinicService.getClinicById(id)
                .map(clinic -> Response.ok(toResponse(clinic)).build())
                .orElseGet(() -> Response
                        .status(Response.Status.NOT_FOUND)
                        .entity(Map.of(
                                "message", "Klinik bulunamadı."
                        ))
                        .build());
    }

    // Entity nesnesini API yanıtına dönüştürür.
    private ClinicResponse toResponse(Clinic clinic) {
        return new ClinicResponse(
                clinic.getId(),
                clinic.getName(),
                clinic.getDistrict(),
                clinic.getAddress(),
                clinic.getPhone(),
                clinic.getLatitude(),
                clinic.getLongitude(),
                clinic.getImageUrl(),
                clinic.isDemo()
        );
    }
}
