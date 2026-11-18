-- PETCARE RANDEVU SISTEMI - GELISTIRME VERILERI
-- appointments_schema.sql dosyasindan sonra calistirilmalidir.
-- Bu dosya yalnizca gelistirme ve test amaclidir.

BEGIN;

-- 1. Ornek veterinerleri ekle
INSERT INTO veterinarians (full_name,
                           specialty,
                           clinic_name,
                           is_active)
SELECT seed.full_name,
       seed.specialty,
       seed.clinic_name,
       TRUE
FROM (VALUES ('Dr. Elif Yılmaz', 'Genel Muayene',
              'PetLife Veteriner Kliniği'),

             ('Dr. Mert Kaya', 'Cerrahi',
              'Minik Dostlar Kliniği'),

             ('Dr. Zeynep Demir', 'Dermatoloji',
              'Patili Dostlar Kliniği'),

             ('Dr. Burak Çelik', 'İç Hastalıkları',
              'PetLife Veteriner Kliniği'),

             ('Dr. Deniz Aydın', 'Aşı ve Koruyucu Hekimlik',
              'Can Dostum Kliniği'),

             ('Dr. Selin Arslan', 'Diş Sağlığı',
              'Mutlu Patiler Kliniği')) AS seed(full_name, specialty, clinic_name)
WHERE NOT EXISTS (SELECT 1
                  FROM veterinarians v
                  WHERE v.full_name = seed.full_name
                    AND v.clinic_name = seed.clinic_name);

-- 2. Onumuzdeki 7 gun icin musait saatleri olustur
INSERT INTO vet_availability (veterinarian_id,
                              start_time,
                              end_time,
                              is_active)
SELECT v.id,
       (days.appointment_date::date + hours.start_hour)
           AT TIME ZONE 'Europe/Istanbul',

       (days.appointment_date::date + hours.start_hour
        + INTERVAL '30 minutes')
           AT TIME ZONE 'Europe/Istanbul',

       TRUE
FROM veterinarians v

         CROSS JOIN generate_series(
        (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Istanbul'):: date + 1,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Istanbul'):: date + 7,
        INTERVAL '1 day'
                    ) AS days(appointment_date)

         CROSS JOIN (VALUES (TIME '09:00'),
                            (TIME '09:30'),
                            (TIME '10:00'),
                            (TIME '10:30'),
                            (TIME '11:00'),
                            (TIME '11:30'),
                            (TIME '13:00'),
                            (TIME '13:30'),
                            (TIME '14:00'),
                            (TIME '14:30'),
                            (TIME '15:00'),
                            (TIME '15:30')) AS hours(start_hour)

WHERE v.is_active = TRUE
  AND (v.full_name, v.clinic_name) IN (
                                       ('Dr. Elif Yılmaz', 'PetLife Veteriner Kliniği'),
                                       ('Dr. Mert Kaya', 'Minik Dostlar Kliniği'),
                                       ('Dr. Zeynep Demir', 'Patili Dostlar Kliniği'),
                                       ('Dr. Burak Çelik', 'PetLife Veteriner Kliniği'),
                                       ('Dr. Deniz Aydın', 'Can Dostum Kliniği'),
                                       ('Dr. Selin Arslan', 'Mutlu Patiler Kliniği')
    )

    ON CONFLICT (veterinarian_id, start_time)
DO NOTHING;

COMMIT;