-- PETCARE VERITABANI SEMASI
-- Kullanici tablosu

CREATE TABLE IF NOT EXISTS users (
                                     id BIGSERIAL PRIMARY KEY,
                                     first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

-- ========================================
-- HAYVANLAR TABLOSU
-- ========================================

CREATE TABLE IF NOT EXISTS pets (
                                    id BIGSERIAL PRIMARY KEY,
                                    user_id BIGINT NOT NULL,

                                    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    breed VARCHAR(100),
    gender VARCHAR(10),
    birth_date DATE,
    weight NUMERIC(6,2),
    notes TEXT,
    photo_path TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pets_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT chk_pets_weight
    CHECK (weight IS NULL OR weight > 0)
    );