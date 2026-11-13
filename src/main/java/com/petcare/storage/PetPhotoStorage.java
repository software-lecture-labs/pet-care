
package com.petcare.storage;

import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import jakarta.annotation.PostConstruct;

@ApplicationScoped
public class PetPhotoStorage {

    // Fotoğrafların kaydedileceği klasör
    private Path uploadDirectory;

    public PetPhotoStorage() {
        // CDI için boş constructor
    }

    // Testlerde ortam değişkeni değerini kontrollü olarak kullanır.
    PetPhotoStorage(String configuredPath) {
        this.uploadDirectory = resolveUploadDirectory(configuredPath);
    }

    @PostConstruct
    private void init() {
        if (uploadDirectory == null) {
            uploadDirectory = resolveUploadDirectory();
        }
    }

    private static Path resolveUploadDirectory() {
        return resolveUploadDirectory(System.getenv("PETCARE_UPLOAD_DIR"));
    }

    private static Path resolveUploadDirectory(String configuredPath) {
        if (configuredPath == null || configuredPath.isBlank()) {
            throw new IllegalStateException(
                    "PETCARE_UPLOAD_DIR ortam değişkeni tanımlanmalıdır."
            );
        }

        return Path.of(configuredPath.trim())
                .toAbsolutePath()
                .normalize();
    }

    // Maksimum fotoğraf boyutu: 5 MB
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    // Maksimum fotoğraf çözünürlüğü: 4096 x 4096 piksel
    private static final int MAX_IMAGE_WIDTH = 4096;
    private static final int MAX_IMAGE_HEIGHT = 4096;

    // Fotoğrafı sunucuya kaydet
    public String savePhoto(InputStream inputStream) throws IOException {

        if (inputStream == null) {
            throw new IllegalArgumentException(
                    "Fotoğraf dosyası gereklidir."
            );
        }

        // En fazla 5 MB + 1 byte oku
        byte[] fileBytes;
        try (InputStream stream = inputStream) {
            fileBytes = stream.readNBytes((int) MAX_FILE_SIZE + 1);
        }

        if (fileBytes.length == 0) {
            throw new IllegalArgumentException(
                    "Fotoğraf dosyası boş olamaz."
            );
        }

        if (fileBytes.length > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Fotoğraf en fazla 5 MB olabilir."
            );
        }

        // Dosya türünü içerikten kontrol et
        String extension = detectExtension(fileBytes);
        if (!".jpg".equals(extension) && !".png".equals(extension)) {
            throw new IllegalArgumentException(
                    "Yalnızca JPEG veya PNG fotoğrafları destekleniyor."
            );
        }

        // Görüntüyü tamamen belleğe yüklemeden piksel boyutlarını kontrol et
        try (var imageInput = ImageIO.createImageInputStream(
                new ByteArrayInputStream(fileBytes))) {

            if (imageInput == null) {
                throw new IllegalArgumentException("Fotoğraf okunamadı.");
            }

            var readers = ImageIO.getImageReaders(imageInput);

            if (!readers.hasNext()) {
                throw new IllegalArgumentException(
                        "Geçersiz veya desteklenmeyen fotoğraf."
                );
            }

            var reader = readers.next();

            try {
                reader.setInput(imageInput);

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0 ||
                        width > MAX_IMAGE_WIDTH ||
                        height > MAX_IMAGE_HEIGHT) {

                    throw new IllegalArgumentException(
                            "Fotoğraf en fazla 4096 x 4096 piksel olabilir."
                    );
                }
            } finally {
                reader.dispose();
            }
        }

        // Dosyanın gerçekten okunabilir bir görüntü olduğunu doğrula
            BufferedImage image = ImageIO.read(
                    new ByteArrayInputStream(fileBytes)
            );

            if (image == null ||
                    image.getWidth() <= 0 ||
                    image.getHeight() <= 0) {
                throw new IllegalArgumentException(
                        "Geçersiz veya bozuk fotoğraf dosyası."
                );
            }

        // Klasör yoksa oluştur
        Files.createDirectories(uploadDirectory);

        // Benzersiz dosya adı oluştur
        String fileName = UUID.randomUUID() + extension;

        Path targetPath = uploadDirectory.resolve(fileName);

        Files.write(
                targetPath,
                fileBytes,
                StandardOpenOption.CREATE_NEW
        );

        return fileName;
    }

    // Dosya imzasına göre formatı belirle
    private String detectExtension(byte[] bytes) {

        // JPEG
        if (bytes.length >= 3 &&
                (bytes[0] & 0xFF) == 0xFF &&
                (bytes[1] & 0xFF) == 0xD8 &&
                (bytes[2] & 0xFF) == 0xFF) {
            return ".jpg";
        }

        // PNG
        byte[] pngSignature = {
                (byte) 0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A
        };

        if (startsWith(bytes, pngSignature)) {
            return ".png";
        }

        return null;
    }

    private boolean startsWith(byte[] bytes, byte[] prefix) {
        if (bytes.length < prefix.length) {
            return false;
        }

        for (int i = 0; i < prefix.length; i++) {
            if (bytes[i] != prefix[i]) {
                return false;
            }
        }

        return true;
    }


    // Kaydedilen fotoğraf dosyasını sil
    public void deletePhoto(String fileName) throws IOException {

        if (fileName == null ||
                !fileName.matches(
                        "[0-9a-fA-F-]{36}\\.(jpg|png|webp)"
                )) {
            throw new IllegalArgumentException(
                    "Geçersiz fotoğraf dosyası adı."
            );
        }

        Path filePath =uploadDirectory.resolve(fileName);

        Files.deleteIfExists(filePath);
    }

    // Kaydedilmiş fotoğrafı oku
    public byte[] readPhoto(String fileName) throws IOException {

        if (fileName == null ||
                !fileName.matches(
                        "[0-9a-fA-F-]{36}\\.(jpg|png|webp)"
                )) {
            throw new IllegalArgumentException(
                    "Geçersiz fotoğraf dosyası adı."
            );
        }

        Path filePath = uploadDirectory.resolve(fileName);


        if (!Files.isRegularFile(filePath)) {
            throw new java.nio.file.NoSuchFileException(fileName);
        }

// Dosya boyutunu okumadan önce kontrol et
        long fileSize = Files.size(filePath);

        if (fileSize == 0 || fileSize > MAX_FILE_SIZE) {
            throw new IOException(
                    "Fotoğraf dosyasının boyutu geçersiz."
            );
        }

// Okuma sırasında dosya büyürse de sınırı koru
        try (InputStream inputStream = Files.newInputStream(filePath)) {

            byte[] photoBytes = inputStream.readNBytes(
                    (int) MAX_FILE_SIZE + 1
            );

            if (photoBytes.length > MAX_FILE_SIZE) {
                throw new IOException(
                        "Fotoğraf dosyası boyut sınırını aşıyor."
                );
            }

            return photoBytes;
        }

    }


}
