
package com.petcare.servlet;

import com.petcare.service.PetService;
import com.petcare.storage.PetPhotoStorage;
import com.petcare.exception.PetNotFoundException;

import jakarta.inject.Inject;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.petcare.entity.Pet;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;
import java.nio.file.NoSuchFileException;
import java.util.Locale;

import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/api/pet-photos/*")
@MultipartConfig(
        maxFileSize = 5L * 1024 * 1024,
        maxRequestSize = 6L * 1024 * 1024
)
public class PetPhotoServlet extends HttpServlet {

    @Inject
    private PetService petService;

    @Inject
    private PetPhotoStorage petPhotoStorage;


    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-store");

        String contentType = request.getContentType();

        if (contentType == null ||
                !contentType.toLowerCase(java.util.Locale.ROOT)
                        .startsWith("multipart/form-data;")) {

            sendError(
                    response,
                    415,
                    "Fotoğraf multipart/form-data formatında gönderilmelidir."
            );
            return;
        }


        HttpSession session = request.getSession(false);

        if (session == null ||
                !(session.getAttribute("userId") instanceof Long)) {
            sendError(response, 401, "Lütfen giriş yapın.");
            return;
        }

        Long userId = (Long) session.getAttribute("userId");
        // CSRF token doğrulaması
        String expectedToken = (String) session.getAttribute("csrfToken");
        String receivedToken = request.getHeader("X-CSRF-Token");

        if (expectedToken == null || receivedToken == null ||
                !java.security.MessageDigest.isEqual(
                        expectedToken.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        receivedToken.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {

            sendError(response, 403, "Geçersiz CSRF token.");
            return;
        }

        // URL'den hayvan ID'sini al
        Long petId;

        try {
            String path = request.getPathInfo();

            if (path == null || !path.matches("/[0-9]+")) {
                sendError(response, 400, "Geçersiz hayvan ID.");
                return;
            }

            petId = Long.valueOf(path.substring(1));

        } catch (NumberFormatException exception) {
            sendError(response, 400, "Geçersiz hayvan ID.");
            return;
        }

        // Hayvanın giriş yapan kullanıcıya ait olduğunu doğrula
        try {
            petService.getPet(userId, petId);

        } catch (PetNotFoundException exception) {
            sendError(response, 404, "Hayvan bulunamadı.");
            return;

        } catch (IllegalArgumentException exception) {
            sendError(response, 400, exception.getMessage());
            return;
        }
        // Fotoğrafı al
        Part photo;

        try {
            photo = request.getPart("photo");

        } catch (Exception exception) {
            sendError(response, 400, "Fotoğraf isteği geçersiz veya çok büyük.");
            return;
        }

        if (photo == null) {
            sendError(response, 400, "Fotoğraf seçilmedi.");
            return;
        }

        String photoType = photo.getContentType();

        if (photoType == null ||
                !(photoType.equalsIgnoreCase("image/jpeg") ||
                        photoType.equalsIgnoreCase("image/png"))) {

            sendError(
                    response,
                    400,
                    "Yalnızca JPEG veya PNG yükleyebilirsiniz."
            );
            return;
        }


        String fileName = null;
        boolean databaseUpdated = false;

        try {
            // Dosyayı sunucuya kaydet
            fileName = petPhotoStorage.savePhoto(photo.getInputStream());

            // Fotoğraf yolunu veritabanına kaydet
            Pet pet = petService.updatePetPhoto(userId, petId, fileName);
            databaseUpdated = true;

            // Başarılı yanıt
            response.setStatus(200);

            try (PrintWriter writer = response.getWriter()) {
                writer.write(
                        "{\"message\":\"Fotoğraf yüklendi.\",\"photoPath\":\""
                                + pet.getPhotoPath() + "\"}"
                );
            }

        } catch (IllegalArgumentException exception) {

            // Fotoğraf kaydedildiyse fakat işlem başarısız olduysa sil
            if (fileName != null && !databaseUpdated) {
                try {
                    petPhotoStorage.deletePhoto(fileName);
                } catch (IOException cleanupException) {
                    getServletContext().log(
                            "Fotoğraf temizlenemedi: " + fileName,
                            cleanupException
                    );
                }
            }

            sendError(response, 400, exception.getMessage());

        } catch (Exception exception) {

            // Veritabanı veya dosya hatasında yeni fotoğrafı temizle
            if (fileName != null && !databaseUpdated) {
                try {
                    petPhotoStorage.deletePhoto(fileName);
                } catch (IOException cleanupException) {
                    getServletContext().log(
                            "Fotoğraf temizlenemedi: " + fileName,
                            cleanupException
                    );
                }
            }

            getServletContext().log(
                    "Fotoğraf yükleme hatası",
                    exception
            );

            sendError(
                    response,
                    500,
                    "Fotoğraf yüklenirken hata oluştu."
            );
        }
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        response.setHeader("Cache-Control", "private, no-store");

        // Oturum kontrolü
        HttpSession session = request.getSession(false);

        if (session == null ||
                !(session.getAttribute("userId") instanceof Long)) {
            sendError(response, 401, "Lütfen giriş yapın.");
            return;
        }

        Long userId = (Long) session.getAttribute("userId");

        // URL'den hayvan ID'sini al
        Long petId;

        try {
            String path = request.getPathInfo();

            if (path == null || !path.matches("/[0-9]+")) {
                sendError(response, 400, "Geçersiz hayvan ID.");
                return;
            }

            petId = Long.valueOf(path.substring(1));

        } catch (NumberFormatException exception) {
            sendError(response, 400, "Geçersiz hayvan ID.");
            return;
        }

        // Hayvanın kullanıcıya ait olduğunu doğrula
        Pet pet;

        try {
            pet = petService.getPet(userId, petId);

        } catch (PetNotFoundException exception) {
            sendError(response, 404, "Hayvan bulunamadı.");
            return;

        } catch (IllegalArgumentException exception) {
            sendError(response, 400, exception.getMessage());
            return;
        }

        String fileName = pet.getPhotoPath();

        if (fileName == null || fileName.isBlank()) {
            sendError(response, 404, "Bu hayvanın fotoğrafı yok.");
            return;
        }

        // Dosya uzantısına göre içerik türünü belirle
        String contentType;

        if (fileName.endsWith(".jpg")) {
            contentType = "image/jpeg";
        } else if (fileName.endsWith(".png")) {
            contentType = "image/png";
        } else {
            sendError(response, 404, "Geçersiz fotoğraf.");
            return;
        }

        try {
            byte[] photoBytes = petPhotoStorage.readPhoto(fileName);

            response.setContentType(contentType);
            response.setContentLength(photoBytes.length);
            response.getOutputStream().write(photoBytes);

        } catch (NoSuchFileException exception) {
            sendError(response, 404, "Fotoğraf dosyası bulunamadı.");

        } catch (IOException exception) {
            getServletContext().log(
                    "Fotoğraf okunurken hata oluştu.",
                    exception
            );

            if (!response.isCommitted()) {
                sendError(
                        response,
                        500,
                        "Fotoğraf görüntülenirken hata oluştu."
                );
            }
        }
    }



    private void sendError(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {

        if (response.isCommitted()) {
            return;
        }

        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");

        String safeMessage = message
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");

        response.getWriter().write(
                "{\"message\":\"" + safeMessage + "\"}"
        );
    }

}

