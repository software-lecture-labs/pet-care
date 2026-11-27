/* PetCare — Veteriner Ara | mevcut /api/clinics servisini kullanır. */
(async () => {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const els = {
        search: $('clinic-search'), district: $('district-filter'), reset: $('reset-filters'),
        list: $('clinic-list'), status: $('clinic-status'), summary: $('results-summary'),
        count: $('list-count'), more: $('load-more'),
        dialog: $('clinic-dialog'), close: $('dialog-close'),
        googleMap: $('clinic-google-map'), mapExternal: $('clinic-map-external')
    };
    const API = 'api/clinics';
    const PER_PAGE = 8;
    let clinics = [];
    let shown = PER_PAGE;
    let activeRequest = null;
    let requestVersion = 0;
    let searchTimer = null;

    function showStatus(message, visible = true) {
        els.status.textContent = message;
        els.status.hidden = !visible;
    }
    function textElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text;
        return element;
    }
    function directionsUrl(c) {
        return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.address + ', Türkiye');
    }
    function searchMapUrl(c) {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.name + ', ' + c.address + ', Türkiye');
    }
    function openDetails(c) {
        $('dialog-title').textContent = c.name;
        $('dialog-district').textContent = '📍 ' + c.district + ', İstanbul';
        $('dialog-address').textContent = c.address;
        $('dialog-phone').textContent = c.phone || 'Telefon bilgisi henüz doğrulanmadı.';
        $('dialog-category').textContent = '🏥 Veteriner kliniği';
        $('dialog-directions').href = directionsUrl(c);
        $('dialog-map').onclick = () => {
            els.dialog.close();
            showClinicOnMap(c);
            document.querySelector('.vet-map-column').scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        if (typeof els.dialog.showModal === 'function') els.dialog.showModal();
    }
    function createCard(c) {
        const card = textElement('article', 'vet-clinic-card', '');
        const icon = textElement('div', 'vet-card-icon', '🏥');
        icon.setAttribute('aria-hidden', 'true');
        const main = textElement('div', 'vet-card-main', '');
        const top = textElement('div', 'vet-card-top', '');
        top.append(textElement('h3', '', c.name), textElement('span', 'vet-card-tag vet-card-tag--real', 'Klinik'));
        const district = textElement('p', 'vet-card-district', '📍 ' + c.district);
        const address = textElement('p', 'vet-card-address', c.address);
        const bottom = textElement('div', 'vet-card-bottom', '');
        const phone = textElement('span', 'vet-card-phone', c.phone ? '☎ ' + c.phone : 'Telefon belirtilmemiş');
        const button = textElement('button', 'vet-card-action', 'Detayları gör →');
        button.type = 'button';
        button.setAttribute('aria-label', c.name + ' detaylarını göster');
        button.addEventListener('click', () => openDetails(c));
        bottom.append(phone, button);
        main.append(top, district, address, bottom);
        card.append(icon, main);
        return card;
    }
    function render() {
        els.list.replaceChildren();
        const visible = clinics.slice(0, shown);
        visible.forEach(c => els.list.append(createCard(c)));
        els.summary.textContent = clinics.length + ' klinik bulundu' + (clinics.length ? ' · İstanbul Anadolu Yakası' : '');
        els.count.textContent = clinics.length + ' sonuç';
        els.more.hidden = clinics.length <= shown;
        if (clinics.length === 0) showStatus('Bu kriterlere uygun klinik bulunamadı. Aramayı veya ilçe seçimini değiştirebilirsin.');
        else showStatus('', false);
    }
    async function loadClinics() {
        const name = els.search.value.trim();
        const district = els.district.value;
        if (activeRequest) activeRequest.abort();
        const controller = new AbortController();
        activeRequest = controller;
        const version = ++requestVersion;
        const params = new URLSearchParams();
        if (name) params.set('name', name);
        if (district) params.set('district', district);
        const url = API + (params.toString() ? '?' + params : '');
        showStatus('Klinikler aranıyor...');
        try {
            const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal });
            if (controller.signal.aborted || version !== requestVersion) return;
            if (response.status === 401) {
                window.location.replace('login.html');
                return;
            }
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Beklenmeyen API yanıtı');
            if (version !== requestVersion) return;
            clinics = data.filter(c => !c.isDemo);
            shown = PER_PAGE;
            render();
        } catch (error) {
            if (controller.signal.aborted || version !== requestVersion) return;
            clinics = [];
            els.list.replaceChildren();
            els.more.hidden = true;
            els.count.textContent = '—';
            els.summary.textContent = 'Klinik bilgileri alınamadı';
            showStatus('Klinikler yüklenemedi (' + error.message + '). Payara’nın çalıştığını ve /PetCare/api/clinics adresini kontrol et.');
        }
    }
    // Bölge haritası ve seçilen klinik için aynı Google Maps bileşenini kullan.
    function showMap(query, externalUrl, title) {
        const params = new URLSearchParams({ q: query, output: 'embed' });
        els.googleMap.src = 'https://maps.google.com/maps?' + params.toString();
        els.googleMap.title = title;
        els.googleMap.hidden = false;
        els.mapExternal.href = externalUrl;
        els.mapExternal.hidden = false;
    }
    function showRegionMap() {
        const query = 'İstanbul Anadolu Yakası, Türkiye';
        showMap(query, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query),
            'İstanbul Anadolu Yakası Google Maps haritası');
    }
    function showClinicOnMap(c) {
        const query = [c.name, c.address, 'Türkiye'].filter(Boolean).join(', ');
        showMap(query, searchMapUrl(c), c.name + ' Google Maps haritası');
    }
    // Ortak oturum kontrolü tamamlanmadan klinik işlemlerini başlatma.
    try {
        const user = await window.petCareAuthReady;
        if (!user) return;
    } catch (error) {
        // Ortak script.js oturum hatasını kullanıcıya ayrıca bildirir.
        els.summary.textContent = 'Klinik bilgileri alınamadı';
        showStatus('Oturum doğrulanamadı. Lütfen tekrar deneyin.');
        return;
    }

    els.search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadClinics, 300);
    });
    els.district.addEventListener('change', () => { clearTimeout(searchTimer); loadClinics(); });
    els.reset.addEventListener('click', () => {
        els.search.value = '';
        els.district.value = '';
        clearTimeout(searchTimer);
        loadClinics();
    });
    els.more.addEventListener('click', () => { shown += PER_PAGE; render(); });
    els.close.addEventListener('click', () => els.dialog.close());
    els.dialog.addEventListener('click', (e) => {
        if (e.target === els.dialog) els.dialog.close();
    });
    showRegionMap();
    loadClinics();
})();
