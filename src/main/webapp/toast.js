
/* PETCARE - ORTAK TOAST BİLDİRİMLERİ */

function showToast(message, type = 'success') {
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

    // Açık modal varsa bildirimi modalın içinde göster.
    const activeDialog = document.querySelector('dialog[open]');
    const parent = toastType === 'success'
        ? document.body
        : activeDialog || document.body;

    let container = Array.from(
        parent.children
    ).find((element) =>
        element.id === 'pet-toast-container'
    );

    if (!container) {
        container = document.createElement('div');
        container.id = 'pet-toast-container';
        container.className = 'pet-toast-container';
        container.setAttribute('aria-live', 'polite');
        parent.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pet-toast pet-toast--${toastType}`;
    toast.setAttribute(
        'role',
        toastType === 'error' ? 'alert' : 'status'
    );

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
    closeButton.setAttribute(
        'aria-label',
        'Bildirimi kapat'
    );

    toast.append(icon, content, closeButton);
    container.appendChild(toast);

    const removeToast = () => {
        toast.remove();
        if (!container.hasChildNodes()) {
            container.remove();
        }
    };

    closeButton.addEventListener('click', removeToast);
    setTimeout(removeToast, 4000);
}
