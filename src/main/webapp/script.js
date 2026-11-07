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

        const profileFullname = document.getElementById("profile-fullname");
        const profileEmail = document.getElementById("profile-email");

        const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ");

        if (profileName) {
            profileName.textContent = fullName;
        }

        if (welcomeMessage) {
            welcomeMessage.textContent =
                "Merhaba, " + user.firstName + "! 💜";
        }

        if (profileFullname) {
            profileFullname.textContent = fullName || "-";
        }

        if (profileEmail) {
            profileEmail.textContent = user.email || "-";
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

    // ========================================
    // 5. ARAMA KUTUSU
    // ========================================

    const searchInput = document.querySelector(".search-box input");
    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;

            event.preventDefault();

            const searchText = searchInput.value
                .trim()
                .toLocaleLowerCase("tr-TR");

            if (!searchText) return;

            if (
                searchText.includes("hayvan") ||
                searchText.includes("petlerim")
            ) {
                window.location.href = "pets.html";

            } else if (searchText.includes("randevu")) {
                window.location.href = "appointments.html";

            } else if (
                searchText.includes("sağlık") ||
                searchText.includes("sağlik")
            ) {
                window.location.href = "health-records.html";

            } else if (searchText.includes("aşı")) {
                window.location.href = "vaccinations.html";

            } else if (
                searchText.includes("veteriner") ||
                searchText.includes("klinik")
            ) {
                window.location.href = "veterinarians.html";

            } else if (
                searchText.includes("bakıcı") ||
                searchText.includes("pet sitter")
            ) {
                window.location.href = "pet-sitters.html";

            } else if (searchText.includes("rezervasyon")) {
                window.location.href = "reservations.html";

            } else if (searchText.includes("hatırlat")) {
                window.location.href = "reminders.html";

            } else if (searchText.includes("favori")) {
                window.location.href = "favorites.html";

            } else if (searchText.includes("ayar")) {
                window.location.href = "settings.html";

            } else {
                alert("Bu arama için henüz bir sayfa bulunmuyor. 💜");
            }
        });
    }

    // ========================================
    // 6. BİLDİRİM PANELİ
    // ========================================

    const notificationButton = document.getElementById("notification-btn");
    const notificationPanel = document.getElementById("notification-panel");

    if (notificationButton && notificationPanel) {


        notificationButton.addEventListener("click", function (event) {
            event.stopPropagation();

            const willOpen = notificationPanel.hidden;

            // Önce iki paneli de kapat
            notificationPanel.hidden = true;
            notificationButton.setAttribute("aria-expanded", "false");

            const otherPanel = document.getElementById("profile-panel");
            const otherButton = document.getElementById("profile-btn");

            if (otherPanel) otherPanel.hidden = true;
            if (otherButton) otherButton.setAttribute("aria-expanded", "false");

            // Sadece bildirim panelini aç
            notificationPanel.hidden = !willOpen;
            notificationButton.setAttribute("aria-expanded", String(willOpen));
        });


        // Panelin içine tıklanınca kapanmasın
        notificationPanel.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        // Panelin dışına tıklanınca kapansın
        document.addEventListener("click", function () {
            notificationPanel.hidden = true;
            notificationButton.setAttribute("aria-expanded", "false");
        });

        // Escape tuşuyla kapansın
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                notificationPanel.hidden = true;
                notificationButton.setAttribute("aria-expanded", "false");
            }
        });
    }


    // ========================================
    // PROFİL BİLGİ PANELİ
    // ========================================

    const profileButton = document.getElementById("profile-btn");
    const profilePanel = document.getElementById("profile-panel");

    if (profileButton && profilePanel) {

        profileButton.addEventListener("click", function (event) {
            event.stopPropagation();

            const willOpen = profilePanel.hidden;

            // Önce iki paneli de kapat
            profilePanel.hidden = true;
            profileButton.setAttribute("aria-expanded", "false");

            const otherPanel = document.getElementById("notification-panel");
            const otherButton = document.getElementById("notification-btn");

            if (otherPanel) otherPanel.hidden = true;
            if (otherButton) otherButton.setAttribute("aria-expanded", "false");

            // Sadece profil panelini aç
            profilePanel.hidden = !willOpen;
            profileButton.setAttribute("aria-expanded", String(willOpen));
        });


        // Panelin içine tıklanınca açık kalsın
        profilePanel.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        // Panelin dışına tıklanınca kapansın
        document.addEventListener("click", function () {
            profilePanel.hidden = true;
            profileButton.setAttribute("aria-expanded", "false");
        });

        // Escape tuşuna basınca kapansın
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                profilePanel.hidden = true;
                profileButton.setAttribute("aria-expanded", "false");
            }
        });

    }
});