// ========================================
// PETCARE - ORTAK ÜST ÇUBUK
// ========================================

document.addEventListener('DOMContentLoaded', function () {
  const topbar = document.querySelector('.topbar');

  if (!topbar) return;

  topbar.innerHTML = `
        <div class="search-wrapper">

            <div class="search-box">
                <span>🔍</span>
                <input
                    type="search"
                    placeholder="Sayfa ara..."
                    aria-label="Sayfa ara"
                    aria-describedby="search-message"
                >
            </div>

            <p id="search-message"
               class="search-message"
               role="status"
               aria-live="polite"
               hidden></p>

        </div>

        <div class="topbar-actions">

            <!-- BİLDİRİMLER -->
            <div class="notification-wrapper">

                <button
                    id="notification-btn"
                    class="notification-btn"
                    type="button"
                    aria-label="Bildirimleri göster"
                    aria-expanded="false"
                    aria-controls="notification-panel">
                    🔔
                </button>

                <div id="notification-panel"
                     class="notification-panel"
                     hidden>

                    <h3>🔔 Bildirimler</h3>

                    <p class="demo-data-note">
                        ℹ️ Bu bildirimler tanıtım amaçlı örnek verilerdir.
                    </p>

                    <div class="notification-item">
                        <span>💉</span>
                        <div>
                            <strong>Pamuk — Kuduz Aşısı</strong>
                            <small>5 Kasım 2026</small>
                        </div>
                    </div>

                    <div class="notification-item">
                        <span>💊</span>
                        <div>
                            <strong>Boncuk — Vitamin Takviyesi</strong>
                            <small>2 Kasım 2026</small>
                        </div>
                    </div>

                    <a href="reminders.html" class="notification-all">
                        Tüm Hatırlatıcıları Gör →
                    </a>

                </div>
            </div>

            <!-- PROFİL -->
            <div class="profile-wrapper">

                <button
                    type="button"
                    class="user-profile"
                    id="profile-btn"
                    aria-expanded="false"
                    aria-controls="profile-panel">

                    <div class="avatar">👩</div>

                    <div class="user-info">
                        <strong id="profile-name">Kullanıcı</strong>
                        <small>Evcil Hayvan Sahibi</small>
                    </div>

                </button>

                <div class="profile-panel"
                     id="profile-panel"
                     hidden>

                    <h3>👤 Hesap Bilgilerim</h3>

                    <div class="profile-detail">
                        <small>Ad Soyad</small>
                        <strong id="profile-fullname">-</strong>
                    </div>

                    <div class="profile-detail">
                        <small>E-posta Adresi</small>
                        <strong id="profile-email">-</strong>
                    </div>

                </div>
            </div>

            <!-- ÇIKIŞ YAP -->
            <button
                id="logout-btn"
                class="logout-btn"
                type="button">
                🚪 Çıkış Yap
            </button>

        </div>
    `;
});
