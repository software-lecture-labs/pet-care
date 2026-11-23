BEGIN;

WITH seed(name, district, address, phone) AS (
    VALUES
        ('Vetoloji Veteriner Kliniği', 'Maltepe', 'Zümrütevler Mah., Gözütok Plaza, Karaca Cd. No:3-5, 34852 Maltepe/İstanbul', '+90 540 110 00 34'),
        ('Modernvet Veteriner Kliniği', 'Maltepe', 'Cevizli Mah., Tansel Cd. No:29A, Maltepe/İstanbul', '+90 505 034 63 46'),
        ('Kadıköy Vetcode Veteriner Kliniği', 'Kadıköy', 'Rasimpaşa Mah., Nuhbey Sk., İkizler Apt. No:2/A/1, 34716 Kadıköy/İstanbul', '+90 216 784 20 11'),
        ('Barış Veteriner Kliniği', 'Kadıköy', 'Feneryolu Mah., Fahrettin Kerim Gökay Cd. No:60, 34724 Kadıköy/İstanbul', '+90 216 550 00 52'),
        ('Vetmedica Üsküdar Veteriner Kliniği', 'Üsküdar', 'Aziz Mahmut Hüdayi Mah., Halk Cd. No:24, Üsküdar/İstanbul', '+90 555 094 66 52'),
        ('Vet216 Koşuyolu Veteriner Kliniği', 'Kadıköy', 'Koşuyolu Mah., Koşuyolu Cd. No:78, 34718 Kadıköy/İstanbul', '+90 507 335 57 47'),
        ('AnimaRustik Veteriner Kliniği', 'Kadıköy', 'Koşuyolu Mah., Ali Nazime Sk. No:33/A, 34718 Kadıköy/İstanbul', '+90 533 031 69 81'),
        ('Universal Fatih Hayvan Hastanesi Maltepe', 'Maltepe', 'Aydınevler Mah., Sanayi Cd. No:19, 34854 Maltepe/İstanbul', '+90 545 162 17 00'),
        ('VetArt Veteriner Kliniği', 'Üsküdar', 'İcadiye Mah., Cumhuriyet Cd. No:57, 34674 Üsküdar/İstanbul', '+90 216 553 01 12'),
        ('Üsküdar Pet Tower Veteriner Kliniği', 'Üsküdar', 'Salacak Mah., Halk Dersanesi Sk. No:3 D:A, 34668 Üsküdar/İstanbul', '+90 506 545 71 02'),
        ('Kadıköy Rıhtım Veteriner Kliniği', 'Kadıköy', 'Rasimpaşa Mah., Misak-ı Milli Sk. No:47/A, 34716 Kadıköy/İstanbul', NULL),
        ('Papyon Veteriner Kliniği', 'Maltepe', 'Cevizli Mah., 30 Ağustos Cd. No:9 D:11AE, 34865 Maltepe/İstanbul', '+90 532 643 38 16'),
        ('Vet Lobi Veteriner Kliniği', 'Ataşehir', 'Küçükbakkalköy Mah., Cengiz Topel Cd., Elif Apt. No:25-27/A, 34750 Ataşehir/İstanbul', '+90 505 213 83 76'),
        ('Ataşehir Metropol Veteriner Kliniği', 'Ataşehir', 'Barbaros Mah., Mor Amber Sk. No:1/E, Ataşehir/İstanbul', '+90 545 504 19 19'),
        ('Boncuk Veteriner Kliniği', 'Maltepe', 'Gümüş Sk. No:2, Maltepe/İstanbul', '+90 216 352 58 09'),
        ('Moon Veteriner Kliniği', 'Kadıköy', 'Fenerbahçe Mah., Dr. Faruk Ayanoğlu Cd. No:1B, 34726 Kadıköy/İstanbul', '+90 542 269 44 96'),
        ('VET34 Veteriner Kliniği', 'Kartal', 'Orhantepe Mah., Üsküdar Cd., Prava Kartal B Blok 192/H, 34865 Kartal/İstanbul', '+90 533 046 08 38'),
        ('Good Place Veteriner Kliniği', 'Kartal', 'Esentepe Mah., İnönü Cd. No:147/7, Kartal Kule, 34870 Kartal/İstanbul', '+90 544 913 46 63'),
        ('Vet Pegas Veteriner Kliniği', 'Kartal', 'Soğanlık Yeni Mah., Pegagaz Sk. No:6/B D:2, 34862 Kartal/İstanbul', '+90 539 610 51 11'),
        ('Therapet Veteriner Kliniği', 'Kartal', 'Orhantepe Mah., Halitpaşa Cd. No:2A, Kartal/İstanbul', '+90 530 731 40 22'),
        ('Siyendi Veteriner Kliniği', 'Kartal', 'Karlıktepe Mah., Yaşar Doğu Cd. No:33/A, Kartal/İstanbul', '+90 501 161 81 81'),
        ('YARIMADA Veteriner Kliniği', 'Kartal', 'Orhantepe Mah., Tekel Cd. No:26/A, 34865 Kartal/İstanbul', '+90 554 347 24 96'),
        ('PUMA Veteriner Kliniği Kartal', 'Kartal', 'Orhantepe Mah., Üsküdar Cd. No:180/A, 34865 Kartal/İstanbul', '+90 536 472 37 77'),
        ('Mario Veteriner Kliniği', 'Pendik', 'Bahçelievler Mah., Dolayoba Cd. No:10, 34893 Pendik/İstanbul', '+90 538 465 50 00'),
        ('Vetkonsept Veteriner Kliniği', 'Pendik', 'Kurtköy Mah., Sena Sk. No:43/E-1, Pendik/İstanbul', '+90 216 999 23 11'),
        ('Dünya Veteriner Kliniği', 'Pendik', 'Harmandere Mah., Küme Sk., 34912 Pendik/İstanbul', '+90 533 554 97 70'),
        ('HOSVETAL Veteriner Kliniği', 'Pendik', 'Esenler Mah., Muhsin Yazıcıoğlu Cd. No:48/B, 34899 Pendik/İstanbul', '+90 507 746 07 94'),
        ('Yenişehir Vet Veteriner Kliniği', 'Pendik', 'Yenişehir Mah., Mustafa Akyol Sk. No:11 D:133, 34912 Pendik/İstanbul', '+90 545 768 45 45'),
        ('Pendik Vetmarina Veteriner Kliniği', 'Pendik', 'Batı Mah., İpek Sk. No:14, 34890 Pendik/İstanbul', '+90 530 446 93 61'),
        ('PetMen Veteriner Kliniği', 'Pendik', 'Yeni Mah., Hamidiye Sk. No:17/A-B, Pendik/İstanbul', '+90 543 502 08 00')
)
INSERT INTO clinics (
    name, district, address, phone, latitude, longitude, image_url, is_demo, is_active
)
SELECT
    s.name, s.district, s.address, s.phone,
    NULL, NULL, NULL, FALSE, TRUE
FROM seed s
WHERE NOT EXISTS (
    SELECT 1 FROM clinics c
    WHERE c.name = s.name AND c.district = s.district
);

COMMIT;