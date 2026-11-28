-- PETCARE VETERINER ARA
-- Demo klinik verileri

BEGIN;

-- 1. Demo kliniği oluştur
INSERT INTO clinics (
    name,
    district,
    address,
    is_demo,
    is_active
)
SELECT
    'PetCare Veteriner Kliniği',
    'Kadıköy',
    'Demo klinik - gerçek adres değildir',
    TRUE,
    TRUE
    WHERE NOT EXISTS (
    SELECT 1
    FROM clinics
    WHERE name = 'PetCare Veteriner Kliniği'
      AND is_demo = TRUE
);

-- 2. Mevcut demo veterineri kliniğe bağla
UPDATE veterinarians
SET clinic_id = (
    SELECT id
    FROM clinics
    WHERE name = 'PetCare Veteriner Kliniği'
      AND is_demo = TRUE
    ORDER BY id
    LIMIT 1
    )
WHERE id = 1
  AND full_name = 'Dr. Ahmet Yılmaz'
  AND clinic_name = 'PetCare Veteriner Kliniği'
  AND clinic_id IS NULL;

COMMIT;