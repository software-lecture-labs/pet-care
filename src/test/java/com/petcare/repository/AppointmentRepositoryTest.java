package com.petcare.repository;

import com.petcare.entity.Appointment;
import com.petcare.exception.AppointmentSlotConflictException;
import com.petcare.dto.AppointmentDetail;
import jakarta.persistence.Query;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentRepositoryTest {

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private AppointmentRepository appointmentRepository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private PersistenceException createPersistenceException(
            String sqlState, String constraintName) {

        PSQLException sqlException = mock(PSQLException.class);
        ServerErrorMessage serverError =
                mock(ServerErrorMessage.class);

        when(sqlException.getSQLState())
                .thenReturn(sqlState);

        when(sqlException.getServerErrorMessage())
                .thenReturn(serverError);

        when(serverError.getConstraint())
                .thenReturn(constraintName);

        return new PersistenceException(sqlException);
    }

    @Test
    void saveSirasindaRandevuCakismasiYakalanmali() {

        Appointment appointment = new Appointment();

        PersistenceException exception =
                createPersistenceException(
                        "23505",
                        "uq_active_appointment_slot"
                );

        doThrow(exception)
                .when(entityManager).persist(appointment);

        AppointmentSlotConflictException result = assertThrows(
                AppointmentSlotConflictException.class,
                () -> appointmentRepository.save(appointment)
        );

        assertEquals(
                "Bu randevu saati dolu.",
                result.getMessage()
        );

        assertSame(exception, result.getCause());
    }

    @Test
    void flushSirasindaRandevuCakismasiYakalanmali() {

        PersistenceException exception =
                createPersistenceException(
                        "23505",
                        "uq_active_appointment_slot"
                );

        doThrow(exception)
                .when(entityManager).flush();

        AppointmentSlotConflictException result = assertThrows(
                AppointmentSlotConflictException.class,
                () -> appointmentRepository.flush()
        );

        assertEquals(
                "Bu randevu saati dolu.",
                result.getMessage()
        );

        assertSame(exception, result.getCause());
    }

    @Test
    void farkliUniqueIndeksHatasiDegistirilmemeli() {

        PersistenceException exception =
                createPersistenceException(
                        "23505",
                        "uq_other_constraint"
                );

        doThrow(exception)
                .when(entityManager).flush();

        PersistenceException result = assertThrows(
                PersistenceException.class,
                () -> appointmentRepository.flush()
        );

        assertSame(exception, result);
    }

    @Test
    void foreignKeyHatasiDegistirilmemeli() {

        PersistenceException exception =
                createPersistenceException(
                        "23503",
                        "fk_appointment_pet"
                );

        doThrow(exception)
                .when(entityManager).flush();

        PersistenceException result = assertThrows(
                PersistenceException.class,
                () -> appointmentRepository.flush()
        );

        assertSame(exception, result);
    }

    @Test
    void basariliKayittaExceptionOlusmamali() {

        Appointment appointment = new Appointment();

        assertDoesNotThrow(
                () -> appointmentRepository.save(appointment)
        );

        assertDoesNotThrow(
                () -> appointmentRepository.flush()
        );

        verify(entityManager).persist(appointment);
        verify(entityManager).flush();
    }

    @Test
    void randevuDetaylariRecordAlanlarinaDogruEslenmeli() {

        Query query = mock(Query.class);

        Object[] row = {
                10L,
                2L,
                3L,
                "Genel kontrol",
                "Test notu",
                "scheduled",
                "2026-11-17T06:00:00Z",
                4L,
                "Dr. Elif Yılmaz",
                "PetLife Veteriner Kliniği",
                "Pamuk",
                "Kedi"
        };

        when(entityManager.createNativeQuery(anyString()))
                .thenReturn(query);

        when(query.setParameter(1, 1L))
                .thenReturn(query);

        when(query.setParameter(2, 1L))
                .thenReturn(query);

        when(query.getResultList())
                .thenReturn(List.<Object[]>of(row));

        List<AppointmentDetail> result =
                appointmentRepository.findDetailsByUserId(1L);

        assertEquals(1, result.size());

        AppointmentDetail detail = result.get(0);

        assertEquals(10L, detail.id());
        assertEquals(2L, detail.petId());
        assertEquals(3L, detail.availabilityId());
        assertEquals("Genel kontrol", detail.reason());
        assertEquals("Test notu", detail.notes());
        assertEquals("scheduled", detail.status());
        assertEquals("2026-11-17T06:00:00Z", detail.startTime());
        assertEquals(4L, detail.veterinarianId());
        assertEquals("Dr. Elif Yılmaz", detail.vetName());
        assertEquals("PetLife Veteriner Kliniği", detail.clinicName());
        assertEquals("Pamuk", detail.petName());
        assertEquals("Kedi", detail.petType());

        verify(query).setParameter(1, 1L);
        verify(query).setParameter(2, 1L);
    }

    @Test
    void randevuDetaylarindaNullAlanlarKorunmali() {

        Query query = mock(Query.class);

        Object[] row = {
                10L,
                2L,
                3L,
                null,
                null,
                "scheduled",
                "2026-11-17T06:00:00Z",
                4L,
                "Dr. Elif Yılmaz",
                null,
                "Pamuk",
                "Kedi"
        };

        when(entityManager.createNativeQuery(anyString()))
                .thenReturn(query);

        when(query.setParameter(1, 1L))
                .thenReturn(query);

        when(query.setParameter(2, 1L))
                .thenReturn(query);

        when(query.getResultList())
                .thenReturn(List.<Object[]>of(row));

        List<AppointmentDetail> result =
                appointmentRepository.findDetailsByUserId(1L);

        assertEquals(1, result.size());

        AppointmentDetail detail = result.get(0);

        assertNull(detail.reason());
        assertNull(detail.notes());
        assertNull(detail.clinicName());
    }
}