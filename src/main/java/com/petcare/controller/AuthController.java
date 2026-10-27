package com.petcare.controller;

import com.petcare.entity.User;
import com.petcare.service.AuthService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.GET;
import com.petcare.repository.UserRepository;

import java.util.Map;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    @Inject
    private AuthService authService;

    @Inject
    private UserRepository userRepository;

    @POST
    @Path("/register")
    public Response register(RegisterRequest request) {

        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", "Kayıt bilgileri eksik."))
                    .build();
        }

        try {
            User user = authService.register(
                    request.firstName(),
                    request.lastName(),
                    request.email(),
                    request.password()
            );

            // Şifre hash'ini API yanıtında göndermiyoruz.
            return Response.status(Response.Status.CREATED)
                    .entity(Map.of(
                            "message", "Hesabınız başarıyla oluşturuldu.",
                            "userId", user.getId()
                    ))
                    .build();

        } catch (IllegalArgumentException exception) {

            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", exception.getMessage()))
                    .build();
        }
    }

    public record RegisterRequest(
            String firstName,
            String lastName,
            String email,
            String password
    ) {
    }

    // Kullanıcı giriş işlemi
    @POST
    @Path("/login")
    public Response login(
            LoginRequest request,
            @Context HttpServletRequest httpRequest
    ) {

        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message", "Giriş bilgileri eksik."
                    ))
                    .build();
        }

        try {
            // E-posta ve şifreyi doğrula
            User user = authService.login(
                    request.email(),
                    request.password()
            );

            // Varsa önceki oturumu geçersiz kıl
            HttpSession oldSession = httpRequest.getSession(false);

            if (oldSession != null) {
                oldSession.invalidate();
            }

            // Yeni oturum oluştur
            HttpSession session = httpRequest.getSession(true);

            // Kullanıcı kimliğini oturumda sakla
            session.setAttribute("userId", user.getId());

            // Oturumun 30 dakika işlem yapılmadığında sona ermesini sağla
            session.setMaxInactiveInterval(30 * 60);

            return Response.ok(Map.of(
                    "message", "Giriş başarılı.",
                    "userId", user.getId(),
                    "firstName", user.getFirstName()
            )).build();

        } catch (IllegalArgumentException exception) {

            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of(
                            "message", exception.getMessage()
                    ))
                    .build();
        }
    }

    // Giriş formundan gelen bilgiler
    public record LoginRequest(
            String email,
            String password
    ) {
    }

    // Giriş yapan kullanıcının bilgilerini getirir
    @GET
    @Path("/me")
    public Response me(@Context HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null || !(session.getAttribute("userId") instanceof Long userId)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("message", "Lütfen giriş yapın."))
                    .build();
        }

        return userRepository.findById(userId)
                .map(user -> Response.ok(Map.of(
                        "userId", user.getId(),
                        "firstName", user.getFirstName(),
                        "lastName", user.getLastName(),
                        "email", user.getEmail()
                )).build())
                .orElseGet(() -> Response.status(Response.Status.UNAUTHORIZED)
                        .entity(Map.of("message", "Kullanıcı bulunamadı."))
                        .build());
    }
    // ========================================
// ÇIKIŞ YAPMA
// ========================================

    @POST
    @Path("/logout")
    public Response logout(@Context HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return Response.ok(Map.of(
                "message", "Başarıyla çıkış yapıldı."
        )).build();
    }
}