// ========================================
// PETCARE - ANA SAYFA VE OTURUM İŞLEMLERİ
// ========================================

document.addEventListener('DOMContentLoaded', async function () {

  // ========================================
// OTURUM DOĞRULAMASINI BEKLE
// ========================================

  if (!window.petCareAuthReady) {
    console.error('Ortak oturum kontrolü bulunamadı.');
    return;
  }

  const isAuthenticated = await window.petCareAuthReady;

  if (!isAuthenticated) {
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

    if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birth.getDate())
    ) {
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

        throw new Error(
            errorData.message || 'Hayvanlar yüklenemedi.'
        );
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

        const petDetails = [
          pet.type,
          pet.breed,
          calculatePetAge(pet.birthDate)
        ].filter(Boolean);

        description.textContent =
            petDetails.length > 0
                ? petDetails.join(' • ')
                : 'Bilgi belirtilmedi';

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
      grid.textContent =
          error.message || 'Hayvanların şu anda yüklenemiyor. Lütfen tekrar dene.';
    }
  }
  // ========================================
// 8. ANASAYFA - YAKLAŞAN RANDEVU
// ========================================

  async function loadHomeAppointment() {
    const container = document.getElementById('home-next-appointment');

    if (!container) return;

    try {
      const response = await fetch('api/appointments', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (response.status === 401) {
        window.location.replace('login.html');
        return;
      }

      if (!response.ok) {
        throw new Error('Randevular yüklenemedi.');
      }

      const appointments = await response.json();

      const now = new Date();

      const upcomingAppointments = appointments
          .filter((appointment) => {
            const date = new Date(appointment.startTime);
            const status = String(appointment.status || '').toUpperCase();

            return (
                !Number.isNaN(date.getTime()) &&
                date >= now &&
                status !== 'CANCELLED' &&
                status !== 'CANCELED' &&
                status !== 'COMPLETED'
            );
          })
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      if (upcomingAppointments.length === 0) {
        container.replaceChildren();

        const message = document.createElement('p');
        message.textContent = 'Henüz yaklaşan randevun bulunmuyor. 🐾';

        container.appendChild(message);
        return;
      }

      const appointment = upcomingAppointments[0];
      const appointmentDate = new Date(appointment.startTime);

      const formattedDate = appointmentDate.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul',
      });

      const petIcons = {
        Kedi: '🐱',
        Köpek: '🐶',
        Kuş: '🐦',
      };

      container.replaceChildren();

      const icon = document.createElement('div');
      icon.className = 'appointment-icon';
      icon.textContent = '🏥';

      const info = document.createElement('div');
      info.className = 'appointment-info';

      const clinicName = document.createElement('h3');
      clinicName.textContent =
          appointment.clinicName || appointment.vetName || 'Veteriner randevusu';

      const veterinarian = document.createElement('p');
      veterinarian.textContent =
          `👩‍⚕️ ${appointment.vetName || 'Veteriner bilgisi belirtilmedi'}`;

      const date = document.createElement('p');
      date.textContent = `📅 ${formattedDate}`;

      const pet = document.createElement('p');
      const petIcon = petIcons[appointment.petType] || '🐾';

      pet.textContent =
          `${petIcon} ${appointment.petName || 'Hayvan'} — ${appointment.reason || 'Muayene'}`;

      info.append(clinicName, veterinarian, date, pet);
      container.append(icon, info);
    } catch (error) {
      console.error('Anasayfa randevu yükleme hatası:', error);
    }
  }

  await loadHomePets();
  await loadHomeAppointment();
});
