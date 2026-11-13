
-- ==========================================
-- PETCARE - SAĞLIK KAYITLARI
-- ==========================================

CREATE TABLE IF NOT EXISTS health_records (
                                              id BIGSERIAL PRIMARY KEY,

                                              pet_id BIGINT NOT NULL,

                                              type VARCHAR(30) NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    clinic VARCHAR(150),

    record_date DATE NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_health_record_pet
    FOREIGN KEY (pet_id)
    REFERENCES pets(id)
    ON DELETE CASCADE,

    CONSTRAINT chk_health_record_type
    CHECK (
              type IN (
              'examination',
              'vaccination',
              'treatment',
              'test',
              'other'
                      )
    )
    );

CREATE INDEX IF NOT EXISTS idx_health_records_pet_id
    ON health_records(pet_id);
