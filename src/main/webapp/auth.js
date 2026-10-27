// PETCARE - GİRİŞ VE KAYIT İŞLEMLERİ

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
// GİRİŞ FORMU - BACKEND BAĞLANTISI
// ========================================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            const message = document.getElementById("login-message");
            const loginButton = loginForm.querySelector('button[type="submit"]');

            message.textContent = "";

            // Boş alan kontrolü
            if (!email || !password) {
                message.textContent = "E-posta ve şifre alanlarını doldurun.";
                message.className = "form-message error";
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

                    message.textContent = "Giriş başarılı! Yönlendiriliyorsun. 💜";
                    message.className = "form-message success";

                    setTimeout(function () {
                        window.location.href = "index.html";
                    }, 1000);

                } else {

                    message.textContent =
                        result.message || "E-posta adresi veya şifre hatalı.";

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
    // ========================================
// PETCARE - KULLANICI KAYIT İŞLEMİ
// ========================================

    const kayitFormu = document.getElementById("register-form");

    if (kayitFormu) {

        kayitFormu.addEventListener("submit", async function (event) {

            // Sayfanın yenilenmesini engelle
            event.preventDefault();

            const ad = document.getElementById("firstName").value.trim();
            const soyad = document.getElementById("lastName").value.trim();
            const eposta = document.getElementById("email").value.trim();
            const sifre = document.getElementById("password").value;
            const sifreTekrar = document.getElementById("confirmPassword").value;

            const mesajAlani = document.getElementById("register-message");
            const kayitButonu = kayitFormu.querySelector('button[type="submit"]');

            mesajAlani.textContent = "";

            // Şifrelerin eşleşmesini kontrol et
            if (sifre !== sifreTekrar) {
                mesajAlani.textContent = "Şifreler birbiriyle eşleşmiyor.";
                mesajAlani.style.color = "#e74c3c";
                return;
            }

            // Şifre uzunluğu kontrolü
            if (sifre.length < 8) {
                mesajAlani.textContent = "Şifre en az 8 karakter olmalıdır.";
                mesajAlani.style.color = "#e74c3c";
                return;
            }

            // Kayıt işlemi boyunca butonu devre dışı bırak
            kayitButonu.disabled = true;
            kayitButonu.textContent = "Hesabın oluşturuluyor...";

            try {

                // Java backend'imize kayıt isteği gönder
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

                    mesajAlani.style.color = "#27ae60";

                    kayitFormu.reset();

                    // 2 saniye sonra giriş sayfasına yönlendir
                    setTimeout(function () {
                        window.location.href = "login.html";
                    }, 2000);

                } else {

                    mesajAlani.textContent =
                        sonuc.message || "Kayıt sırasında bir hata oluştu.";

                    mesajAlani.style.color = "#e74c3c";

                }

            } catch (hata) {

                console.error("Kayıt hatası:", hata);

                mesajAlani.textContent =
                    "Sunucuya bağlanılamadı. Lütfen tekrar dene.";

                mesajAlani.style.color = "#e74c3c";

            } finally {

                kayitButonu.disabled = false;
                kayitButonu.textContent = "Hesap Oluştur →";

            }

        });

    }

});