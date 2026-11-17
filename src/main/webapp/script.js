// ========================================
// PETCARE - ANA SAYFA VE OTURUM İŞLEMLERİ
// ========================================

document.addEventListener('DOMContentLoaded', async function () {
  // ========================================
  // 1. OTURUM KONTROLÜ
  // ========================================

  try {
    const response = await fetch('api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });

    // Kullanıcı giriş yapmamışsa
    if (response.status === 401) {
      window.location.replace('login.html');
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(errorData.message || 'Oturum kontrolü başarısız.');
    }

    const user = await response.json();

    // ========================================
    // 2. KULLANICI BİLGİLERİNİ GÖSTER
    // ========================================

    const profileName = document.getElementById('profile-name');
    const welcomeMessage = document.getElementById('welcome-message');

    const profileFullname = document.getElementById('profile-fullname');
    const profileEmail = document.getElementById('profile-email');

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    if (profileName) {
      profileName.textContent = fullName;
    }

    if (welcomeMessage) {
      welcomeMessage.textContent = 'Merhaba, ' + user.firstName + '! 💜';
    }

    if (profileFullname) {
      profileFullname.textContent = fullName || '-';
    }

    if (profileEmail) {
      profileEmail.textContent = user.email || '-';
    }
  } catch (error) {
    console.error('Oturum kontrol hatası:', error);

    // Sunucu hatasında kullanıcıyı giriş yapmamış
    // gibi göstermiyoruz.
    alert(error.message || 'Oturum kontrolü yapılamadı. Lütfen tekrar deneyin.');
    return;
  }

  // ========================================
  // 3. BUGÜNÜN TARİHİNİ GÖSTER
  // ========================================

  const dateElement = document.getElementById('today-date');

  if (dateElement) {
    const today = new Date();

    dateElement.textContent = today.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
  // 6. BİLDİRİM VE PROFİL PANELLERİ
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
  ].filter((item) => item.button && item.panel);

  // Bütün panelleri kapat
  function closeAllPanels() {
    panels.forEach(function (item) {
      item.panel.hidden = true;
      item.button.setAttribute('aria-expanded', 'false');
    });
  }

  // Panel açma ve kapatma işlemleri
  panels.forEach(function (item) {
    item.button.addEventListener('click', function (event) {
      event.stopPropagation();

      const willOpen = item.panel.hidden;

      // Önce açık panelleri kapat
      closeAllPanels();

      // Tıklanan panel daha önce kapalıysa aç
      if (willOpen) {
        item.panel.hidden = false;
        item.button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Panellerin dışına tıklanınca kapat
  document.addEventListener('click', function (event) {
    const clickedInside = panels.some(function (item) {
      return item.panel.contains(event.target) || item.button.contains(event.target);
    });

    if (!clickedInside) {
      closeAllPanels();
    }
  });
  // Escape tuşuna basınca paneli kapat ve odağı butona geri ver
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      const openPanel = panels.find(({ panel }) => !panel.hidden);

      if (openPanel) {
        closeAllPanels();
        openPanel.button.focus();
      }
    }
  });
  // ========================================
  // 7. ANASAYFA - HAYVANLARIM
  // ========================================
  function calculatePetAge(birthdate) {
    if (!birthdate) return null;

    const today = new Date();
    const birth = new Date(birthdate + 'T00:00:00');

    if (Number.isNaN(birth.getTime()) || birth > today) {
      return null;
    }

    let age = today.getFullYear() - birth.getFullYear();

    const monthDifference = today.getMonth() - birth.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return `${age} yaşında`;
  }

  async function loadHomePets() {
    const grid = document.getElementById('home-pet-grid');
    if (!grid) return;

    try {
      const response = await fetch('api/pets', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('login.html');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.message || 'Hayvanlar yüklenemedi.');
      }

      const pets = await response.json();
      grid.replaceChildren();

      if (pets.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'pets-loading';
        emptyMessage.textContent = 'Henüz hayvan eklemedin. 🐾';

        grid.appendChild(emptyMessage);
        return;
      }

      const avatars = {
        Kedi: '🐱',
        Köpek: '🐶',
        Kuş: '🐦',
        Diğer: '🐾',
      };

      pets.slice(0, 3).forEach((pet) => {
        const card = document.createElement('article');
        card.className = 'pet-card';

        const image = document.createElement('div');
        image.className = 'pet-image';

        if (pet.photoPath) {
          const photo = document.createElement('img');
          photo.src = `api/pet-photos/${pet.id}`;
          photo.alt = `${pet.name} profil fotoğrafı`;
          photo.className = 'home-pet-photo';
          photo.onerror = function () {
            image.textContent = avatars[pet.type] || '🐾';
          };
          image.appendChild(photo);
        } else {
          image.textContent = avatars[pet.type] || '🐾';
        }

        const info = document.createElement('div');
        info.className = 'pet-info';

        const details = document.createElement('div');

        const name = document.createElement('h3');
        name.textContent = pet.name;

        const description = document.createElement('p');

        const petDetails = [pet.type, pet.breed, calculatePetAge(pet.birthDate)].filter(Boolean);

        description.textContent =
          petDetails.length > 0 ? petDetails.join(' • ') : 'Bilgi belirtilmedi';

        details.append(name, description);

        const link = document.createElement('a');
        link.href = 'pets.html';
        link.className = 'round-arrow';
        link.textContent = '❯';
        link.setAttribute('aria-label', `${pet.name} için Hayvanlarım sayfasını aç`);

        info.append(details, link);
        card.append(image, info);
        grid.appendChild(card);
      });
    } catch (error) {
      console.error('Anasayfa hayvan yükleme hatası:', error);
      grid.textContent = error.message || 'Hayvanların şu anda yüklenemiyor. Lütfen tekrar dene.';
    }
  }

  await loadHomePets();
});
