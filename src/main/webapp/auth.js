// ========================================
// PETCARE - KULLANICI KAYIT İŞLEMİ
// ========================================

const kayitFormu = document.getElementById("register-form");

if (kayitFormu) {

    const mesajAlani = document.getElementById("register-message");

    const alanlar = {
        firstName: document.getElementById("firstName"),
        lastName: document.getElementById("lastName"),
        email: document.getElementById("email"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword")
    };

    // Her alanın altında hata mesajı oluştur
    Object.entries(alanlar).forEach(([alanAdi, input]) => {

        const hataAlani = document.createElement("small");

        hataAlani.className = "field-error";
        hataAlani.id = alanAdi + "-error";
        hataAlani.setAttribute("aria-live", "polite");

        input.setAttribute("aria-describedby", hataAlani.id);

        input.closest(".form-group").appendChild(hataAlani);
    });

    function hataGoster(alanAdi, mesaj) {

        const input = alanlar[alanAdi];

        if (!input) return;

        document.getElementById(alanAdi + "-error").textContent = mesaj;

        input.classList.add("input-error");
        input.setAttribute("aria-invalid", "true");
    }

    function hatalariTemizle() {

        Object.entries(alanlar).forEach(([alanAdi, input]) => {

            document.getElementById(alanAdi + "-error").textContent = "";

            input.classList.remove("input-error");
            input.removeAttribute("aria-invalid");
        });

        mesajAlani.textContent = "";
        mesajAlani.className = "form-message";
    }

    // Kullanıcı alanı düzenlediğinde ilgili hatayı temizle
    Object.entries(alanlar).forEach(([alanAdi, input]) => {

        input.addEventListener("input", () => {

            document.getElementById(alanAdi + "-error").textContent = "";

            input.classList.remove("input-error");
            input.removeAttribute("aria-invalid");
        });
    });

    kayitFormu.addEventListener("submit", async function (event) {

        event.preventDefault();

        hatalariTemizle();

        const ad = alanlar.firstName.value.trim();
        const soyad = alanlar.lastName.value.trim();
        const eposta = alanlar.email.value.trim();
        const sifre = alanlar.password.value;
        const sifreTekrar = alanlar.confirmPassword.value;

        const kayitButonu = kayitFormu.querySelector('button[type="submit"]');

        let hataVar = false;

        // AD
        if (!ad) {
            hataGoster("firstName", "Ad alanı boş bırakılamaz.");
            hataVar = true;
        }

        // SOYAD
        if (!soyad) {
            hataGoster("lastName", "Soyad alanı boş bırakılamaz.");
            hataVar = true;
        }

        // E-POSTA
        if (!eposta) {

            hataGoster("email", "E-posta adresi boş bırakılamaz.");
            hataVar = true;

        } else if (!alanlar.email.validity.valid) {

            hataGoster("email", "Geçerli bir e-posta adresi giriniz.");
            hataVar = true;
        }

        // ŞİFRE
        if (!sifre) {

            hataGoster("password", "Şifre alanı boş bırakılamaz.");
            hataVar = true;

        } else if (sifre.length < 8 || sifre.length > 128) {

            hataGoster("password", "Şifre 8 ile 128 karakter arasında olmalıdır.");
            hataVar = true;
        }

        // ŞİFRE TEKRARI
        if (!sifreTekrar) {

            hataGoster("confirmPassword", "Lütfen şifrenizi tekrar giriniz.");
            hataVar = true;

        } else if (sifre !== sifreTekrar) {

            hataGoster("confirmPassword", "Şifreler birbiriyle eşleşmiyor.");
            hataVar = true;
        }

        // Hata varsa backend'e istek gönderme
        if (hataVar) {

            const ilkHataliAlan = kayitFormu.querySelector(".input-error");

            if (ilkHataliAlan) {
                ilkHataliAlan.focus();
            }

            return;
        }

        // Kayıt işlemi
        kayitButonu.disabled = true;
        kayitButonu.textContent = "Hesabın oluşturuluyor...";

        try {

            const cevap = await fetch("api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName: ad,
                    lastName: soyad,
                    email: eposta,
                    password: sifre
                })
            });

            const sonuc = await cevap.json();

            if (cevap.ok) {

                mesajAlani.textContent =
                    "Hesabın başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsun. 💜";

                mesajAlani.className = "form-message success";

                kayitFormu.reset();

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 2000);

            } else {

                // Backend'den gelen alan bazlı hataları göster
                const backendMesaji =
                    sonuc.message || "Kayıt sırasında bir hata oluştu.";

                const alanAdlari = [
                    "firstName",
                    "lastName",
                    "email",
                    "password"
                ];

                let alanHatasiBulundu = false;
                const genelHatalar = [];

                backendMesaji.split(", ").forEach(hata => {

                    const alanAdi = alanAdlari.find(
                        ad => hata.startsWith(ad + ":")
                    );

                    if (alanAdi) {

                        const aciklama = hata.substring(alanAdi.length + 1).trim();

                        hataGoster(alanAdi, aciklama);
                        alanHatasiBulundu = true;

                    } else {
                        genelHatalar.push(hata);
                    }
                });

                if (genelHatalar.length > 0 || !alanHatasiBulundu) {

                    mesajAlani.textContent =
                        genelHatalar.join(", ") || backendMesaji;

                    mesajAlani.className = "form-message error";
                }
            }

        } catch (hata) {

            console.error("Kayıt hatası:", hata);

            mesajAlani.textContent =
                "Sunucuya bağlanılamadı. Lütfen tekrar dene.";

            mesajAlani.className = "form-message error";

        } finally {

            kayitButonu.disabled = false;
            kayitButonu.textContent = "Hesap Oluştur →";
        }

    });
}

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // ŞİFRE GÖSTER / GİZLE
    // ========================================

    const passwordButtons = document.querySelectorAll(".toggle-password");

    // Açık göz simgesi
    const eyeOpen = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="22"
             height="22"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="1.8"
             stroke-linecap="round"
             stroke-linejoin="round">

            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
            <circle cx="12" cy="12" r="3"/>

        </svg>
    `;

    // Üzeri çizili göz simgesi
    const eyeClosed = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="22"
             height="22"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="1.8"
             stroke-linecap="round"
             stroke-linejoin="round">

            <path d="M3 3l18 18"/>
            <path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.2 4.1"/>
            <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.2-.9"/>
            <path d="M10 10a3 3 0 0 0 4 4"/>

        </svg>
    `;

    passwordButtons.forEach(button => {

        const input = button.parentElement.querySelector("input");

        // Sayfa ilk açıldığında şifre gizli
        button.innerHTML = eyeClosed;

        button.addEventListener("click", () => {

            const isHidden = input.type === "password";

            if (isHidden) {

                // Şifreyi göster
                input.type = "text";
                button.innerHTML = eyeOpen;

            } else {

                // Şifreyi gizle
                input.type = "password";
                button.innerHTML = eyeClosed;

            }

            button.setAttribute(
                "aria-pressed",
                String(isHidden)
            );

            button.setAttribute(
                "aria-label",
                isHidden ? "Şifreyi gizle" : "Şifreyi göster"
            );

        });

    });
// ========================================
// PETCARE - GİRİŞ FORMU
// ========================================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {

        const emailInput = loginForm.querySelector("#email");
        const passwordInput = loginForm.querySelector("#password");

        const message = document.getElementById("login-message");
        const loginButton = loginForm.querySelector('button[type="submit"]');

        const loginFields = {
            email: emailInput,
            password: passwordInput
        };

        // Her giriş alanının altında hata mesajı oluştur
        Object.entries(loginFields).forEach(([fieldName, input]) => {

            const errorElement = document.createElement("small");

            errorElement.className = "field-error";
            errorElement.id = "login-" + fieldName + "-error";
            errorElement.setAttribute("aria-live", "polite");

            input.setAttribute("aria-describedby", errorElement.id);

            input.closest(".form-group").appendChild(errorElement);
        });

        // Hata mesajını ilgili alanın altında göster
        function showLoginError(fieldName, errorMessage) {

            const input = loginFields[fieldName];

            if (!input) return;

            document.getElementById(
                "login-" + fieldName + "-error"
            ).textContent = errorMessage;

            input.classList.add("input-error");
            input.setAttribute("aria-invalid", "true");
        }

        // Önceki hataları temizle
        function clearLoginErrors() {

            Object.entries(loginFields).forEach(([fieldName, input]) => {

                document.getElementById(
                    "login-" + fieldName + "-error"
                ).textContent = "";

                input.classList.remove("input-error");
                input.removeAttribute("aria-invalid");
            });

            message.textContent = "";
            message.className = "form-message";
        }

        // Kullanıcı alanı düzenlediğinde o alanın hatasını temizle
        Object.entries(loginFields).forEach(([fieldName, input]) => {

            input.addEventListener("input", () => {

                document.getElementById(
                    "login-" + fieldName + "-error"
                ).textContent = "";

                input.classList.remove("input-error");
                input.removeAttribute("aria-invalid");
            });
        });

        // Giriş işlemi
        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            clearLoginErrors();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            let hasError = false;

            // E-posta boş mu?
            if (!email) {

                showLoginError(
                    "email",
                    "E-posta adresi boş bırakılamaz."
                );

                hasError = true;

            } else if (!emailInput.validity.valid) {

                showLoginError(
                    "email",
                    "Geçerli bir e-posta adresi giriniz."
                );

                hasError = true;
            }

            // Şifre boş mu?
            if (!password) {

                showLoginError(
                    "password",
                    "Şifre alanı boş bırakılamaz."
                );

                hasError = true;
            }

            // Geçersiz bilgilerle sunucuya istek gönderme
            if (hasError) {

                const firstInvalidInput =
                    loginForm.querySelector(".input-error");

                if (firstInvalidInput) {
                    firstInvalidInput.focus();
                }

                return;
            }

            loginButton.disabled = true;
            loginButton.textContent = "Giriş yapılıyor...";

            try {

                const response = await fetch("api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                const result = await response.json();

                if (response.ok) {

                    message.textContent =
                        "Giriş başarılı! Yönlendiriliyorsun. 💜";

                    message.className = "form-message success";

                    setTimeout(function () {
                        window.location.href = "index.html";
                    }, 1000);

                } else {

                    // Güvenlik nedeniyle hatalı e-posta ve şifreyi
                    // birbirinden ayırmıyoruz.
                    if (response.status === 401) {

                        message.textContent =
                            "E-posta adresi veya şifre hatalı.";

                    } else {

                        // 429 gibi durumlarda backend mesajını koru
                        message.textContent =
                            result.message || "Giriş sırasında bir hata oluştu.";
                    }

                    message.className = "form-message error";
                }

            } catch (error) {

                console.error("Giriş hatası:", error);

                message.textContent =
                    "Sunucuyla iletişim kurulamadı. Lütfen tekrar dene.";

                message.className = "form-message error";

            } finally {

                loginButton.disabled = false;
                loginButton.textContent = "Giriş Yap →";
            }

        });
    }

});