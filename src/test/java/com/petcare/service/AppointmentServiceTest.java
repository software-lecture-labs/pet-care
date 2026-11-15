
package com.petcare.service;

import com.petcare.entity.Appointment;
import com.petcare.repository.AppointmentRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentServiceTest {

    @Test
    void uzunRandevuNedeniReddedilmeli() {

        AppointmentRepository mockRepository =
                mock(AppointmentRepository.class);

        AppointmentService appointmentService =
                new AppointmentService(mockRepository);

        String reason = "a".repeat(256);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> appointmentService.createAppointment(
                        1L, 2L, 3L, reason, null
                )
        );

        assertEquals(
                "Randevu nedeni en fazla 255 karakter olabilir.",
                exception.getMessage()
        );

        verifyNoInteractions(mockRepository);
    }

    @Test
    void uzunRandevuNotuReddedilmeli() {

        AppointmentRepository mockRepository =
                mock(AppointmentRepository.class);

        AppointmentService appointmentService =
                new AppointmentService(mockRepository);

        String notes = "a".repeat(1001);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> appointmentService.createAppointment(
                        1L, 2L, 3L, "Genel kontrol", notes
                )
        );

        assertEquals(
                "Randevu notu en fazla 1000 karakter olabilir.",
                exception.getMessage()
        );

        verifyNoInteractions(mockRepository);
    }

    @Test
    void sinirDegerlerdeRandevuOlusturulabilmeli() {

        AppointmentRepository mockRepository =
                mock(AppointmentRepository.class);

        when(mockRepository.isPetOwnedByUser(2L, 1L))
                .thenReturn(true);

        when(mockRepository.isAvailabilityValid(3L))
                .thenReturn(true);

        when(mockRepository.isAvailabilityBooked(3L))
                .thenReturn(false);

        AppointmentService appointmentService =
                new AppointmentService(mockRepository);

        String reason = "a".repeat(255);
        String notes = "b".repeat(1000);

        Appointment result = appointmentService.createAppointment(
                1L, 2L, 3L, reason, notes
        );

        assertNotNull(result);
        assertEquals(reason, result.getReason());
        assertEquals(notes, result.getNotes());
        assertEquals("scheduled", result.getStatus());

        verify(mockRepository).save(same(result));
        verify(mockRepository).flush();
    }

    @Test
    void notOlmadanRandevuOlusturulabilmeli() {

        AppointmentRepository mockRepository =
                mock(AppointmentRepository.class);

        when(mockRepository.isPetOwnedByUser(2L, 1L))
                .thenReturn(true);

        when(mockRepository.isAvailabilityValid(3L))
                .thenReturn(true);

        when(mockRepository.isAvailabilityBooked(3L))
                .thenReturn(false);

        AppointmentService appointmentService =
                new AppointmentService(mockRepository);

        Appointment result = appointmentService.createAppointment(
                1L, 2L, 3L, "Genel kontrol", null
        );

        assertNotNull(result);
        assertNull(result.getNotes());

        verify(mockRepository).save(same(result));
        verify(mockRepository).flush();
    }
}