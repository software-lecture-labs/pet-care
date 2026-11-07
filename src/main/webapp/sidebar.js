const sidebarItems = [
    { href: "index.html", label: "🏠 Ana Sayfa" },
    { href: "pets.html", label: "🐾 Hayvanlarım" },
    { href: "appointments.html", label: "📅 Randevularım" },
    { href: "health-records.html", label: "📋 Sağlık Kayıtları" },
    { href: "vaccinations.html", label: "💉 Aşı Takibi" },
    { href: "veterinarians.html", label: "🩺 Veteriner Ara" },
    { href: "pet-sitters.html", label: "👤 Evcil Hayvan Bakıcısı" },
    { href: "reservations.html", label: "🔖 Rezervasyonlarım" },
    { href: "reminders.html", label: "🔔 Hatırlatıcılar" },
    { href: "favorites.html", label: "❤️ Favoriler" },
    { href: "settings.html", label: "⚙️ Ayarlar" }
];

function renderSidebar() {
    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) return;

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    sidebar.innerHTML = `
        <div class="logo">🐾 PetCare</div>

        <nav class="sidebar-menu" aria-label="Ana menü">
            ${sidebarItems.map(item => `
                <a href="${item.href}"
                   class="menu-item ${currentPage === item.href ? "active" : ""}">
                    ${item.label}
                </a>
            `).join("")}
        </nav>
    `;
}

document.addEventListener("DOMContentLoaded", renderSidebar);