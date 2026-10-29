package com.petcare.controller;

import com.petcare.entity.User;
import com.petcare.service.AuthService;
import com.petcare.service.LoginAttemptService;

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

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptService loginAttemptService;

    @Inject
    public AuthController(
            AuthService authService,
            LoginAttemptService loginAttemptService
    ) {
        this.authService = authService;
        this.loginAttemptService = loginAttemptService;
    }

    protected AuthController() {
        this.authService = null;
        this.loginAttemptService = null;
    }

    @POST
    @Path("/register")
    public Response register(@Valid @NotNull RegisterRequest request) {

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
            @NotBlank @Size(max = 50) String firstName,
            @NotBlank @Size(max = 50) String lastName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 128) String password
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

        String email = request.email();

        // Önce giriş sınırını kontrol et
        if (loginAttemptService.isBlocked(email)) {
            return Response.status(429)
                    .entity(Map.of(
                            "message",
                            "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin."
                    ))
                    .build();
        }

        try {
            // Kullanıcı bilgilerini doğrula
            User user = authService.login(
                    email,
                    request.password()
            );

            // Başarılı girişte sayacı sıfırla
            loginAttemptService.resetAttempts(email);

            // Önceki oturumu geçersiz kıl
            HttpSession oldSession = httpRequest.getSession(false);

            if (oldSession != null) {
                oldSession.invalidate();
            }

            // Yeni oturum oluştur
            HttpSession session = httpRequest.getSession(true);

            session.setAttribute("userId", user.getId());

            return Response.ok(Map.of(
                    "message", "Giriş başarılı.",
                    "userId", user.getId(),
                    "firstName", user.getFirstName()
            )).build();

        } catch (IllegalArgumentException exception) {

            // Başarısız giriş denemesini kaydet
            loginAttemptService.recordFailedAttempt(email);

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

        return authService.currentUser(userId)
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