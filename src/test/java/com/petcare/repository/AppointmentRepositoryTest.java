package com.petcare.repository;

import com.petcare.entity.Appointment;
import com.petcare.exception.AppointmentSlotConflictException;
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
}