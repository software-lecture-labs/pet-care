package com.petcare.dto;

import jakarta.json.bind.annotation.JsonbNillable;

@JsonbNillable
public record AppointmentDetail(
        Long id,
        Long petId,
        Long availabilityId,
        String reason,
        String notes,
        String status,
        String startTime,
        Long veterinarianId,
        String vetName,
        String clinicName,
        String petName,
        String petType
) {
}
