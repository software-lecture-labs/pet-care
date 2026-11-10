// ============================================================
// PETCARE / RANDEVULARIM - GERCEK API ENTEGRASYONU
// ============================================================
// Bu dosya mevcut appointments.html / appointments.css ile calisir.
// GET  api/pets                         (pets-page branch'i)
// GET  api/veterinarians
// GET  api/veterinarians/{id}/availability
// GET  api/appointments
// POST api/appointments
// PUT  api/appointments/{id}/cancel
// ONEMLI: Randevu takvimi ve detay
//lari icin GET api/appointments
// yanitinda su ek alanlar bulunmalidir:
//   startTime, veterinarianId, vetName, clinicName, petName, petType
// Bunlari sonraki adimda Appointment backend'ine ekleyecegiz.
// Randevu tarihini degistirme API'si henuz yok; buton gizlidir.

"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = "api"; // /PetCare/appointments.html -> /PetCare/api/...
    const $ = (id) => document.getElementById(id);

    const calendarGrid = $("appt-calendar-grid");
    const dayList = $("appt-day-list");
    const allList = $("appt-all-list");
    const createDialog = $("appt-create-dialog");
    const detailsDialog = $("appt-details-dialog");
    const form = $("appt-create-form");
    const dateInput = $("appt-date");
    const petSelect = $("appt-pet");
    const vetSelect = $("appt-vet");
    const reasonSelect = $("appt-reason");
    const notesInput = $("appt-notes");
    const slotList = $("appt-slot-list");
    const formError = $("appt-form-error");
    const cancelConfirm = $("appt-cancel-confirm");
    const cancelRequest = $("appt-cancel-request");
    const rescheduleButton = $("appt-reschedule");

    const today = startOfDay(new Date());
    const todayKey = dateKey(today);
    const latestAllowedDate = dateKey(addDays(today, 60));
    let viewedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDay = todayKey;
    let selectedFilter = "all";
    let selectedSlot = null; // vet_availability.id
    let detailsAppointmentId = null;
    let toastTimeout = null;
    let slotsRequestId = 0;
    let pets = [];
    let vets = [];
    let appointments = [];
    let availableSlots = [];

    const statusMap = {
        scheduled: { label: "Planlandı", icon: "✓", css: "confirmed" },
        completed: { label: "Tamamlandı", icon: "✓", css: "completed" },
        cancelled: { label: "İptal edildi", icon: "×", css: "cancelled" }
    };

    // -------------------- API --------------------
    async function apiRequest(path, options = {}) {
        const response = await fetch(`${API_BASE}/${path}`, {
            credentials: "same-origin",
            ...options,
            headers: {
                Accept: "application/json",
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...(options.headers || {})
            }
        });

        let data = null;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            data = await response.json();
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Oturum süren dolmuş olabilir. Lütfen yeniden giriş yap.");
            }
            if (response.status === 404) {
                throw new Error("İstenen API bulunamadı. İlgili branch henüz bu sürümde olmayabilir.");
            }
            throw new Error(data?.message || `İşlem başarısız (HTTP ${response.status}).`);
        }
        return data;
    }

    // -------------------- YARDIMCILAR --------------------
    function startOfDay(value) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    function addDays(value, amount) {
        const copy = startOfDay(value);
        copy.setDate(copy.getDate() + amount);
        return copy;
    }
    function dateKey(value) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    function keyToDate(key) {
        const [y, m, d] = key.split("-").map(Number);
        return new Date(y, m - 1, d);
    }
    function formatDate(key, options) {
        return key ? new Intl.DateTimeFormat("tr-TR", options).format(keyToDate(key)) : "Belirtilmemiş";
    }
    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, (char) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }
    function petIcon(type) {
        const name = String(type || "").toLocaleLowerCase("tr-TR");
        if (name.includes("kedi")) return "🐱";
        if (name.includes("köpek") || name.includes("kopek")) return "🐶";
        if (name.includes("kuş") || name.includes("kus")) return "🐦";
        if (name.includes("tavşan") || name.includes("tavsan")) return "🐰";
        return "🐾";
    }
    function petById(id) {
        return pets.find((item) => item.id === String(id));
    }
    function vetById(id) {
        return vets.find((item) => item.id === String(id));
    }
    function petInfo(item) {
        const pet = petById(item.petId);
        return {
            name: item.petName || pet?.name || `Hayvan #${item.petId}`,
            icon: petIcon(item.petType || pet?.type)
        };
    }
    function vetInfo(item) {
        const vet = vetById(item.veterinarianId);
        return {
            name: item.vetName || vet?.name || "Veteriner bilgisi bekleniyor",
            clinic: item.clinicName || vet?.clinic || "Veteriner kliniği"
        };
    }
    function statusHtml(status) {
        const info = statusMap[status] || { label: status || "Bilinmiyor", icon: "•", css: "confirmed" };
        return `<span class="appt-status is-${info.css}">${info.icon} ${escapeHtml(info.label)}</span>`;
    }
    function appointmentStamp(item) {
        return item.startTime ? new Date(item.startTime).getTime() : Number.MAX_SAFE_INTEGER;
    }
    function isUpcoming(item) {
        return item.status === "scheduled" && Boolean(item.startTime) && appointmentStamp(item) >= Date.now();
    }
    function isPast(item) {
        return item.status === "completed" ||
            (item.status === "scheduled" && Boolean(item.startTime) && appointmentStamp(item) < Date.now());
    }
    function normalizeAppointment(raw) {
        const startTime = raw.startTime || null;
        const parsed = startTime ? new Date(startTime) : null;
        const validDate = parsed && !Number.isNaN(parsed.getTime());
        return {
            id: String(raw.id),
            petId: String(raw.petId),
            veterinarianId: raw.veterinarianId == null ? "" : String(raw.veterinarianId),
            availabilityId: String(raw.availabilityId),
            petName: raw.petName || "",
            petType: raw.petType || "",
            vetName: raw.vetName || "",
            clinicName: raw.clinicName || "",
            startTime: validDate ? startTime : null,
            date: validDate ? dateKey(parsed) : null,
            time: validDate ? new Intl.DateTimeFormat("tr-TR", {
                hour: "2-digit", minute: "2-digit", hour12: false
            }).format(parsed) : "--:--",
            reason: raw.reason || "Belirtilmemiş",
            status: raw.status || "scheduled",
            notes: raw.notes || ""
        };
    }

    function toast(message) {
        const element = $("appt-toast");
        element.textContent = message;
        element.hidden = false;
        if (toastTimeout !== null) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { element.hidden = true; }, 4600);
    }
    function setFormError(message) {
        formError.textContent = message;
        formError.hidden = !message;
    }
    function setSelectOptions(select, placeholder, items, makeLabel) {
        select.replaceChildren();
        const first = document.createElement("option");
        first.value = "";
        first.textContent = placeholder;
        select.appendChild(first);
        items.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = makeLabel(item);
            select.appendChild(option);
        });
    }

    // -------------------- VERITABANINDAN YUKLEME --------------------
    async function loadPets() {
        try {
            const data = await apiRequest("pets");
            if (!Array.isArray(data)) throw new Error("Hayvan listesi beklenen biçimde değil.");
            pets = data.map((item) => ({
                id: String(item.id),
                name: item.name,
                type: item.type || ""
            }));
            setSelectOptions(petSelect, pets.length ? "Hayvan seçiniz" : "Kayıtlı hayvan bulunamadı", pets,
                (pet) => `${petIcon(pet.type)} ${pet.name} (${pet.type || "Tür belirtilmemiş"})`);
            renderAll();
        } catch (error) {
            setSelectOptions(petSelect, "Hayvanlar yüklenemedi", [], () => "");
            throw error;
        }
    }
    async function loadVets() {
        try {
            const data = await apiRequest("veterinarians");
            if (!Array.isArray(data)) throw new Error("Veteriner listesi beklenen biçimde değil.");
            vets = data.map((item) => ({
                id: String(item.id),
                name: item.fullName,
                clinic: item.clinicName || "Klinik belirtilmemiş",
                specialty: item.specialty || ""
            }));
            setSelectOptions(vetSelect, vets.length ? "Veteriner seçiniz" : "Kayıtlı veteriner bulunamadı", vets,
                (vet) => `${vet.name} — ${vet.clinic}`);
            renderAll();
        } catch (error) {
            setSelectOptions(vetSelect, "Veterinerler yüklenemedi", [], () => "");
            throw error;
        }
    }
    async function loadAppointments() {
        const data = await apiRequest("appointments");
        if (!Array.isArray(data)) throw new Error("Randevu listesi beklenen biçimde değil.");
        appointments = data.map(normalizeAppointment);
        renderAll();
        if (appointments.some((item) => !item.startTime)) {
            toast("Randevuların tarih/saat bilgisi için Appointment API'si henüz güncellenmeli.");
        }
    }

    // -------------------- UST OZET --------------------
    function renderStats() {
        $("appt-stat-upcoming").textContent = appointments.filter(isUpcoming).length;
        $("appt-stat-completed").textContent = appointments.filter((item) => item.status === "completed").length;
        const monthPrefix = todayKey.slice(0, 7);
        $("appt-stat-month").textContent = appointments.filter((item) =>
            item.date?.startsWith(monthPrefix) && item.status !== "cancelled").length;
    }

    // -------------------- TAKVIM --------------------
    function renderCalendar() {
        const year = viewedMonth.getFullYear();
        const month = viewedMonth.getMonth();
        const first = new Date(year, month, 1);
        const dayCount = new Date(year, month + 1, 0).getDate();
        const mondayOffset = (first.getDay() + 6) % 7;
        const totalCells = Math.ceil((mondayOffset + dayCount) / 7) * 7;

        $("appt-month-label").textContent = new Intl.DateTimeFormat("tr-TR", {
            month: "long", year: "numeric"
        }).format(first).replace(/^./, (letter) => letter.toLocaleUpperCase("tr-TR"));

        const markedDates = new Set(appointments.map((item) => item.date).filter(Boolean));
        let html = "";
        for (let index = 0; index < totalCells; index++) {
            const day = index - mondayOffset + 1;
            if (day < 1 || day > dayCount) {
                html += '<span class="appt-calendar-pad" aria-hidden="true"></span>';
                continue;
            }
            const key = dateKey(new Date(year, month, day));
            const classes = ["appt-calendar-day"];
            if (key === todayKey) classes.push("is-today");
            if (key === selectedDay) classes.push("is-selected");
            if (key < todayKey) classes.push("is-past");
            if (markedDates.has(key)) classes.push("has-appointment");
            html += `<button type="button" class="${classes.join(" ")}" data-day="${key}"
                aria-label="${escapeHtml(formatDate(key, { day: "numeric", month: "long", year: "numeric" }))}"
                aria-pressed="${key === selectedDay}" ${key === todayKey ? 'aria-current="date"' : ""}>${day}</button>`;
        }
        calendarGrid.innerHTML = html;
    }
    function selectDay(key) {
        selectedDay = key;
        const date = keyToDate(key);
        if (date.getMonth() !== viewedMonth.getMonth() || date.getFullYear() !== viewedMonth.getFullYear()) {
            viewedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        }
        renderCalendar();
        renderDay();
    }
    function renderDay() {
        $("appt-selected-date").textContent = formatDate(selectedDay, {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
        const items = appointments.filter((item) => item.date === selectedDay)
            .sort((a, b) => a.time.localeCompare(b.time));
        if (!items.length) {
            const next = appointments.filter(isUpcoming).sort((a, b) => appointmentStamp(a) - appointmentStamp(b))[0];
            dayList.innerHTML = `
                <div class="appt-empty-day">
                    <span class="appt-empty-emoji" aria-hidden="true">🌷</span>
                    <strong>Bu gün için randevu bulunmuyor.</strong>
                    <p>Takvimden başka bir gün seçebilir veya yeni randevu oluşturabilirsin.</p>
                </div>
                ${next ? `<div class="appt-next-hint">
                    <div><small>SIRADAKİ RANDEVUN</small>
                    <strong>${escapeHtml(formatDate(next.date, { day: "numeric", month: "long" }))} · ${escapeHtml(next.time)}</strong>
                    <span>${escapeHtml(petInfo(next).name)} · ${escapeHtml(vetInfo(next).clinic)}</span></div>
                    <button type="button" data-jump-date="${next.date}" aria-label="Sıradaki randevu gününe git">›</button>
                </div>` : ""}`;
            return;
        }
        dayList.innerHTML = items.map((item) => {
            const pet = petInfo(item);
            const vet = vetInfo(item);
            const status = statusMap[item.status]?.label || item.status;
            return `<article class="appt-day-item">
                <span class="appt-day-time">${escapeHtml(item.time)}</span>
                <span class="appt-day-pet" aria-hidden="true">${escapeHtml(pet.icon)}</span>
                <div class="appt-day-info">
                    <strong>${escapeHtml(vet.clinic)}</strong>
                    <small>${escapeHtml(pet.name)} · ${escapeHtml(item.reason)}</small>
                    <small>${escapeHtml(status)}</small>
                </div>
                <button type="button" class="appt-day-more" data-details="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(pet.name)} için randevu detayları">›</button>
            </article>`;
        }).join("");
    }

    // -------------------- LISTELER VE FILTRELER --------------------
    function listCard(item) {
        const pet = petInfo(item);
        const vet = vetInfo(item);
        const date = item.date ? keyToDate(item.date) : null;
        const monthYear = date ? new Intl.DateTimeFormat("tr-TR", {
            month: "short", year: "numeric"
        }).format(date) : "Tarih yok";
        return `<article class="appt-list-card is-${statusMap[item.status]?.css || "confirmed"}">
            <div class="appt-date-block">
                <strong>${date ? date.getDate() : "?"}</strong>
                <span>${escapeHtml(monthYear)}<br>${escapeHtml(item.time)}</span>
            </div>
            <div class="appt-list-pet" aria-hidden="true">${escapeHtml(pet.icon)}</div>
            <div class="appt-list-meta">
                <h3>${escapeHtml(vet.clinic)}</h3>
                <p>${escapeHtml(vet.name)}</p>
                <p class="appt-pet-line">🐾 ${escapeHtml(pet.name)} · ${escapeHtml(item.reason)}</p>
            </div>
            <div class="appt-list-side">
                ${statusHtml(item.status)}
                <button type="button" class="appt-card-more" data-details="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(pet.name)} randevu detaylarını aç">›</button>
            </div>
        </article>`;
    }
    function groupMarkup(title, items) {
        if (!items.length) return "";
        return `<div class="appt-group-title"><span>${title}</span><span class="appt-group-line"></span>
            <span class="appt-group-count">${items.length}</span></div>` + items.map(listCard).join("");
    }
    function renderAllList() {
        const upcoming = appointments.filter(isUpcoming).sort((a, b) => appointmentStamp(a) - appointmentStamp(b));
        const past = appointments.filter(isPast).sort((a, b) => appointmentStamp(b) - appointmentStamp(a));
        const cancelled = appointments.filter((item) => item.status === "cancelled")
            .sort((a, b) => appointmentStamp(b) - appointmentStamp(a));
        const missingDate = appointments.filter((item) => !item.startTime);
        let visibleCount = 0;
        let html = "";
        if (selectedFilter === "all" || selectedFilter === "upcoming") {
            visibleCount += upcoming.length;
            html += groupMarkup("📅 Yaklaşan Randevular", upcoming);
        }
        if (selectedFilter === "all" || selectedFilter === "completed") {
            visibleCount += past.length;
            html += groupMarkup("✓ Geçmiş Randevular", past);
        }
        if (selectedFilter === "all" || selectedFilter === "cancelled") {
            visibleCount += cancelled.filter((item) => item.startTime).length;
            html += groupMarkup("× İptal Edilen Randevular", cancelled.filter((item) => item.startTime));
        }
        if (selectedFilter === "all") {
            visibleCount += missingDate.length;
            html += groupMarkup("⚠ Tarih bilgisi beklenen kayıtlar", missingDate);
        }
        $("appt-count-label").textContent = `${visibleCount} randevu`;
        allList.innerHTML = html || `<div class="appt-no-results">
            <span class="appt-empty-emoji" aria-hidden="true">📭</span>
            <strong>Bu kategoride randevu bulunmuyor.</strong>
            <p>Başka bir filtre seçebilir veya yeni randevu oluşturabilirsin.</p>
        </div>`;
        document.querySelectorAll(".appt-tab").forEach((button) => {
            const active = button.dataset.filter === selectedFilter;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
        });
    }
    function renderAll() {
        renderStats();
        renderCalendar();
        renderDay();
        renderAllList();
    }

    // -------------------- GERCEK MUS AIT SAATLER --------------------
    async function renderSlots() {
        const requestId = ++slotsRequestId;
        selectedSlot = null;
        availableSlots = [];
        const vetId = vetSelect.value;
        const key = dateInput.value;
        if (!vetId || !key) {
            slotList.innerHTML = '<div class="appt-slot-empty">Önce veteriner ve tarih seç.</div>';
            return;
        }
        if (key < todayKey || key > latestAllowedDate) {
            slotList.innerHTML = '<div class="appt-slot-empty">Bugünden itibaren 60 gün içinde bir tarih seç.</div>';
            return;
        }
        slotList.innerHTML = '<div class="appt-slot-empty">Müsait saatler yükleniyor...</div>';
        try {
            const data = await apiRequest(`veterinarians/${encodeURIComponent(vetId)}/availability`);
            if (requestId !== slotsRequestId) return;
            if (!Array.isArray(data)) throw new Error("Müsait saatler beklenen biçimde değil.");
            availableSlots = data.filter((slot) => {
                const start = new Date(slot.startTime);
                return !Number.isNaN(start.getTime()) && dateKey(start) === key && start.getTime() > Date.now();
            }).map((slot) => ({
                id: String(slot.id),
                time: new Intl.DateTimeFormat("tr-TR", {
                    hour: "2-digit", minute: "2-digit", hour12: false
                }).format(new Date(slot.startTime))
            }));
            if (!availableSlots.length) {
                slotList.innerHTML = '<div class="appt-slot-empty">Bu tarih için müsait saat bulunmuyor.</div>';
                return;
            }
            slotList.innerHTML = availableSlots.map((slot) =>
                `<button type="button" class="appt-slot" data-slot="${escapeHtml(slot.id)}"
                    aria-pressed="false">${escapeHtml(slot.time)}</button>`
            ).join("");
        } catch (error) {
            if (requestId !== slotsRequestId) return;
            slotList.innerHTML = `<div class="appt-slot-empty">${escapeHtml(error.message)}</div>`;
        }
    }

    // -------------------- RANDEVU OLUSTURMA --------------------
    function openCreate() {
        form.reset();
        setFormError("");
        selectedSlot = null;
        dateInput.value = selectedDay >= todayKey && selectedDay <= latestAllowedDate ? selectedDay : todayKey;
        $("appt-notes-count").textContent = "0";
        $("appt-create-title").textContent = "Yeni Randevu Oluştur";
        $("appt-form-submit").textContent = "Randevu Oluştur";
        createDialog.showModal();
        renderSlots();
        petSelect.focus();
        if (!pets.length) {
            setFormError("Hayvan listesi boş veya yüklenemedi. Hayvanlarım özelliğinin API'si bu sürümde bulunmayabilir.");
        }
    }
    async function createAppointment(event) {
        event.preventDefault();
        setFormError("");
        const petId = petSelect.value;
        const vetId = vetSelect.value;
        const date = dateInput.value;
        const reason = reasonSelect.value;
        if (!petById(petId) || !vetById(vetId) || !reason || !date) {
            setFormError("Lütfen hayvan, veteriner, tarih ve randevu nedenini seç.");
            return;
        }
        if (date < todayKey || date > latestAllowedDate) {
            setFormError("Lütfen bugünden itibaren 60 gün içindeki bir tarih seç.");
            return;
        }
        if (!selectedSlot || !availableSlots.some((slot) => slot.id === selectedSlot)) {
            setFormError("Lütfen müsait bir saat seç.");
            return;
        }
        const submit = $("appt-form-submit");
        submit.disabled = true;
        try {
            await apiRequest("appointments", {
                method: "POST",
                body: JSON.stringify({
                    petId: Number(petId),
                    availabilityId: Number(selectedSlot),
                    reason,
                    notes: notesInput.value.trim().slice(0, 220)
                })
            });
            createDialog.close();
            selectedFilter = "all";
            selectDay(date);
            toast("Randevu PostgreSQL'e kaydedildi. ✓");
            try {
                await loadAppointments();
            } catch (reloadError) {
                toast(`Randevu kaydedildi ancak liste yenilenemedi: ${reloadError.message}`);
            }
        } catch (error) {
            setFormError(error.message);
            // Baska kullanici saati almissa listeyi yeniden yukle.
            if (error.message.includes("409") || error.message.includes("dolu")) {
                await renderSlots();
            }
        } finally {
            submit.disabled = false;
        }
    }

    // -------------------- DETAY VE IPTAL --------------------
    function openDetails(id) {
        const item = appointments.find((appointment) => appointment.id === String(id));
        if (!item) return;
        const pet = petInfo(item);
        const vet = vetInfo(item);
        detailsAppointmentId = item.id;
        cancelConfirm.hidden = true;
        cancelRequest.hidden = !isUpcoming(item);
        rescheduleButton.hidden = true; // Backend'de reschedule API'si henuz yok.
        $("appt-details-body").innerHTML = `
            <div class="appt-detail-clinic">
                <strong>🏥 ${escapeHtml(vet.clinic)}</strong>
                <span>${escapeHtml(vet.name)}</span>
            </div>
            <div class="appt-detail-grid">
                <div class="appt-detail-item"><span>Evcil hayvan</span><strong>${escapeHtml(pet.icon)} ${escapeHtml(pet.name)}</strong></div>
                <div class="appt-detail-item"><span>Durum</span><strong>${escapeHtml(statusMap[item.status]?.label || item.status)}</strong></div>
                <div class="appt-detail-item"><span>Tarih</span><strong>${escapeHtml(formatDate(item.date, { day: "numeric", month: "long", year: "numeric" }))}</strong></div>
                <div class="appt-detail-item"><span>Saat</span><strong>${escapeHtml(item.time)}</strong></div>
                <div class="appt-detail-item"><span>Randevu nedeni</span><strong>${escapeHtml(item.reason)}</strong></div>
                <div class="appt-detail-item"><span>Veri türü</span><strong>PostgreSQL kaydı</strong></div>
            </div>
            ${item.notes ? `<p class="appt-detail-notes"><strong>Not:</strong> ${escapeHtml(item.notes)}</p>` : ""}`;
        detailsDialog.showModal();
    }
    async function cancelAppointment() {
        const item = appointments.find((appointment) => appointment.id === detailsAppointmentId);
        if (!item || !isUpcoming(item)) return;
        const button = $("appt-cancel-yes");
        button.disabled = true;
        try {
            await apiRequest(`appointments/${encodeURIComponent(item.id)}/cancel`, { method: "PUT" });
            detailsDialog.close();
            detailsAppointmentId = null;
            toast("Randevu veritabanında iptal edildi.");
            try {
                await loadAppointments();
            } catch (reloadError) {
                toast(`Randevu iptal edildi ancak liste yenilenemedi: ${reloadError.message}`);
            }
        } catch (error) {
            cancelConfirm.hidden = true;
            toast(error.message);
        } finally {
            button.disabled = false;
        }
    }

    // -------------------- ETKILESIMLER --------------------
    $("appt-prev-month").addEventListener("click", () => {
        viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1);
        renderCalendar();
    });
    $("appt-next-month").addEventListener("click", () => {
        viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1);
        renderCalendar();
    });
    $("appt-go-today").addEventListener("click", () => selectDay(todayKey));
    calendarGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-day]");
        if (button) selectDay(button.dataset.day);
    });
    document.querySelector(".appt-tabs").addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;
        selectedFilter = button.dataset.filter;
        renderAllList();
    });
    [dayList, allList].forEach((container) => {
        container.addEventListener("click", (event) => {
            const jump = event.target.closest("[data-jump-date]");
            if (jump) { selectDay(jump.dataset.jumpDate); return; }
            const button = event.target.closest("[data-details]");
            if (button) openDetails(button.dataset.details);
        });
    });
    $("appt-open-create").addEventListener("click", openCreate);
    form.addEventListener("submit", createAppointment);
    vetSelect.addEventListener("change", renderSlots);
    dateInput.addEventListener("change", renderSlots);
    slotList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-slot]");
        if (!button || button.disabled) return;
        selectedSlot = button.dataset.slot;
        slotList.querySelectorAll("[data-slot]").forEach((item) => {
            const chosen = item === button;
            item.classList.toggle("is-selected", chosen);
            item.setAttribute("aria-pressed", String(chosen));
        });
        setFormError("");
    });
    notesInput.addEventListener("input", () => {
        $("appt-notes-count").textContent = String(notesInput.value.length);
    });
    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
        button.addEventListener("click", () => {
            const dialog = button.closest("dialog");
            if (dialog) dialog.close();
        });
    });
    [createDialog, detailsDialog].forEach((dialog) => {
        dialog.addEventListener("click", (event) => {
            if (event.target === dialog) dialog.close();
        });
    });
    rescheduleButton.hidden = true;
    cancelRequest.addEventListener("click", () => { cancelConfirm.hidden = false; });
    $("appt-cancel-back").addEventListener("click", () => { cancelConfirm.hidden = true; });
    $("appt-cancel-yes").addEventListener("click", cancelAppointment);

    // -------------------- BASLANGIC --------------------
    dateInput.min = todayKey;
    dateInput.max = latestAllowedDate;
    setSelectOptions(petSelect, "Hayvanlar yükleniyor...", [], () => "");
    setSelectOptions(vetSelect, "Veterinerler yükleniyor...", [], () => "");
    slotList.innerHTML = '<div class="appt-slot-empty">Önce veteriner ve tarih seç.</div>';
    renderAll();

    Promise.allSettled([loadPets(), loadVets(), loadAppointments()]).then((results) => {
        const failed = results.filter((result) => result.status === "rejected");
        if (failed.length) {
            const messages = failed.map((result) => result.reason?.message || "Bilinmeyen API hatası");
            toast(messages.join(" | "));
        }
    });
});
