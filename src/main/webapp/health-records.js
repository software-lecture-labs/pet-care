
/* ==========================================
   PETCARE - SAĞLIK KAYITLARI
========================================== */

document.addEventListener("DOMContentLoaded", async () =>{
    // ========================================
// OTURUM DOĞRULAMASINI BEKLE
// ========================================

    if (!window.petCareAuthReady) {
        console.error("Ortak oturum kontrolü bulunamadı.");
        return;
    }

    const isAuthenticated = await window.petCareAuthReady;

    if (!isAuthenticated) {
        return;
    }
    const petsGrid = document.getElementById("health-pets-grid");
    const recordsList = document.getElementById("health-records-list");
    const recordsTitle = document.getElementById("health-records-title");
    const filters = document.querySelectorAll(".health-filter");
    const sortSelect = document.getElementById("health-sort");

    const addButton = document.getElementById("health-add-btn");
    const bottomAddButton = document.getElementById("health-bottom-add");
    const addDialog = document.getElementById("health-add-dialog");
    const addForm = document.getElementById("health-add-form");
    const dialogClose = document.getElementById("health-dialog-close");
    const dialogCancel = document.getElementById("health-dialog-cancel");
    const formPet = document.getElementById("health-form-pet");

    let availablePets = [];

    let selectedPet = null;
    let selectedFilter = "all";

    // PostgreSQL'den getirilen sağlık kayıtları.
    let healthRecords = [];

    /* ==========================================
       HTML GÜVENLİĞİ
    ========================================== */

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[char];
        });
    }

    /* ==========================================
       HAYVAN TÜRÜNE GÖRE İKON
    ========================================== */

    function getPetIcon(type) {
        const normalized = String(type ?? "").toLowerCase();

        if (normalized.includes("cat") || normalized.includes("kedi")) {
            return "🐱";
        }

        if (normalized.includes("dog") || normalized.includes("köpek")) {
            return "🐶";
        }

        if (normalized.includes("bird") || normalized.includes("kuş")) {
            return "🐦";
        }

        return "🐾";
    }

    /* ==========================================
       SAĞLIK KAYITLARINI GÖSTER
    ========================================== */

    function renderRecords() {
        recordsList.replaceChildren();

        if (!selectedPet) {
            recordsTitle.textContent = "🐾 Sağlık Kayıtları";

            recordsList.innerHTML = `
                <p class="health-empty-message">
                    Sağlık kayıtlarını görüntülemek için bir hayvan seç.
                </p>
            `;

            return;
        }

        recordsTitle.textContent =
            `${selectedPet.name} • Sağlık Kayıtları`;

        const filteredRecords = healthRecords
            .filter((record) =>
                record.petId === selectedPet.id &&
                (
                    selectedFilter === "all" ||
                    record.type === selectedFilter
                )
            )
            .sort((a, b) => {
                const difference =
                    new Date(a.date) - new Date(b.date);

                return sortSelect.value === "oldest"
                    ? difference
                    : -difference;
            });

        if (filteredRecords.length === 0) {
            recordsList.innerHTML = `
                <p class="health-empty-message">
                    Bu hayvan için görüntülenecek sağlık kaydı bulunmuyor. 💜
                </p>
            `;

            return;
        }

        const typeLabels = {
            examination: "Muayene",
            vaccination: "Aşı",
            treatment: "Tedavi",
            test: "Test Sonuçları",
            other: "Diğer"
        };

        const typeIcons = {
            examination: "🩺",
            vaccination: "💉",
            treatment: "💊",
            test: "🧪",
            other: "📋"
        };

        filteredRecords.forEach((record) => {
            const item = document.createElement("article");

            const type = Object.hasOwn(typeLabels, record.type)
                ? record.type
                : "other";

            item.className = `health-record-item ${type}`;

            const formattedDate = new Date(
                `${record.date}T12:00:00`
            ).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            item.innerHTML = `
                <div class="health-record-top">
                    <div class="health-record-icon">
                        ${typeIcons[type]}
                    </div>

                    <div class="health-record-info">
                        <h3>${escapeHtml(record.title)}</h3>

                        <p>
                            ${escapeHtml(record.description)}
                        </p>

                        <p>
                            ${escapeHtml(record.clinic || "")}
                        </p>

                        <span class="health-record-type">
                            ${typeLabels[type]}
                        </span>
                    </div>

                    <time class="health-record-date"
                          datetime="${escapeHtml(record.date)}">
                        ${escapeHtml(formattedDate)}
                    </time>
                </div>
            `;

            recordsList.appendChild(item);
        });
    }

    /* ==========================================
       SAĞLIK KAYITLARINI VERİTABANINDAN GETİR
    ========================================== */

    async function loadHealthRecords() {
        if (!selectedPet) {
            healthRecords = [];
            renderRecords();
            return;
        }

        const petId = selectedPet.id;

        recordsList.innerHTML = `
        <p class="health-empty-message">
            Sağlık kayıtları yükleniyor...
        </p>
    `;

        try {
            const response = await fetch(
                `api/health-records?petId=${encodeURIComponent(petId)}`,
                {
                    credentials: "same-origin"
                }
            );

            if (!response.ok) {
                throw new Error("Sağlık kayıtları yüklenemedi.");
            }

            const records = await response.json();

            if (!Array.isArray(records)) {
                throw new Error("Beklenmeyen API yanıtı.");
            }

            // Kullanıcı bu sırada başka hayvan seçmiş olabilir.
            if (selectedPet?.id !== petId) {
                return;
            }

            healthRecords = records;
            renderRecords();

        } catch (error) {
            console.error("Sağlık kayıtları yüklenirken hata:", error);

            if (selectedPet?.id !== petId) {
                return;
            }

            healthRecords = [];

            recordsList.innerHTML = `
            <p class="health-empty-message">
                Sağlık kayıtları yüklenemedi.
                Lütfen daha sonra tekrar dene.
            </p>
        `;
        }
    }


    /* ==========================================
       HAYVAN KARTLARINI GÖSTER
    ========================================== */

    function renderPets(pets) {
        petsGrid.replaceChildren();

        if (!pets.length) {
            petsGrid.innerHTML = `
                <p class="health-empty-message">
                    Henüz kayıtlı hayvanın bulunmuyor.
                    Önce Hayvanlarım sayfasından hayvan ekleyebilirsin. 🐾
                </p>
            `;

            renderRecords();
            return;
        }

        pets.forEach((pet) => {
            const card = document.createElement("button");

            card.type = "button";
            card.className = "health-pet-card";

            const isSelected = selectedPet?.id === pet.id;

            if (isSelected) {
                card.classList.add("active");
            }

            card.setAttribute("aria-pressed", String(isSelected));

            card.innerHTML = `
                <div class="health-pet-avatar">
                    <span class="health-pet-emoji">
                        ${getPetIcon(pet.type)}
                    </span>
                </div>

                <div class="health-pet-info">
                    <h3>${escapeHtml(pet.name)}</h3>

                    <p>
                        ${escapeHtml(
                pet.breed || pet.type || "Evcil hayvan"
            )}
                    </p>
                </div>

                <span class="health-pet-check">
                    ${isSelected ? "✓" : ""}
                </span>
            `;

            /* PROFİL FOTOĞRAFI */

            if (pet.photoPath) {
                const avatar = card.querySelector(".health-pet-avatar");
                const emoji = avatar.querySelector(".health-pet-emoji");

                const img = document.createElement("img");

                img.src = `api/pet-photos/${encodeURIComponent(pet.id)}`;
                img.alt = `${pet.name} profil fotoğrafı`;

                img.onload = () => {
                    emoji.hidden = true;
                };

                img.onerror = () => {
                    img.remove();
                    emoji.hidden = false;
                };

                avatar.appendChild(img);
            }

            /* HAYVAN SEÇİMİ */

            card.addEventListener("click", () => {
                selectedPet = pet;

                renderPets(pets);
                loadHealthRecords();
            });

            petsGrid.appendChild(card);
        });
    }

    /* ==========================================
       HAYVANLARI VERİTABANINDAN GETİR
    ========================================== */

    async function loadPets() {
        try {
            const response = await fetch("api/pets", {
                credentials: "same-origin"
            });

            if (response.status === 401) {
                petsGrid.innerHTML = `
                    <p class="health-empty-message">
                        Hayvanlarını görüntülemek için giriş yapmalısın.
                    </p>
                `;

                recordsList.innerHTML = `
                    <p class="health-empty-message">
                        Sağlık kayıtlarını görmek için giriş yapmalısın.
                    </p>
                `;

                return;
            }

            if (!response.ok) {
                throw new Error("Hayvanlar yüklenemedi.");
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Beklenmeyen API yanıtı.");
            }

            const pets = data;
            availablePets = pets;

            selectedPet = pets.length > 0 ? pets[0] : null;

            renderPets(pets);
            await loadHealthRecords();

        } catch (error) {
            console.error("Hayvanlar yüklenirken hata:", error);

            petsGrid.innerHTML = `
                <p class="health-empty-message">
                    Hayvan bilgileri yüklenemedi.
                    Lütfen daha sonra tekrar dene.
                </p>
            `;

            recordsList.innerHTML = `
                <p class="health-empty-message">
                    Sağlık kayıtları şu anda görüntülenemiyor.
                </p>
            `;
        }
    }

    /* ==========================================
       KATEGORİ FİLTRELERİ
    ========================================== */

    filters.forEach((button) => {
        button.addEventListener("click", () => {
            filters.forEach((filter) => {
                filter.classList.remove("active");
            });

            button.classList.add("active");

            selectedFilter = button.dataset.filter;

            renderRecords();
        });
    });

    /* ==========================================
       TARİHE GÖRE SIRALAMA
    ========================================== */

    sortSelect.addEventListener("change", () => {
        renderRecords();
    });


    /* ==========================================
       YENİ SAĞLIK KAYDI EKLEME
    ========================================== */

    function handleAddRecord() {
        if (!selectedPet) {
            showToast("Önce bir hayvan eklemelisin.", "warning");
            return;
        }

        addForm.reset();
        formPet.replaceChildren();

        availablePets.forEach((pet) => {
            const option = document.createElement("option");
            option.value = String(pet.id);
            option.textContent = pet.name;
            formPet.appendChild(option);
        });

        formPet.value = String(selectedPet.id);

        // İşlem tarihini bugüne ayarla.
        const today = new Date();
        const localDate = new Date(
            today.getTime() - today.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 10);

        const dateInput = document.getElementById("health-form-date");
        dateInput.value = localDate;
        dateInput.max = localDate;

        addDialog.showModal();
    }

    addButton.addEventListener("click", handleAddRecord);
    bottomAddButton.addEventListener("click", handleAddRecord);

    /* PENCEREYİ KAPAT */

    dialogClose.addEventListener("click", () => {
        addDialog.close();
    });

    dialogCancel.addEventListener("click", () => {
        addDialog.close();
    });

    /* FORMU KAYDET */


    /* FORMU VERİTABANINA KAYDET */

    addForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!addForm.reportValidity()) {
            return;
        }

        const petId = Number(formPet.value);
        const pet = availablePets.find((item) => item.id === petId);

        if (!pet) {
            showToast("Lütfen geçerli bir hayvan seç.", "warning");
            return;
        }

        const record = {
            petId: pet.id,
            type: document.getElementById("health-form-type").value,
            date: document.getElementById("health-form-date").value,
            title: document.getElementById("health-form-title").value.trim(),
            clinic: document.getElementById("health-form-clinic").value.trim(),
            description: document.getElementById("health-form-description").value.trim()
        };

        if (!record.title) {
            showToast("Kayıt başlığı boş olamaz.", "warning");
            return;
        }

        const submitButton = addForm.querySelector('[type="submit"]');

        if (submitButton?.disabled) {
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const response = await fetch("api/health-records", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                throw new Error(
                    errorData.message || "Sağlık kaydı eklenemedi."
                );
            }

            selectedPet = pet;
            selectedFilter = "all";

            filters.forEach((button) => {
                button.classList.toggle(
                    "active",
                    button.dataset.filter === "all"
                );
            });

            renderPets(availablePets);

            addDialog.close();
            addForm.reset();

            await loadHealthRecords();

            showToast("Sağlık kaydı başarıyla eklendi.", "success");

        } catch (error) {
            console.error("Sağlık kaydı eklenirken hata:", error);
            showToast(error.message || "Sağlık kaydı kaydedilemedi.", "error");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });


    /* ==========================================
       SAYFAYI BAŞLAT
    ========================================== */

    loadPets();
});
