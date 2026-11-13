
package com.petcare.service;

import com.petcare.entity.HealthRecord;
import com.petcare.entity.Pet;
import com.petcare.repository.HealthRecordRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class HealthRecordService {

    private static final Set<String> VALID_TYPES = Set.of(
            "examination",
            "vaccination",
            "treatment",
            "test",
            "other"
    );

    @Inject
    private HealthRecordRepository healthRecordRepository;

    @Inject
    private PetService petService;

    // Kullanıcının kendi hayvanına ait sağlık kayıtlarını getir.
    @Transactional
    public List<HealthRecord> getRecordsByPet(
            Long userId,
            Long petId
    ) {
        // Hayvanın kullanıcıya ait olduğunu doğrula.
        petService.getPet(userId, petId);

        return healthRecordRepository.findByPetId(petId);
    }

    // Yeni sağlık kaydı oluştur.
    @Transactional
    public HealthRecord addRecord(
            Long userId,
            Long petId,
            HealthRecord record
    ) {
        Pet pet = petService.getPet(userId, petId);

        validateRecord(record);

        record.setPet(pet);

        healthRecordRepository.save(record);

        return record;
    }

    // Mevcut sağlık kaydını getir.
    @Transactional
    public HealthRecord getRecord(
            Long userId,
            Long recordId
    ) {
        HealthRecord record = healthRecordRepository
                .findById(recordId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Sağlık kaydı bulunamadı."
                        )
                );

        // Başka kullanıcıya ait kayıtların
        // görüntülenmesini engelle.
        petService.getPet(userId, record.getPet().getId());

        return record;
    }

    // Sağlık kaydını güncelle.
    @Transactional
    public HealthRecord updateRecord(
            Long userId,
            Long recordId,
            HealthRecord updatedRecord
    ) {
        HealthRecord record = getRecord(userId, recordId);

        validateRecord(updatedRecord);

        record.setType(updatedRecord.getType().trim());
        record.setTitle(updatedRecord.getTitle().trim());
        record.setDescription(updatedRecord.getDescription());
        record.setClinic(updatedRecord.getClinic());
        record.setRecordDate(updatedRecord.getRecordDate());

        return healthRecordRepository.update(record);
    }

    // Sağlık kaydını sil.
    @Transactional
    public void deleteRecord(
            Long userId,
            Long recordId
    ) {
        HealthRecord record = getRecord(userId, recordId);

        healthRecordRepository.delete(record);
    }

    // Sağlık kaydı bilgilerini doğrula.
    private void validateRecord(HealthRecord record) {

        if (record == null) {
            throw new IllegalArgumentException(
                    "Sağlık kaydı bilgileri gereklidir."
            );
        }

        if (record.getType() == null ||
                !VALID_TYPES.contains(record.getType().trim())) {
            throw new IllegalArgumentException(
                    "Geçerli bir sağlık kaydı türü seçiniz."
            );
        }

        if (record.getTitle() == null ||
                record.getTitle().isBlank() ||
                record.getTitle().trim().length() > 150) {
            throw new IllegalArgumentException(
                    "Kayıt başlığı 1-150 karakter arasında olmalıdır."
            );
        }

        if (record.getRecordDate() == null ||
                record.getRecordDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "İşlem tarihi geçerli olmalı ve gelecekte olmamalıdır."
            );
        }

        if (record.getClinic() != null &&
                record.getClinic().length() > 150) {
            throw new IllegalArgumentException(
                    "Klinik adı en fazla 150 karakter olabilir."
            );
        }

        if (record.getDescription() != null &&
                record.getDescription().length() > 2000) {
            throw new IllegalArgumentException(
                    "Açıklama en fazla 2000 karakter olabilir."
            );
        }
    }
}
