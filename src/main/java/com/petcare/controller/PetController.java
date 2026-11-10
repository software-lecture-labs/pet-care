
package com.petcare.controller;

import com.petcare.entity.Pet;
import com.petcare.service.PetService;
import com.petcare.exception.PetNotFoundException;

import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Path("/pets")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PetController {

    private final PetService petService;

    @Inject
    public PetController(PetService petService) {
        this.petService = petService;
    }

    // Giriş yapan kullanıcının ID'sini oturumdan al
    private Long getCurrentUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object userId = session.getAttribute("userId");

        return userId instanceof Long ? (Long) userId : null;
    }

    // Entity yerine güvenli yanıt nesnesi döndür
    public record PetResponse(
            Long id,
            String name,
            String type,
            String breed,
            String gender,
            LocalDate birthDate,
            BigDecimal weight,
            String notes,
            String photoPath
    ) {
        public static PetResponse from(Pet pet) {
            return new PetResponse(
                    pet.getId(),
                    pet.getName(),
                    pet.getType(),
                    pet.getBreed(),
                    pet.getGender(),
                    pet.getBirthDate(),
                    pet.getWeight(),
                    pet.getNotes(),
                    pet.getPhotoPath()
            );
        }
    }

    // Formdan gelen bilgiler
    public record PetRequest(
            String name,
            String type,
            String breed,
            String gender,
            LocalDate birthDate,
            BigDecimal weight,
            String notes
    ) {
    }

    private Pet toPet(PetRequest request) {
        Pet pet = new Pet();

        pet.setName(request.name());
        pet.setType(request.type());
        pet.setBreed(request.breed());
        pet.setGender(request.gender());
        pet.setBirthDate(request.birthDate());
        pet.setWeight(request.weight());
        pet.setNotes(request.notes());

        return pet;
    }

    // Kullanıcının hayvanlarını listele
    @GET
    public Response getPets(@Context HttpServletRequest request) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        List<PetResponse> pets = petService.getPetsByUser(userId)
                .stream()
                .map(PetResponse::from)
                .toList();

        return Response.ok(pets).build();
    }

    // Tek hayvanın profilini getir
    @GET
    @Path("/{id}")
    public Response getPet(
            @PathParam("id") Long petId,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        try {
            Pet pet = petService.getPet(userId, petId);
            return Response.ok(PetResponse.from(pet)).build();

        } catch (PetNotFoundException exception) {
            return error(Response.Status.NOT_FOUND, exception.getMessage());
        } catch (IllegalArgumentException exception) {
            return error(Response.Status.BAD_REQUEST, exception.getMessage());
        }
    }

    // Yeni hayvan ekle
    @POST
    public Response addPet(
            PetRequest petRequest,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        if (petRequest == null) {
            return error(Response.Status.BAD_REQUEST,
                    "Hayvan bilgileri gereklidir.");
        }

        try {
            Pet pet = petService.addPet(userId, toPet(petRequest));

            return Response.status(Response.Status.CREATED)
                    .entity(PetResponse.from(pet))
                    .build();

        } catch (IllegalArgumentException exception) {
            return error(Response.Status.BAD_REQUEST, exception.getMessage());
        }
    }

    // Hayvan bilgilerini güncelle
    @PUT
    @Path("/{id}")
    public Response updatePet(
            @PathParam("id") Long petId,
            PetRequest petRequest,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        if (petRequest == null) {
            return error(Response.Status.BAD_REQUEST,
                    "Güncellenecek bilgiler gereklidir.");
        }

        try {
            Pet pet = petService.updatePet(
                    userId,
                    petId,
                    toPet(petRequest)
            );

            return Response.ok(PetResponse.from(pet)).build();

        } catch (PetNotFoundException exception) {
            return error(Response.Status.NOT_FOUND, exception.getMessage());
        } catch (IllegalArgumentException exception) {
            return error(Response.Status.BAD_REQUEST, exception.getMessage());
        }
    }

    // Hayvanı sil
    @DELETE
    @Path("/{id}")
    public Response deletePet(
            @PathParam("id") Long petId,
            @Context HttpServletRequest request
    ) {
        Long userId = getCurrentUserId(request);

        if (userId == null) {
            return unauthorized();
        }

        try {
            petService.deletePet(userId, petId);

            return Response.noContent().build();

        } catch (PetNotFoundException exception) {
            return error(Response.Status.NOT_FOUND, exception.getMessage());
        } catch (IllegalArgumentException exception) {
            return error(Response.Status.BAD_REQUEST, exception.getMessage());
        }
    }

    private Response unauthorized() {
        return error(Response.Status.UNAUTHORIZED, "Lütfen giriş yapın.");
    }

    private Response error(Response.Status status, String message) {
        return Response.status(status)
                .entity(Map.of("message", message))
                .build();
    }
}
