document.addEventListener('DOMContentLoaded', function () {
  const deleteButton = document.getElementById('delete-account-btn');
  const dialog = document.getElementById('delete-account-dialog');
  const form = document.getElementById('delete-account-form');
  const cancelButton = document.getElementById('delete-account-cancel');
  const confirmButton = document.getElementById('delete-account-confirm');
  const passwordInput = document.getElementById('delete-account-password');

  if (!deleteButton || !dialog || !form) return;

  // Hesap silme penceresini aç.
  deleteButton.addEventListener('click', function () {
    form.reset();
    dialog.showModal();
  });

  // Vazgeç butonu.
  cancelButton.addEventListener('click', function () {
    dialog.close();
  });

  // Hesap silme isteği.
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const password = passwordInput.value;

    if (!password.trim()) {
      alert('Lütfen mevcut şifrenizi girin.');
      return;
    }

    confirmButton.disabled = true;

    try {
      // Oturumun CSRF token'ını al.
      const authResponse = await fetch('api/auth/me', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (authResponse.status === 401) {
        window.location.replace('login.html');
        return;
      }

      if (!authResponse.ok) {
        throw new Error('Oturum doğrulanamadı.');
      }

      const authData = await authResponse.json();

      if (!authData.csrfToken) {
        throw new Error('Güvenlik doğrulaması yapılamadı.');
      }

      // Şifre ve CSRF token ile hesap silme isteği gönder.
      const response = await fetch('api/auth/delete-account', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': authData.csrfToken,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'Hesap silinemedi.');
      }

      // Hesap silindikten sonra giriş sayfasına yönlendir.
      window.location.replace('login.html');
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      alert(error.message || 'Bir hata oluştu.');
    } finally {
      confirmButton.disabled = false;
    }
  });
});
