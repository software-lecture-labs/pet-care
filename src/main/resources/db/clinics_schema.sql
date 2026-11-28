-- PETCARE VETERINER ARA MODULU
-- Klinik bilgileri

CREATE TABLE IF NOT EXISTS clinics (
                                       id BIGSERIAL PRIMARY KEY,

                                       name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    phone VARCHAR(30),
    image_url TEXT,

    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_clinic_latitude
    CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_clinic_longitude
    CHECK (longitude BETWEEN -180 AND 180)
    );

-- Klinik adına göre arama için indeks
CREATE INDEX IF NOT EXISTS idx_clinics_name
    ON clinics(name);

-- İlçe filtresi için indeks
CREATE INDEX IF NOT EXISTS idx_clinics_district
    ON clinics(district);

-- ========================================
-- VETERINER - KLINIK ILISKISI
-- ========================================

ALTER TABLE veterinarians
    ADD COLUMN IF NOT EXISTS clinic_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_veterinarians_clinic'
          AND conrelid = 'veterinarians'::regclass
    ) THEN
        ALTER TABLE veterinarians
            ADD CONSTRAINT fk_veterinarians_clinic
            FOREIGN KEY (clinic_id)
            REFERENCES clinics(id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_veterinarians_clinic_id
    ON veterinarians(clinic_id);