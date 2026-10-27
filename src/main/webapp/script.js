// ========================================
// PETCARE - ANA SAYFA VE OTURUM İŞLEMLERİ
// ========================================

document.addEventListener("DOMContentLoaded", async function () {

    // ========================================
    // 1. OTURUM KONTROLÜ
    // ========================================

    try {
        const response = await fetch("api/auth/me", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        // Kullanıcı giriş yapmamışsa
        if (response.status === 401) {
            window.location.replace("login.html");
            return;
        }

        if (!response.ok) {
            throw new Error("Oturum kontrolü başarısız.");
        }

        const user = await response.json();

        // ========================================
        // 2. KULLANICI BİLGİLERİNİ GÖSTER
        // ========================================

        const profileName = document.getElementById("profile-name");
        const welcomeMessage = document.getElementById("welcome-message");

        if (profileName) {
            profileName.textContent =
                user.firstName + " " + user.lastName;
        }

        if (welcomeMessage) {
            welcomeMessage.textContent =
                "Merhaba, " + user.firstName + "! 💜";
        }

    } catch (error) {
        console.error("Oturum kontrol hatası:", error);

        // Sunucu hatasında kullanıcıyı giriş yapmamış
        // gibi göstermiyoruz.
        alert("Oturum kontrolü yapılamadı. Lütfen tekrar deneyin.");
        return;
    }

    // ========================================
    // 3. BUGÜNÜN TARİHİNİ GÖSTER
    // ========================================

    const dateElement = document.getElementById("today-date");

    if (dateElement) {
        const today = new Date();

        dateElement.textContent = today.toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    // ========================================
    // 4. ÇIKIŞ YAPMA
    // ========================================

    const logoutButton = document.getElementById("logout-btn");

    if (logoutButton) {

        logoutButton.addEventListener("click", async function () {

            logoutButton.disabled = true;
            logoutButton.textContent = "Çıkış yapılıyor...";

            try {
                const response = await fetch("api/auth/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });

                if (!response.ok) {
                    throw new Error("Çıkış işlemi başarısız.");
                }

                // Oturum kapatıldı, giriş sayfasına dön.
                window.location.replace("login.html");

            } catch (error) {
                console.error("Çıkış hatası:", error);

                alert("Çıkış yapılamadı. Lütfen tekrar deneyin.");

                logoutButton.disabled = false;
                logoutButton.textContent = "🚪 Çıkış Yap";
            }

        });
    }

});