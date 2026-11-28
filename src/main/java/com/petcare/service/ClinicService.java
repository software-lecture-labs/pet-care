
package com.petcare.service;

import com.petcare.entity.Clinic;
import com.petcare.repository.ClinicRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ClinicService {

    private final ClinicRepository clinicRepository;

    @Inject
    public ClinicService(ClinicRepository clinicRepository) {
        this.clinicRepository = clinicRepository;
    }

    // CDI tarafından kullanılabilir.
    protected ClinicService() {
        this.clinicRepository = null;
    }

    // Aktif klinikleri filtrelerle birlikte getirir.
    public List<Clinic> getClinics(String name, String district) {

        String normalizedName = normalize(name);
        String normalizedDistrict = normalize(district);

        return clinicRepository.search(
                normalizedName,
                normalizedDistrict
        );
    }

    // Klinik ID'sine göre detay getirir.
    public Optional<Clinic> getClinicById(Long id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }

        return clinicRepository.findActiveById(id);
    }

    // Boş metinleri null değerine dönüştürür.
    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
