-- PETCARE RANDEVU SISTEMI

-- 1. Veterinerler
CREATE TABLE IF NOT EXISTS veterinarians (
                                             id BIGSERIAL PRIMARY KEY,
                                             full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    clinic_name VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
    );

-- 2. Veterinerlerin musait saatleri
CREATE TABLE IF NOT EXISTS vet_availability (
                                                id BIGSERIAL PRIMARY KEY,
                                                veterinarian_id BIGINT NOT NULL,
                                                start_time TIMESTAMPTZ NOT NULL,
                                                end_time TIMESTAMPTZ NOT NULL,
                                                is_active BOOLEAN NOT NULL DEFAULT TRUE,

                                                CONSTRAINT fk_availability_vet
                                                FOREIGN KEY (veterinarian_id)
    REFERENCES veterinarians(id),

    CONSTRAINT chk_availability_time
    CHECK (end_time > start_time),

    CONSTRAINT uq_vet_start
    UNIQUE (veterinarian_id, start_time)
    );

-- 3. Randevular
CREATE TABLE IF NOT EXISTS appointments (
                                            id BIGSERIAL PRIMARY KEY,

                                            user_id BIGINT NOT NULL,
                                            pet_id BIGINT NOT NULL,
                                            availability_id BIGINT NOT NULL,

                                            reason VARCHAR(255),
    notes TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_appointment_pet
    FOREIGN KEY (pet_id)
    REFERENCES pets(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_appointment_availability
    FOREIGN KEY (availability_id)
    REFERENCES vet_availability(id),

    CONSTRAINT chk_appointment_status
    CHECK (status IN (
           'scheduled',
           'completed',
           'cancelled'
                     ))
    );

-- Ayni saat icin iki aktif randevuyu engelle
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_appointment_slot
    ON appointments (availability_id)
    WHERE status = 'scheduled';