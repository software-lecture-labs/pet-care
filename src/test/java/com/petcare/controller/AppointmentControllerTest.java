package com.petcare.controller;

import com.petcare.entity.Appointment;
import com.petcare.exception.AppointmentSlotConflictException;
import com.petcare.service.AppointmentService;
import com.petcare.dto.AppointmentDetail;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentControllerTest {

    private AppointmentService appointmentService;
    private AppointmentController appointmentController;

    @BeforeEach
    void setUp() throws Exception {

        appointmentService = mock(AppointmentService.class);

        appointmentController =
                new AppointmentController(appointmentService);

        HttpServletRequest request =
                mock(HttpServletRequest.class);

        HttpSession session = mock(HttpSession.class);

        when(request.getSession(false))
                .thenReturn(session);

        when(session.getAttribute("userId"))
                .thenReturn(1L);

        Field requestField =
                AppointmentController.class.getDeclaredField("request");

        requestField.setAccessible(true);
        requestField.set(appointmentController, request);
    }

    private AppointmentController.CreateAppointmentRequest
    createRequest() {

        AppointmentController.CreateAppointmentRequest data =
                new AppointmentController.CreateAppointmentRequest();

        data.setPetId(2L);
        data.setAvailabilityId(3L);
        data.setReason("Genel kontrol");
        data.setNotes(null);

        return data;
    }

    @Test
    void randevuCakismasinda409Donmeli() {

        when(appointmentService.createAppointment(
                1L, 2L, 3L, "Genel kontrol", null
        )).thenThrow(new AppointmentSlotConflictException(
                "Bu randevu saati dolu."
        ));

        Response response =
                appointmentController.createAppointment(createRequest());

        assertEquals(409, response.getStatus());

        assertEquals(
                Map.of("message", "Bu randevu saati dolu."),
                response.getEntity()
        );
    }

    @Test
    void gecersizRandevuBilgisinde400Donmeli() {

        when(appointmentService.createAppointment(
                1L, 2L, 3L, "Genel kontrol", null
        )).thenThrow(new IllegalArgumentException(
                "Seçilen randevu saati uygun değil."
        ));

        Response response =
                appointmentController.createAppointment(createRequest());

        assertEquals(400, response.getStatus());

        assertEquals(
                Map.of("message", "Seçilen randevu saati uygun değil."),
                response.getEntity()
        );
    }

    @Test
    void basariliRandevuKaydinda201Donmeli() {

        Appointment appointment = new Appointment();

        when(appointmentService.createAppointment(
                1L, 2L, 3L, "Genel kontrol", null
        )).thenReturn(appointment);

        Response response =
                appointmentController.createAppointment(createRequest());

        assertEquals(201, response.getStatus());
        assertSame(appointment, response.getEntity());
    }

    @Test
    void beklenmeyenHataCakismaOlarakDonmemeli() {

        IllegalStateException exception =
                new IllegalStateException("Beklenmeyen hata.");

        when(appointmentService.createAppointment(
                1L, 2L, 3L, "Genel kontrol", null
        )).thenThrow(exception);

        IllegalStateException result = assertThrows(
                IllegalStateException.class,
                () -> appointmentController.createAppointment(createRequest())
        );

        assertSame(exception, result);
    }

    @Test
    void randevuDetaylari200IleDonmeli() {

        AppointmentDetail detail = new AppointmentDetail(
                10L,
                2L,
                3L,
                "Genel kontrol",
                null,
                "scheduled",
                "2026-11-17T06:00:00Z",
                4L,
                "Dr. Elif Yılmaz",
                "PetLife Veteriner Kliniği",
                "Pamuk",
                "Kedi"
        );

        List<AppointmentDetail> expected = List.of(detail);

        when(appointmentService.getAppointmentDetails(1L))
                .thenReturn(expected);

        Response response =
                appointmentController.getAppointments();

        assertEquals(200, response.getStatus());
        assertEquals(expected, response.getEntity());

        verify(appointmentService).getAppointmentDetails(1L);
    }
}