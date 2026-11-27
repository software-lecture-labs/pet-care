package com.petcare.service;
import com.petcare.entity.HealthRecord;
import com.petcare.entity.Pet;
import com.petcare.exception.PetNotFoundException;
import com.petcare.repository.HealthRecordRepository;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class HealthRecordServiceTest {
    @Test
    void baskaKullaniciyaAitSaglikKaydinaErisimEngellenmeli() {

        // Testte kullanılacak sahte bağımlılıklar
        HealthRecordRepository mockRepository =
                mock(HealthRecordRepository.class);

        PetService mockPetService =
                mock(PetService.class);

        HealthRecordService service =
                new HealthRecordService(mockRepository, mockPetService);

        // Sağlık kaydının bağlı olduğu hayvan
        Pet pet = mock(Pet.class);

        when(pet.getId()).thenReturn(10L);

        HealthRecord record = new HealthRecord();
        record.setPet(pet);

        // Sağlık kaydı veritabanında bulunuyor.
        when(mockRepository.findById(5L))
                .thenReturn(Optional.of(record));

        // Kullanıcı 20, hayvan 10'a erişmeye çalışıyor.
        // Ancak bu hayvan ona ait değil.
        when(mockPetService.getPet(20L, 10L))
                .thenThrow(new PetNotFoundException("Hayvan bulunamadı."));

        // Yetkisiz erişim engellenmeli.
        assertThrows(
                PetNotFoundException.class,
                () -> service.getRecord(20L, 5L)
        );

        // Sahiplik kontrolünün gerçekten yapıldığını doğrula.
        verify(mockRepository).findById(5L);
        verify(mockPetService).getPet(20L, 10L);
    }
}
