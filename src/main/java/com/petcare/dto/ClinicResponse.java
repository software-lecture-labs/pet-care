package com.petcare.dto;

import jakarta.json.bind.annotation.JsonbNillable;
import java.math.BigDecimal;

// Klinik API yanıtının sabit veri modeli.
@JsonbNillable
public record ClinicResponse(
        Long id,
        String name,
        String district,
        String address,
        String phone,
        BigDecimal latitude,
        BigDecimal longitude,
        String imageUrl,
        boolean isDemo
) {
}