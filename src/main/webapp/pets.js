// ========================================
// PETCARE - HAYVANLARIM SAYFASI
// ========================================

document.addEventListener('DOMContentLoaded', function () {
  const pets = {};

  const dialog = document.getElementById('pet-profile-dialog');
  const closeButton = document.getElementById('pet-profile-close');
  const profileButtons = document.querySelectorAll('.pets-profile-btn');
  const editDialog = document.getElementById('pet-edit-dialog');
  const editCloseButton = document.getElementById('pet-edit-close');
  const editCancelButton = document.getElementById('pet-edit-cancel');
  const editButtons = document.querySelectorAll('.pets-edit-btn');
  const deleteButtons = document.querySelectorAll('.pets-delete-btn');
  const editForm = document.getElementById('pet-edit-form');
  let editingPet = null;
  let editingCard = null;
  // Yeni hayvan ekleme elemanları
  const addButton = document.getElementById('pet-add-btn');
  const addDialog = document.getElementById('pet-add-dialog');
  const addCloseButton = document.getElementById('pet-add-close');
  const addCancelButton = document.getElementById('pet-add-cancel');
  const addForm = document.getElementById('pet-add-form');

  if (!dialog || !closeButton) return;
  function showToast(message, type = 'success') {
    let container = null;

    if (!container) {
      container = document.createElement('div');
      container.id = 'pet-toast-container';
      container.className = 'pet-toast-container';
      container.setAttribute('aria-live', 'polite');
      const activeDialog = document.querySelector('dialog[open]');

      const toastParent = type === 'success' ? document.body : activeDialog || document.body;

      toastParent.appendChild(container);
    }

    const titles = {
      success: 'İşlem tamamlandı!',
      error: 'Bir sorun oluştu',
      warning: 'Küçük bir hatırlatma',
    };

    const icons = {
      success: '✓',
      error: '!',
      warning: 'i',
    };

    const toastType = titles[type] ? type : 'success';

    const toast = document.createElement('div');
    toast.className = `pet-toast pet-toast--${toastType}`;
    toast.setAttribute('role', toastType === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'pet-toast-icon';
    icon.textContent = icons[toastType];
    icon.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'pet-toast-content';

    const title = document.createElement('strong');
    title.className = 'pet-toast-title';
    title.textContent = titles[toastType];

    const description = document.createElement('span');
    description.className = 'pet-toast-message';
    description.textContent = message;

    content.append(title, description);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'pet-toast-close';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Bildirimi kapat');

    toast.append(icon, content, closeButton);
    container.appendChild(toast);

    const removeToast = () => toast.remove();

    closeButton.addEventListener('click', removeToast);
    setTimeout(removeToast, 4000);
  }
  function setupFormValidation(form) {
    if (!form) return;

    form.addEventListener(
      'invalid',
      function (event) {
        const field = event.target;

        event.preventDefault();

        // Aynı formda birden fazla hatalı alan varsa
        // yalnızca ilk alanın mesajını göster.
        if (form.querySelector(':invalid') !== field) return;

        let message = 'Lütfen bu alanı kontrol edin.';

        if (field.validity.valueMissing) {
          if (field.id.endsWith('-name')) {
            message = 'Hayvanının adını girmeyi unutma.';
          } else if (field.id.endsWith('-type')) {
            message = 'Hayvanının türünü seçmelisin.';
          } else {
            message = 'Bu alanı doldurmalısın.';
          }
        } else if (field.validity.rangeUnderflow) {
          message = 'Kilo değeri sıfırdan küçük olamaz.';
        } else if (field.validity.stepMismatch) {
          message = 'Lütfen geçerli bir kilo değeri gir.';
        } else if (field.validity.tooLong) {
          message = 'Girdiğin metin izin verilen uzunluğu aşıyor.';
        }

        showToast(message, 'warning');
        field.focus();
      },
      true,
    );
  }

  setupFormValidation(editForm);
  setupFormValidation(addForm);

  // Profil penceresini aç
  function openPetProfile(pet) {
    document.getElementById('pet-profile-title').textContent = pet.name + ' 🐾';

    const avatarContainer = document.getElementById('pet-profile-avatar');

    avatarContainer.replaceChildren();

    if (pet.photo) {
      const img = document.createElement('img');

      img.src = pet.photo;
      img.alt = pet.name + ' profil fotoğrafı';
      img.className = 'pet-uploaded-photo';

      avatarContainer.appendChild(img);
    } else {
      avatarContainer.textContent = pet.avatar;
    }

    document.getElementById('pet-profile-name').textContent = pet.name;

    document.getElementById('pet-profile-type').textContent = pet.type;

    document.getElementById('pet-profile-age').textContent = pet.age;
    document.getElementById('pet-profile-breed').textContent = pet.breed ?? 'Belirtilmedi';

    document.getElementById('pet-profile-gender').textContent = pet.gender ?? 'Belirtilmedi';

    document.getElementById('pet-profile-birthdate').textContent = pet.birthdate ?? 'Belirtilmedi';

    document.getElementById('pet-profile-weight').textContent = pet.weight ?? 'Belirtilmedi';

    document.getElementById('pet-profile-notes').textContent = pet.notes ?? 'Belirtilmedi';

    dialog.showModal();
  }

  // Hayvan kartlarındaki butonlar
  profileButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const card = button.closest('.pets-profile-card');
      if (!card) return;

      const petId = Number(card.dataset.petId);
      const pet = pets[petId];

      if (pet) {
        openPetProfile(pet);
      }
    });
  });

  // Kapatma butonu
  closeButton.addEventListener('click', function () {
    dialog.close();
  });

  // Pencerenin dışına tıklayınca kapat
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) {
      dialog.close();
    }
  });
  // ========================================
  // HAYVAN BİLGİLERİNİ DÜZENLEME
  // ========================================

  // Düzenleme penceresini aç
  editButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const card = button.closest('.pets-profile-card');
      if (!card) return;

      const petId = Number(card.dataset.petId);
      const pet = pets[petId];
      if (!pet) return;
      editingPet = pet;
      editingCard = card;

      // Mevcut bilgileri forma doldur
      document.getElementById('pet-edit-name').value = pet.name;
      document.getElementById('pet-edit-type').value = pet.type;
      document.getElementById('pet-edit-breed').value = pet.breed ?? '';
      document.getElementById('pet-edit-gender').value = pet.gender ?? '';
      document.getElementById('pet-edit-birthdate').value = pet.birthdate ?? '';
      document.getElementById('pet-edit-weight').value = pet.weight ?? '';
      document.getElementById('pet-edit-notes').value = pet.notes ?? '';

      editDialog.showModal();
    });
  });

  // Düzenleme penceresini kapat
  editCloseButton.addEventListener('click', function () {
    editDialog.close();
  });

  // Vazgeç butonu
  editCancelButton.addEventListener('click', function () {
    editDialog.close();
  });

  // Pencerenin dışına tıklayınca kapat
  editDialog.addEventListener('click', function (event) {
    if (event.target === editDialog) {
      editDialog.close();
    }
  });

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

  // ========================================
  // HAYVAN BİLGİLERİNİ KAYDET
  // ========================================

  editForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!editingPet || !editingCard) return;

    // Hayvanı ismine göre değil, veritabanındaki ID'sine göre bul.
    const petId = editingPet.id;

    if (!Number.isInteger(petId) || petId <= 0) {
      showToast('Hayvanın kayıt numarası bulunamadı.', 'error');
      return;
    }

    const name = document.getElementById('pet-edit-name').value.trim();
    const type = document.getElementById('pet-edit-type').value;
    const breed = document.getElementById('pet-edit-breed').value.trim();
    const gender = document.getElementById('pet-edit-gender').value;
    const birthDate = document.getElementById('pet-edit-birthdate').value;
    const weightValue = document.getElementById('pet-edit-weight').value;
    const notes = document.getElementById('pet-edit-notes').value.trim();

    if (!name || !type) {
      showToast('Hayvanın adı ve türü boş olamaz.', 'error');
      return;
    }

    if (birthDate && !calculatePetAge(birthDate)) {
      showToast('Lütfen geçerli bir doğum tarihi girin.', 'error');
      return;
    }

    const weight = weightValue === '' ? null : Number(weightValue);

    if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
      showToast('Kilo sıfırdan büyük olmalıdır.', 'error');
      return;
    }

    const petData = {
      name: name,
      type: type,
      breed: breed || null,
      gender: gender || null,
      birthDate: birthDate || null,
      weight: weight,
      notes: notes || null,
    };

    const submitButton = editForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch(`api/pets/${petId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(petData),
      });

      if (response.status === 401) {
        showToast('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.', 'error');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Güncelleme hatası:', errorText);
        showToast('Hayvan bilgileri güncellenemedi.', 'error');
        return;
      }

      // Güncel bilgileri yeniden veritabanından getir.
      await loadPetsFromApi();

      editDialog.close();
      editingPet = null;
      editingCard = null;

      showToast('Hayvan bilgileri başarıyla güncellendi!', 'success');
    } catch (error) {
      console.error('Güncelleme sırasında hata:', error);
      showToast('Sunucuya bağlanırken bir hata oluştu.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  // ========================================
  // HAYVAN SİLME İŞLEMİ
  // ========================================

  const deleteDialog = document.getElementById('pet-delete-dialog');
  const deleteName = document.getElementById('pet-delete-name');
  const deleteCancel = document.getElementById('pet-delete-cancel');
  const deleteConfirm = document.getElementById('pet-delete-confirm');

  let petToDelete = null;
  let cardToDelete = null;

  // Silme onay penceresini aç
  deleteButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const card = button.closest('.pets-profile-card');
      if (!card) return;

      const petId = Number(card.dataset.petId);
      const pet = pets[petId];
      if (!pet) return;

      petToDelete = pet;
      cardToDelete = card;

      deleteName.textContent = pet.name;

      deleteDialog.showModal();
    });
  });

  // Vazgeç butonu
  deleteCancel.addEventListener('click', function () {
    deleteDialog.close();
  });

  // Silme işlemini onayla

  deleteConfirm.addEventListener('click', async function () {
    if (!petToDelete || !cardToDelete) return;

    // Silinecek hayvanın veritabanındaki ID'si
    const petId = petToDelete.id;

    if (!Number.isInteger(petId) || petId <= 0) {
      showToast('Hayvanın kayıt numarası bulunamadı.', 'error');
      return;
    }

    // İşlem devam ederken tekrar tıklanmasını önle
    deleteConfirm.disabled = true;

    try {
      const response = await fetch(`api/pets/${petId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (response.status === 401) {
        showToast('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.', 'error');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hayvan silme hatası:', errorText);
        showToast('Hayvan silinemedi. Lütfen tekrar deneyin.', 'error');
        return;
      }

      // Silme başarılıysa listeyi veritabanından yenile
      await loadPetsFromApi();

      deleteDialog.close();

      petToDelete = null;
      cardToDelete = null;

      showToast('Hayvan başarıyla silindi!');
    } catch (error) {
      console.error('Silme sırasında hata:', error);
      showToast('Sunucuya bağlanırken bir hata oluştu.', 'error');
    } finally {
      deleteConfirm.disabled = false;
    }
  });

  // Pencere kapandığında seçimi temizle
  deleteDialog.addEventListener('close', function () {
    petToDelete = null;
    cardToDelete = null;
  });

  // Pencerenin dışına tıklayınca kapat
  deleteDialog.addEventListener('click', function (event) {
    if (event.target === deleteDialog) {
      deleteDialog.close();
    }
  });
  // ========================================
  // YENİ HAYVAN EKLEME
  // ========================================

  // Yeni Hayvan Ekle butonu
  addButton.addEventListener('click', function () {
    addForm.reset();
    addDialog.showModal();
  });

  // X butonu
  addCloseButton.addEventListener('click', function () {
    addDialog.close();
  });

  // Vazgeç butonu
  addCancelButton.addEventListener('click', function () {
    addDialog.close();
  });

  // Pencerenin dışına tıklayınca kapat
  addDialog.addEventListener('click', function (event) {
    if (event.target === addDialog) {
      addDialog.close();
    }
  });
  // ========================================
  // YENİ HAYVAN KARTLARI İÇİN BUTON BAĞLANTILARI
  // ========================================

  function setupNewPetCard(card) {
    // Profili Gör
    card.querySelector('.pets-profile-btn').addEventListener('click', function () {
      const petId = Number(card.dataset.petId);
      const pet = pets[petId];

      if (pet) {
        openPetProfile(pet);
      }
    });

    // Bilgileri Düzenle
    card.querySelector('.pets-edit-btn').addEventListener('click', function () {
      const petId = Number(card.dataset.petId);
      const pet = pets[petId];
      if (!pet) return;

      editingPet = pet;
      editingCard = card;

      document.getElementById('pet-edit-name').value = pet.name;
      document.getElementById('pet-edit-type').value = pet.type;
      document.getElementById('pet-edit-breed').value = pet.breed ?? '';
      document.getElementById('pet-edit-gender').value = pet.gender ?? '';
      document.getElementById('pet-edit-birthdate').value = pet.birthdate ?? '';
      document.getElementById('pet-edit-weight').value = pet.weight ?? '';
      document.getElementById('pet-edit-notes').value = pet.notes ?? '';

      editDialog.showModal();
    });

    // Profil Fotoğrafı
    const photoButton = card.querySelector('.pets-photo-btn');
    const photoInput = card.querySelector('.pets-photo-input');

    photoButton.addEventListener('click', function () {
      photoInput.click();
    });

    photoInput.addEventListener('change', async function () {
      const file = photoInput.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png'];

      if (!allowedTypes.includes(file.type)) {
        showToast('Lütfen JPG veya PNG fotoğraf seçin.', 'error');
        photoInput.value = '';
        return;
      }

      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        showToast("Fotoğraf 5 MB'tan büyük veya boş olamaz.", 'error');
        photoInput.value = '';
        return;
      }

      const petId = Number(card.dataset.petId);
      const pet = pets[petId];

      if (!pet) return;
      // Fotoğraf yükleme için CSRF token'ını al
      const authResponse = await fetch('api/auth/me', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!authResponse.ok) {
        showToast('Oturum doğrulanamadı. Lütfen tekrar giriş yapın.', 'error');
        return;
      }

      const authData = await authResponse.json();
      const csrfToken = authData.csrfToken;

      if (!csrfToken) {
        showToast('Güvenlik doğrulaması yapılamadı.', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);

      photoButton.disabled = true;

      try {
        const response = await fetch(`api/pet-photos/${petId}`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-Token': csrfToken
          },
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          showToast(result.message || 'Fotoğraf yüklenemedi.', 'error');
          return;
        }

        // Güncel fotoğrafı veritabanından yeniden getir
        await loadPetsFromApi();

        showToast('Profil fotoğrafı başarıyla yüklendi!');
      } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        showToast('Fotoğraf yüklenirken bir hata oluştu.', 'error');
      } finally {
        photoButton.disabled = false;
        photoInput.value = '';
      }
    });

    // Hayvanı Sil
    card.querySelector('.pets-delete-btn').addEventListener('click', function () {
      const petId = Number(card.dataset.petId);
      const pet = pets[petId];
      if (!pet) return;

      petToDelete = pet;
      cardToDelete = card;

      deleteName.textContent = pet.name;
      deleteDialog.showModal();
    });
  }
  // ========================================
  // YENİ HAYVANI KAYDET VE KART OLUŞTUR
  // ========================================

  addForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitButton = addForm.querySelector('button[type="submit"]');

    const name = document.getElementById('pet-add-name').value.trim();
    const type = document.getElementById('pet-add-type').value;
    const breed = document.getElementById('pet-add-breed').value.trim();
    const gender = document.getElementById('pet-add-gender').value;
    const birthDate = document.getElementById('pet-add-birthdate').value;
    const weightValue = document.getElementById('pet-add-weight').value;
    const notes = document.getElementById('pet-add-notes').value.trim();

    if (!name || !type) {
      showToast('Hayvanın adını ve türünü girin.', 'error');
      return;
    }

    if (birthDate && !calculatePetAge(birthDate)) {
      showToast('Lütfen geçerli bir doğum tarihi girin.', 'error');
      return;
    }

    const weight = weightValue === '' ? null : Number(weightValue);

    if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
      showToast('Kilo sıfırdan büyük olmalıdır.', 'error');
      return;
    }

    const petData = {
      name: name,
      type: type,
      breed: breed || null,
      gender: gender || null,
      birthDate: birthDate || null,
      weight: weight,
      notes: notes || null,
    };

    submitButton.disabled = true;

    try {
      const response = await fetch('api/pets', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(petData),
      });

      if (response.status === 401) {
        showToast('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.', 'error');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hayvan ekleme hatası:', errorText);
        showToast('Hayvan kaydedilemedi. Lütfen bilgileri kontrol edin.', 'error');
        return;
      }

      // Veritabanına kaydedildikten sonra listeyi yenile.
      await loadPetsFromApi();

      addDialog.close();
      addForm.reset();

      showToast('Hayvanınız başarıyla kaydedildi!');
    } catch (error) {
      console.error('Hayvan eklenirken hata:', error);
      showToast('Sunucuya bağlanırken bir hata oluştu.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  // ========================================
  // HAYVANLARI VERİTABANINDAN GETİR
  // ========================================

  async function loadPetsFromApi() {
    const grid = document.querySelector('.pets-grid');

    if (!grid) return;

    grid.textContent = 'Hayvanlar yükleniyor...';

    try {
      const response = await fetch('api/pets', {
        credentials: 'same-origin',
      });

      if (response.status === 401) {
        grid.textContent = 'Hayvanlarınızı görmek için lütfen giriş yapın.';
        return;
      }

      if (!response.ok) {
        throw new Error('Hayvanlar yüklenemedi.');
      }

      const apiPets = await response.json();
      Object.keys(pets).forEach((id) => delete pets[id]);

      grid.replaceChildren();

      if (apiPets.length === 0) {
        grid.textContent = 'Henüz kayıtlı hayvanınız yok. Yeni bir hayvan ekleyebilirsiniz.';
        return;
      }

      const avatars = {
        Kedi: '🐱',
        Köpek: '🐶',
        Kuş: '🐦',
        Diğer: '🐾',
      };

      const imageColors = {
        Kedi: 'pets-cat-image',
        Köpek: 'pets-dog-image',
        Kuş: 'pets-bird-image',
        Diğer: 'pets-other-image',
      };

      apiPets.forEach((apiPet) => {
        const pet = {
          id: apiPet.id,
          name: apiPet.name,
          type: apiPet.type,
          breed: apiPet.breed,
          gender: apiPet.gender,
          birthdate: apiPet.birthDate,
          weight: apiPet.weight,
          notes: apiPet.notes,
          age: calculatePetAge(apiPet.birthDate) || 'Belirtilmedi',
          avatar: avatars[apiPet.type] || '🐾',
          photo: apiPet.photoPath ? `api/pet-photos/${apiPet.id}` : null,
        };

        pets[pet.id] = pet;

        const card = document.createElement('article');
        card.className = 'pets-profile-card';
        card.dataset.petId = String(pet.id);

        const imageColor = imageColors[pet.type] || 'pets-other-image';

        card.innerHTML = `
                    <div class="pets-card-image ${imageColor}">
                        <span></span>
                    </div>

                    <div class="pets-card-body">
                        <div class="pets-card-title">
                            <h3></h3>
                            <span class="pets-type-badge"></span>
                        </div>

                        <p class="pets-breed"></p>

                        <div class="pets-details">
                            <span></span>
                        </div>

                        <div class="pets-card-actions">
                            <button type="button" class="pets-profile-btn">
                                Profili Gör
                            </button>

                            <button type="button" class="pets-edit-btn">
                                ✏️ Bilgileri Düzenle
                            </button>

                            <button type="button" class="pets-photo-btn">
                                📷 Profil Fotoğrafı Ekle
                            </button>

                            <input type="file"
                                   class="pets-photo-input"
                                   accept="image/png,image/jpeg"
                                   hidden>

                            <button type="button" class="pets-delete-btn">
                                🗑️ Hayvanı Sil
                            </button>
                        </div>

                        <div class="pets-card-links">
                            <a href="health-records.html">🩺 Sağlık Kayıtları</a>
                            <a href="vaccinations.html">💉 Aşı Takibi</a>
                            <a href="appointments.html">📅 Randevu Oluştur</a>
                        </div>
                    </div>
                `;

        card.querySelector('.pets-card-title h3').textContent = pet.name;

        card.querySelector('.pets-type-badge').textContent = pet.type;

        card.querySelector('.pets-breed').textContent = pet.breed || pet.type;

        card.querySelector('.pets-details span').textContent = '🎂 ' + pet.age;

        const imageContainer = card.querySelector('.pets-card-image');
        const avatarSpan = imageContainer.querySelector('span');

        avatarSpan.textContent = pet.avatar;

        if (pet.photo) {
          const img = document.createElement('img');

          img.src = pet.photo;
          img.alt = pet.name + ' profil fotoğrafı';

          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.display = 'block';

          img.onload = () => {
            avatarSpan.style.display = 'none';
          };

          img.onerror = () => {
            img.remove();
            avatarSpan.style.display = '';
          };

          imageContainer.appendChild(img);
        }

        setupNewPetCard(card);
        grid.appendChild(card);
      });
    } catch (error) {
      console.error('Hayvanlar yüklenirken hata:', error);
      grid.textContent = 'Hayvanlar yüklenirken bir hata oluştu.';
    }
  }

  loadPetsFromApi();
});
