// ============================================================
// PETCARE / RANDEVULARIM - ON YUZ DEMOSU
// ============================================================
// Bu sayfa API'ye randevu KAYDETMEZ. Ornek veri, sayfa acikken
// JavaScript belleğinde tutulur. Sayfa yenilenirse sifirlanir.
// Sonradan /api/pets, /api/veterinarians, /api/appointments
// endpoint'leri ile degistirilecek kisimlar asagida ayrilmistir.
// Ortak script.js: oturum, profil, arama ve cikis işlemleri.

"use strict";

document.addEventListener("DOMContentLoaded", function () {
    // -------------------- ORNEK VERILER --------------------
    // Not: pets.html sayfasindaki gercek veri yerine gecmez.
    const demoPets = [
        { id: "pet-1", name: "Pamuk", species: "Kedi", icon: "🐱" },
        { id: "pet-2", name: "Boncuk", species: "Köpek", icon: "🐶" }
    ];

    const demoVets = [
        {
            id: "vet-1",
            name: "Dr. Ayşe Yılmaz",
            clinic: "Pati Dostu Veteriner Kliniği",
            hours: ["09:00", "10:00", "11:00", "13:30", "14:30", "15:30", "16:30"]
        },
        {
            id: "vet-2",
            name: "Dr. Mehmet Demir",
            clinic: "VetYaşam Kliniği",
            hours: ["09:30", "10:30", "11:30", "14:00", "15:00", "16:00"]
        },
        {
            id: "vet-3",
            name: "Dr. Elif Kaya",
            clinic: "Mutlu Pati Veteriner Kliniği",
            hours: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"]
        }
    ];

    const today = startOfDay(new Date());
    const todayKey = dateKey(today);
    const latestAllowedDate = dateKey(addDays(today, 60));
    let viewedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDay = todayKey;
    let selectedFilter = "all";
    let selectedSlot = null;
    let detailsAppointmentId = null;
    let editingAppointmentId = null;
    let nextId = 100;
    let toastTimeout = null;

    // Tum ornek tarihler bugune gore olusturulur: eski tarihlerin
    // her sene duzeltilmesi gerekmez.
    const appointments = [
        { id: "demo-1", petId: "pet-2", vetId: "vet-1", date: demoWorkingDay(2),  time: "10:00", reason: "Genel kontrol", status: "confirmed", notes: "" },
        { id: "demo-2", petId: "pet-1", vetId: "vet-3", date: demoWorkingDay(8),  time: "14:00", reason: "Aşı", status: "pending", notes: "" },
        { id: "demo-3", petId: "pet-2", vetId: "vet-2", date: demoWorkingDay(20), time: "11:30", reason: "Diş kontrolü", status: "confirmed", notes: "" },
        { id: "demo-4", petId: "pet-1", vetId: "vet-1", date: demoWorkingDay(-17), time: "09:00", reason: "Genel kontrol", status: "completed", notes: "" },
        { id: "demo-5", petId: "pet-2", vetId: "vet-3", date: demoWorkingDay(-43), time: "15:00", reason: "Aşı", status: "completed", notes: "" },
        { id: "demo-6", petId: "pet-1", vetId: "vet-2", date: demoWorkingDay(-7), time: "10:30", reason: "Kulak kontrolü", status: "cancelled", notes: "" }
    ];

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

    const statusMap = {
        confirmed: { label: "Onaylandı", icon: "✓" },
        pending: { label: "Onay bekliyor", icon: "◷" },
        completed: { label: "Tamamlandı", icon: "✓" },
        cancelled: { label: "İptal edildi", icon: "×" }
    };

    // -------------------- TARIH / GUVENLI METIN YARDIMCILARI --------------------
    function startOfDay(value) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    function addDays(value, amount) {
        const copy = new Date(value.getFullYear(), value.getMonth(), value.getDate());
        copy.setDate(copy.getDate() + amount);
        return copy;
    }
    function demoWorkingDay(offset) {
        let date = addDays(today, offset);
        const direction = offset >= 0 ? 1 : -1;
        // Örnek kayıtların kliniklerin kapalı olduğu hafta sonlarına denk gelmesini önle.
        while (date.getDay() === 0 || date.getDay() === 6) {
            date = addDays(date, direction);
        }
        return dateKey(date);
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
        return new Intl.DateTimeFormat("tr-TR", options).format(keyToDate(key));
    }
    function escapeHtml(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
    }
    function petById(id) { return demoPets.find((item) => item.id === id); }
    function vetById(id) { return demoVets.find((item) => item.id === id); }
    function isUpcoming(item) {
        return (item.status === "pending" || item.status === "confirmed") && item.date >= todayKey;
    }
    function statusHtml(status) {
        const definition = statusMap[status];
        if (!definition) return "";
        return `<span class="appt-status is-${status}">${definition.icon} ${definition.label}</span>`;
    }
    function appointmentStamp(item) { return `${item.date}T${item.time}`; }

    // -------------------- UST OZET --------------------
    function renderStats() {
        const upcoming = appointments.filter(isUpcoming).length;
        const completed = appointments.filter((item) => item.status === "completed").length;
        const monthPrefix = todayKey.slice(0, 7);
        const thisMonth = appointments.filter((item) => item.date.startsWith(monthPrefix) && item.status !== "cancelled").length;
        $("appt-stat-upcoming").textContent = upcoming;
        $("appt-stat-completed").textContent = completed;
        $("appt-stat-month").textContent = thisMonth;
    }

    // -------------------- AYLIK TAKVIM --------------------
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

        const markedDates = new Set(appointments.map((item) => item.date));
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

    // -------------------- SECILEN GUN --------------------
    function renderDay() {
        $("appt-selected-date").textContent = formatDate(selectedDay, {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });
        const items = appointments
            .filter((item) => item.date === selectedDay)
            .sort((a, b) => a.time.localeCompare(b.time));

        if (!items.length) {
            const next = appointments.filter(isUpcoming)
                .sort((a, b) => appointmentStamp(a).localeCompare(appointmentStamp(b)))[0];
            dayList.innerHTML = `
                <div class="appt-empty-day">
                    <span class="appt-empty-emoji" aria-hidden="true">🌷</span>
                    <strong>Bu gün için randevu bulunmuyor.</strong>
                    <p>Takvimden randevulu bir gün seçebilir veya örnek randevu oluşturabilirsin.</p>
                </div>
                ${next ? `<div class="appt-next-hint">
                    <div><small>SIRADAKİ RANDEVUN</small>
                    <strong>${escapeHtml(formatDate(next.date, { day:"numeric", month:"long" }))} · ${escapeHtml(next.time)}</strong>
                    <span>${escapeHtml(petById(next.petId).name)} · ${escapeHtml(vetById(next.vetId).clinic)}</span></div>
                    <button type="button" data-jump-date="${next.date}" aria-label="Sıradaki randevu gününe git">›</button>
                </div>` : ""}`;
            return;
        }

        dayList.innerHTML = items.map((item) => {
            const pet = petById(item.petId);
            const vet = vetById(item.vetId);
            return `<article class="appt-day-item">
                <span class="appt-day-time">${escapeHtml(item.time)}</span>
                <span class="appt-day-pet" aria-hidden="true">${escapeHtml(pet.icon)}</span>
                <div class="appt-day-info">
                    <strong>${escapeHtml(vet.clinic)}</strong>
                    <small>${escapeHtml(pet.name)} · ${escapeHtml(item.reason)}</small>
                    <small>${escapeHtml(statusMap[item.status].label)}</small>
                </div>
                <button type="button" class="appt-day-more" data-details="${item.id}"
                        aria-label="${escapeHtml(pet.name)} için randevu detayları">›</button>
            </article>`;
        }).join("");
    }

    // -------------------- RANDEVU LISTELERI VE FILTRELER --------------------
    function listCard(item) {
        const pet = petById(item.petId);
        const vet = vetById(item.vetId);
        const date = keyToDate(item.date);
        const monthYear = new Intl.DateTimeFormat("tr-TR", { month: "short", year: "numeric" }).format(date);
        return `<article class="appt-list-card is-${item.status}">
            <div class="appt-date-block">
                <strong>${date.getDate()}</strong>
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
                <button type="button" class="appt-card-more" data-details="${item.id}"
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
        const upcoming = appointments.filter(isUpcoming).sort((a, b) => appointmentStamp(a).localeCompare(appointmentStamp(b)));
        const completed = appointments.filter((item) => item.status === "completed")
            .sort((a, b) => appointmentStamp(b).localeCompare(appointmentStamp(a)));
        const cancelled = appointments.filter((item) => item.status === "cancelled")
            .sort((a, b) => appointmentStamp(b).localeCompare(appointmentStamp(a)));

        let visibleCount = 0;
        let html = "";
        if (selectedFilter === "all" || selectedFilter === "upcoming") {
            visibleCount += upcoming.length;
            html += groupMarkup("📅 Yaklaşan Randevular", upcoming);
        }
        if (selectedFilter === "all" || selectedFilter === "completed") {
            visibleCount += completed.length;
            html += groupMarkup("✓ Geçmiş Randevular", completed);
        }
        if (selectedFilter === "all" || selectedFilter === "cancelled") {
            visibleCount += cancelled.length;
            html += groupMarkup("× İptal Edilen Randevular", cancelled);
        }
        $("appt-count-label").textContent = `${visibleCount} randevu`;
        allList.innerHTML = html || `<div class="appt-no-results">
            <span class="appt-empty-emoji" aria-hidden="true">📭</span>
            <strong>Bu kategoride randevu bulunmuyor.</strong>
            <p>Başka bir filtre seçebilir veya örnek randevu oluşturabilirsin.</p>
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

    // -------------------- FORM ALANLARI --------------------
    function populateDemoChoices() {
        demoPets.forEach((pet) => {
            const option = document.createElement("option");
            option.value = pet.id;
            option.textContent = `${pet.icon} ${pet.name} (${pet.species})`;
            petSelect.appendChild(option);
        });
        demoVets.forEach((vet) => {
            const option = document.createElement("option");
            option.value = vet.id;
            option.textContent = `${vet.name} — ${vet.clinic}`;
            vetSelect.appendChild(option);
        });
        dateInput.min = todayKey;
        dateInput.max = latestAllowedDate;
    }

    function isSlotBlocked(vetId, key, time, exceptId = null) {
        const booked = appointments.some((item) =>
            item.id !== exceptId && item.vetId === vetId && item.date === key && item.time === time && item.status !== "cancelled"
        );
        if (booked) return true;
        if (key === todayKey) {
            const now = new Date();
            const [hour, minute] = time.split(":").map(Number);
            const slotTime = keyToDate(key);
            slotTime.setHours(hour, minute, 0, 0);
            if (slotTime <= now) return true;
        }
        return false;
    }

    function getSlots(vetId, key) {
        const vet = vetById(vetId);
        if (!vet || !key || key < todayKey || key > latestAllowedDate) return [];
        const weekday = keyToDate(key).getDay();
        if (weekday === 0) return []; // Ornek klinikler pazar kapali.
        if (weekday === 6) return vet.hours.filter((time) => time < "13:00");
        return vet.hours;
    }

    function renderSlots() {
        selectedSlot = null;
        const vetId = vetSelect.value;
        const key = dateInput.value;
        if (!vetId || !key) {
            slotList.innerHTML = '<div class="appt-slot-empty">Önce veteriner ve tarih seç.</div>';
            return;
        }
        const slots = getSlots(vetId, key);
        if (!slots.length) {
            slotList.innerHTML = '<div class="appt-slot-empty">Bu tarih için örnek müsait saat bulunmuyor. Başka bir gün seç.</div>';
            return;
        }
        slotList.innerHTML = slots.map((slot) => {
            const blocked = isSlotBlocked(vetId, key, slot, editingAppointmentId);
            return `<button type="button" class="appt-slot" data-slot="${slot}"
                    aria-pressed="false" ${blocked ? 'disabled title="Dolu veya geçmiş saat"' : ""}>${slot}</button>`;
        }).join("");
        if (!slotList.querySelector(".appt-slot:not(:disabled)")) {
            slotList.innerHTML = '<div class="appt-slot-empty">Bu günün tüm örnek saatleri dolu veya geçmiş durumda.</div>';
        }
    }

    function setFormError(message) {
        formError.textContent = message;
        formError.hidden = !message;
    }

    function openCreate(editId = null) {
        editingAppointmentId = (typeof editId === "string") ? editId : null;
        form.reset();
        setFormError("");
        const existing = appointments.find((item) => item.id === editingAppointmentId);
        if (existing) {
            petSelect.value = existing.petId;
            vetSelect.value = existing.vetId;
            dateInput.value = existing.date;
            reasonSelect.value = existing.reason;
            notesInput.value = existing.notes;
        } else {
            editingAppointmentId = null;
            dateInput.value = (selectedDay >= todayKey && selectedDay <= latestAllowedDate) ? selectedDay : todayKey;
        }
        $("appt-notes-count").textContent = String(notesInput.value.length);
        $("appt-create-title").textContent = existing ? "Randevu Tarihini Değiştir" : "Yeni Randevu Oluştur";
        $("appt-form-submit").textContent = existing ? "Örnek Randevuyu Güncelle" : "Örnek Randevu Oluştur";
        renderSlots();
        if (existing) {
            const button = [...slotList.querySelectorAll("[data-slot]")]
                .find((slotButton) => slotButton.dataset.slot === existing.time && !slotButton.disabled);
            if (button) {
                selectedSlot = existing.time;
                button.classList.add("is-selected");
                button.setAttribute("aria-pressed", "true");
            }
        }
        createDialog.showModal();
        petSelect.focus();
    }

    function createAppointment(event) {
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
        if (!selectedSlot || !getSlots(vetId, date).includes(selectedSlot) || isSlotBlocked(vetId, date, selectedSlot, editingAppointmentId)) {
            setFormError("Lütfen müsait bir saat seç. Seçtiğin saat artık uygun olmayabilir.");
            renderSlots();
            return;
        }

        const changes = {
            petId, vetId, date,
            time: selectedSlot,
            reason,
            status: "pending",
            notes: notesInput.value.trim().slice(0, 220)
        };
        const existing = appointments.find((item) => item.id === editingAppointmentId);
        if (existing) {
            Object.assign(existing, changes);
        } else {
            appointments.push({ id: `new-${nextId++}`, ...changes });
        }

        createDialog.close();
        editingAppointmentId = null;
        selectedFilter = "all";
        selectDay(date);
        renderAll();
        toast(existing ? "Örnek randevu güncellendi. Veritabanına kaydedilmedi. 💜"
            : "Örnek randevu oluşturuldu. Veritabanına kaydedilmedi. 💜");
    }

    // -------------------- DETAYLAR VE IPTAL --------------------
    function openDetails(id) {
        const item = appointments.find((appointment) => appointment.id === id);
        if (!item) return;
        const pet = petById(item.petId);
        const vet = vetById(item.vetId);
        detailsAppointmentId = id;
        cancelConfirm.hidden = true;
        cancelRequest.hidden = !isUpcoming(item);
        rescheduleButton.hidden = !isUpcoming(item);
        $("appt-details-body").innerHTML = `
            <div class="appt-detail-clinic">
                <strong>🏥 ${escapeHtml(vet.clinic)}</strong>
                <span>${escapeHtml(vet.name)}</span>
            </div>
            <div class="appt-detail-grid">
                <div class="appt-detail-item"><span>Evcil hayvan</span><strong>${escapeHtml(pet.icon)} ${escapeHtml(pet.name)}</strong></div>
                <div class="appt-detail-item"><span>Durum</span><strong>${escapeHtml(statusMap[item.status].label)}</strong></div>
                <div class="appt-detail-item"><span>Tarih</span><strong>${escapeHtml(formatDate(item.date, { day:"numeric",month:"long",year:"numeric" }))}</strong></div>
                <div class="appt-detail-item"><span>Saat</span><strong>${escapeHtml(item.time)}</strong></div>
                <div class="appt-detail-item"><span>Randevu nedeni</span><strong>${escapeHtml(item.reason)}</strong></div>
                <div class="appt-detail-item"><span>Veri türü</span><strong>Örnek kayıt</strong></div>
            </div>
            ${item.notes ? `<p class="appt-detail-notes"><strong>Not:</strong> ${escapeHtml(item.notes)}</p>` : ""}`;
        detailsDialog.showModal();
    }

    function cancelAppointment() {
        const item = appointments.find((appointment) => appointment.id === detailsAppointmentId);
        if (!item || !isUpcoming(item)) return;
        item.status = "cancelled";
        detailsDialog.close();
        detailsAppointmentId = null;
        renderAll();
        toast("Örnek randevu iptal edildi. Gerçek bir kayıt değiştirilmedi.");
    }

    // -------------------- BILGILENDIRME --------------------
    function toast(message) {
        const element = $("appt-toast");
        element.textContent = message;
        element.hidden = false;
        if (toastTimeout !== null) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { element.hidden = true; }, 4600);
    }

    // -------------------- ETKILESIMLER --------------------
    $("appt-prev-month").addEventListener("click", function () {
        viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1);
        renderCalendar();
    });
    $("appt-next-month").addEventListener("click", function () {
        viewedMonth = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1);
        renderCalendar();
    });
    $("appt-go-today").addEventListener("click", function () { selectDay(todayKey); });
    calendarGrid.addEventListener("click", function (event) {
        const button = event.target.closest("[data-day]");
        if (button) selectDay(button.dataset.day);
    });

    document.querySelector(".appt-tabs").addEventListener("click", function (event) {
        const button = event.target.closest("[data-filter]");
        if (!button) return;
        selectedFilter = button.dataset.filter;
        renderAllList();
    });

    [dayList, allList].forEach((container) => {
        container.addEventListener("click", function (event) {
            const jump = event.target.closest("[data-jump-date]");
            if (jump) { selectDay(jump.dataset.jumpDate); return; }
            const button = event.target.closest("[data-details]");
            if (button) openDetails(button.dataset.details);
        });
    });

    $("appt-open-create").addEventListener("click", function () { openCreate(); });
    form.addEventListener("submit", createAppointment);
    vetSelect.addEventListener("change", renderSlots);
    dateInput.addEventListener("change", renderSlots);
    slotList.addEventListener("click", function (event) {
        const button = event.target.closest("[data-slot]");
        if (!button || button.disabled) return;
        selectedSlot = button.dataset.slot;
        slotList.querySelectorAll("[data-slot]").forEach((slotButton) => {
            const chosen = slotButton === button;
            slotButton.classList.toggle("is-selected", chosen);
            slotButton.setAttribute("aria-pressed", String(chosen));
        });
        setFormError("");
    });
    notesInput.addEventListener("input", function () {
        $("appt-notes-count").textContent = String(notesInput.value.length);
    });

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
        button.addEventListener("click", function () {
            const dialog = button.closest("dialog");
            if (dialog) dialog.close();
        });
    });
    [createDialog, detailsDialog].forEach((dialog) => {
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) dialog.close();
        });
    });

    rescheduleButton.addEventListener("click", function () {
        const id = detailsAppointmentId;
        detailsDialog.close();
        openCreate(id);
    });
    cancelRequest.addEventListener("click", function () { cancelConfirm.hidden = false; });
    $("appt-cancel-back").addEventListener("click", function () { cancelConfirm.hidden = true; });
    $("appt-cancel-yes").addEventListener("click", cancelAppointment);

    // -------------------- ILK CIZIM --------------------
    populateDemoChoices();
    renderSlots();
    renderAll();
});
