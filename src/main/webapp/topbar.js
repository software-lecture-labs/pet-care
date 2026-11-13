// ========================================
// PETCARE - ORTAK ÜST ÇUBUK
// ========================================

// Diğer sayfaların bekleyebileceği oturum doğrulama işlemi
let resolvePetCareAuth;

window.petCareAuthReady = new Promise((resolve) => {
  resolvePetCareAuth = resolve;
});
document.addEventListener('DOMContentLoaded', async function () {
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

  // ========================================
// OTURUM KONTROLÜ VE KULLANICI BİLGİLERİ
// ========================================

  try {
    const response = await fetch('api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (response.status === 401) {
      resolvePetCareAuth(false);
      window.location.replace('login.html');
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
          errorData.message || 'Oturum kontrolü başarısız.'
      );
    }

    const user = await response.json();

    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ');

    const profileName = document.getElementById('profile-name');
    const profileFullname = document.getElementById('profile-fullname');
    const profileEmail = document.getElementById('profile-email');
    const welcomeMessage = document.getElementById('welcome-message');

    if (welcomeMessage) {
      welcomeMessage.textContent =
          'Merhaba, ' + (user.firstName || 'Dostum') + '! 💜';
    }

    if (profileName) {
      profileName.textContent = fullName || 'Kullanıcı';
    }

    if (profileFullname) {
      profileFullname.textContent = fullName || '-';
    }

    if (profileEmail) {
      profileEmail.textContent = user.email || '-';
    }
    resolvePetCareAuth(true);
  } catch (error) {
    resolvePetCareAuth(false);
    console.error('Oturum kontrol hatası:', error);
    alert(error.message || 'Oturum kontrolü yapılamadı.');
    return;
  }

  // ========================================
  // 4. ÇIKIŞ YAPMA
  // ========================================

  const logoutButton = document.getElementById('logout-btn');

  if (logoutButton) {
    logoutButton.addEventListener('click', async function () {
      logoutButton.disabled = true;
      logoutButton.textContent = 'Çıkış yapılıyor...';

      try {
        const response = await fetch('api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Çıkış işlemi başarısız.');
        }

        // Oturum kapatıldı, giriş sayfasına dön.
        window.location.replace('login.html');
      } catch (error) {
        console.error('Çıkış hatası:', error);

        alert('Çıkış yapılamadı. Lütfen tekrar deneyin.');

        logoutButton.disabled = false;
        logoutButton.textContent = '🚪 Çıkış Yap';
      }
    });
  }

  // ========================================
  // 5. ARAMA KUTUSU
  // ========================================

  const searchInput = document.querySelector('.search-box input');
  const searchMessage = document.getElementById('search-message');

  function hideSearchMessage() {
    if (!searchMessage) return;
    searchMessage.hidden = true;
    searchMessage.textContent = '';
  }
  if (searchInput) {
    searchInput.addEventListener('input', hideSearchMessage);
    searchInput.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;

      event.preventDefault();
      hideSearchMessage();

      const searchText = searchInput.value.trim().toLocaleLowerCase('tr-TR');

      if (!searchText) return;

      if (searchText.includes('hayvan') || searchText.includes('petlerim')) {
        window.location.href = 'pets.html';
      } else if (searchText.includes('randevu')) {
        window.location.href = 'appointments.html';
      } else if (searchText.includes('sağlık') || searchText.includes('sağlik')) {
        window.location.href = 'health-records.html';
      } else if (searchText.includes('aşı')) {
        window.location.href = 'vaccinations.html';
      } else if (searchText.includes('veteriner') || searchText.includes('klinik')) {
        window.location.href = 'veterinarians.html';
      } else if (searchText.includes('bakıcı') || searchText.includes('pet sitter')) {
        window.location.href = 'pet-sitters.html';
      } else if (searchText.includes('rezervasyon')) {
        window.location.href = 'reservations.html';
      } else if (searchText.includes('hatırlat')) {
        window.location.href = 'reminders.html';
      } else if (searchText.includes('favori')) {
        window.location.href = 'favorites.html';
      } else if (searchText.includes('ayar')) {
        window.location.href = 'settings.html';
      } else {
        if (searchMessage) {
          searchMessage.textContent =
              'Bu isimde bir sayfa bulunamadı. Lütfen menüdeki sayfa adlarından birini arayın. 💜';
          searchMessage.hidden = false;
        }
      }
    });
  }

  // ========================================
// BİLDİRİM VE PROFİL PANELLERİ
// ========================================

  const panels = [
    {
      button: document.getElementById('notification-btn'),
      panel: document.getElementById('notification-panel'),
    },
    {
      button: document.getElementById('profile-btn'),
      panel: document.getElementById('profile-panel'),
    },
  ].filter(item => item.button && item.panel);

  function closeAllPanels() {
    panels.forEach(item => {
      item.panel.hidden = true;
      item.button.setAttribute('aria-expanded', 'false');
    });
  }

  panels.forEach(item => {
    item.button.addEventListener('click', function (event) {
      event.stopPropagation();

      const willOpen = item.panel.hidden;
      closeAllPanels();

      if (willOpen) {
        item.panel.hidden = false;
        item.button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', function (event) {
    const clickedInside = panels.some(item =>
        item.panel.contains(event.target) ||
        item.button.contains(event.target)
    );

    if (!clickedInside) {
      closeAllPanels();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      const openPanel = panels.find(item => !item.panel.hidden);

      if (openPanel) {
        closeAllPanels();
        openPanel.button.focus();
      }
    }
  });
});
