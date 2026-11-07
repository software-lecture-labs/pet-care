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
    const searchMessage = document.getElementById("search-message");

    function hideSearchMessage() {
        if (!searchMessage) return;
        searchMessage.hidden = true;
        searchMessage.textContent = "";
    }
    if (searchInput) {
        searchInput.addEventListener("input", hideSearchMessage);
        searchInput.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;

            event.preventDefault();
            hideSearchMessage();

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
                if (searchMessage) {
                    searchMessage.textContent =
                        "Bu isimde bir sayfa bulunamadı. Lütfen menüdeki sayfa adlarından birini arayın. 💜";
                    searchMessage.hidden = false;
                }
            }
        });
    }

    // ========================================
    // 6. BİLDİRİM VE PROFİL PANELLERİ
    // ========================================

    const panels = [
        {
            button: document.getElementById("notification-btn"),
            panel: document.getElementById("notification-panel")
        },
        {
            button: document.getElementById("profile-btn"),
            panel: document.getElementById("profile-panel")
        }
    ].filter(item => item.button && item.panel);

    // Bütün panelleri kapat
    function closeAllPanels() {
        panels.forEach(function (item) {
            item.panel.hidden = true;
            item.button.setAttribute("aria-expanded", "false");
        });
    }

    // Panel açma ve kapatma işlemleri
    panels.forEach(function (item) {

        item.button.addEventListener("click", function (event) {
            event.stopPropagation();

            const willOpen = item.panel.hidden;

            // Önce açık panelleri kapat
            closeAllPanels();

            // Tıklanan panel daha önce kapalıysa aç
            if (willOpen) {
                item.panel.hidden = false;
                item.button.setAttribute("aria-expanded", "true");
            }
        });

    });

    // Panellerin dışına tıklanınca kapat
    document.addEventListener("click", function (event) {

        const clickedInside = panels.some(function (item) {
            return item.panel.contains(event.target) ||
                item.button.contains(event.target);
        });

        if (!clickedInside) {
            closeAllPanels();
        }
    });

    // Escape tuşuna basınca kapat
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeAllPanels();
        }
    });
});