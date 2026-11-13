package com.petcare.storage;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PetPhotoStorageTest {

    @Test
    void ortamDegiskeniEksikseAciklayiciHataVerilmeli() {

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> new PetPhotoStorage((String) null)
        );

        assertEquals(
                "PETCARE_UPLOAD_DIR ortam değişkeni tanımlanmalıdır.",
                exception.getMessage()
        );
    }
    @Test
    void ortamDegiskeniBossaAciklayiciHataVerilmeli() {

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> new PetPhotoStorage("   ")
        );

        assertEquals(
                "PETCARE_UPLOAD_DIR ortam değişkeni tanımlanmalıdır.",
                exception.getMessage()
        );
    }
}