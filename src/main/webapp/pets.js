// ========================================
// PETCARE - HAYVANLARIM SAYFASI
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // Örnek hayvan bilgileri
    const pets = {
        Pamuk: {
            name: "Pamuk",
            type: "Kedi",
            age: "2 yaşında",
            avatar: "🐱",
            breed: null,
            gender: null,
            birthdate: null,
            weight: null,
            notes: null
        },
        Boncuk: {
            name: "Boncuk",
            type: "Köpek",
            age: "3 yaşında",
            avatar: "🐶",
            breed: null,
            gender: null,
            birthdate: null,
            weight: null,
            notes: null
        }
    };

    const dialog = document.getElementById("pet-profile-dialog");
    const closeButton = document.getElementById("pet-profile-close");
    const profileButtons = document.querySelectorAll(".pets-profile-btn");
    const editDialog = document.getElementById("pet-edit-dialog");
    const editCloseButton = document.getElementById("pet-edit-close");
    const editCancelButton = document.getElementById("pet-edit-cancel");
    const editButtons = document.querySelectorAll(".pets-edit-btn");
    const photoButtons = document.querySelectorAll(".pets-photo-btn");
    const deleteButtons = document.querySelectorAll(".pets-delete-btn");
    const editForm = document.getElementById("pet-edit-form");
    let editingPet = null;
    let editingCard = null;
    // Yeni hayvan ekleme elemanları
    const addButton = document.getElementById("pet-add-btn");
    const addDialog = document.getElementById("pet-add-dialog");
    const addCloseButton = document.getElementById("pet-add-close");
    const addCancelButton = document.getElementById("pet-add-cancel");
    const addForm = document.getElementById("pet-add-form");

    if (!dialog || !closeButton) return;

    // Profil penceresini aç
    function openPetProfile(pet) {
        document.getElementById("pet-profile-title").textContent =
            pet.name + " 🐾";

        const avatarContainer = document.getElementById("pet-profile-avatar");

        avatarContainer.replaceChildren();

        if (pet.photo) {
            const img = document.createElement("img");

            img.src = pet.photo;
            img.alt = pet.name + " profil fotoğrafı";
            img.className = "pet-uploaded-photo";

            avatarContainer.appendChild(img);
        } else {
            avatarContainer.textContent = pet.avatar;
        }

        document.getElementById("pet-profile-name").textContent =
            pet.name;

        document.getElementById("pet-profile-type").textContent =
            pet.type;

        document.getElementById("pet-profile-age").textContent =
            pet.age;
        document.getElementById("pet-profile-breed").textContent =
            pet.breed ?? "Belirtilmedi";

        document.getElementById("pet-profile-gender").textContent =
            pet.gender ?? "Belirtilmedi";

        document.getElementById("pet-profile-birthdate").textContent =
            pet.birthdate ?? "Belirtilmedi";

        document.getElementById("pet-profile-weight").textContent =
            pet.weight ?? "Belirtilmedi";

        document.getElementById("pet-profile-notes").textContent =
            pet.notes ?? "Belirtilmedi";

        dialog.showModal();
    }

    // Hayvan kartlarındaki butonlar
    profileButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const card = button.closest(".pets-profile-card");
            if (!card) return;

            const petName = card.querySelector(".pets-card-title h3")
                ?.textContent.trim();

            const pet = pets[petName];

            if (pet) {
                openPetProfile(pet);
            }
        });
    });

    // Kapatma butonu
    closeButton.addEventListener("click", function () {
        dialog.close();
    });

    // Pencerenin dışına tıklayınca kapat
    dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    // ========================================
// HAYVAN BİLGİLERİNİ DÜZENLEME
// ========================================

// Düzenleme penceresini aç
    editButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const card = button.closest(".pets-profile-card");
            if (!card) return;

            const petName = card.querySelector(".pets-card-title h3")
                ?.textContent.trim();

            const pet = pets[petName];
            if (!pet) return;
            editingPet = pet;
            editingCard = card;

            // Mevcut bilgileri forma doldur
            document.getElementById("pet-edit-name").value = pet.name;
            document.getElementById("pet-edit-type").value = pet.type;
            document.getElementById("pet-edit-breed").value = pet.breed ?? "";
            document.getElementById("pet-edit-gender").value = pet.gender ?? "";
            document.getElementById("pet-edit-birthdate").value = pet.birthdate ?? "";
            document.getElementById("pet-edit-weight").value = pet.weight ?? "";
            document.getElementById("pet-edit-notes").value = pet.notes ?? "";

            editDialog.showModal();
        });

    });

// Düzenleme penceresini kapat
    editCloseButton.addEventListener("click", function () {
        editDialog.close();
    });

// Vazgeç butonu
    editCancelButton.addEventListener("click", function () {
        editDialog.close();
    });

// Pencerenin dışına tıklayınca kapat
    editDialog.addEventListener("click", function (event) {
        if (event.target === editDialog) {
            editDialog.close();
        }
    });

    function calculatePetAge(birthdate) {
        if (!birthdate) return null;

        const today = new Date();
        const birth = new Date(birthdate + "T00:00:00");

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

// ========================================
// HAYVAN BİLGİLERİNİ KAYDET
// ========================================

    editForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!editingPet || !editingCard) return;

        const oldName = editingPet.name;
        const newName = document.getElementById("pet-edit-name").value.trim();
        const newType = document.getElementById("pet-edit-type").value;

        if (!newName) return;

        if (newName !== oldName && pets[newName]) {
            alert("Bu isimde başka bir hayvan zaten var.");
            return;
        }

        editingPet.name = newName;
        editingPet.type = newType;
        editingPet.breed = document.getElementById("pet-edit-breed").value.trim() || null;
        editingPet.gender = document.getElementById("pet-edit-gender").value || null;
        editingPet.birthdate = document.getElementById("pet-edit-birthdate").value || null;
        if (editingPet.birthdate) {
            const calculatedAge = calculatePetAge(editingPet.birthdate);

            if (calculatedAge) {
                editingPet.age = calculatedAge;
            }
        }
        editingPet.weight = document.getElementById("pet-edit-weight").value || null;
        editingPet.notes = document.getElementById("pet-edit-notes").value.trim() || null;

        const avatars = {
            Kedi: "🐱",
            Köpek: "🐶",
            Kuş: "🐦",
            Diğer: "🐾"
        };

        editingPet.avatar = avatars[newType] || "🐾";
        // Hayvanın türüne göre arka plan rengini güncelle
        const imageColors = {
            Kedi: "pets-cat-image",
            Köpek: "pets-dog-image",
            Kuş: "pets-bird-image",
            Diğer: "pets-other-image"
        };

        const imageContainer = editingCard.querySelector(".pets-card-image");

        imageContainer.classList.remove(
            "pets-cat-image",
            "pets-dog-image",
            "pets-bird-image",
            "pets-other-image"
        );

        imageContainer.classList.add(
            imageColors[newType] || "pets-other-image"
        );

        if (oldName !== newName) {
            delete pets[oldName];
            pets[newName] = editingPet;
        }

        editingCard.querySelector(".pets-card-title h3").textContent = newName;
        editingCard.querySelector(".pets-type-badge").textContent = newType;
        editingCard.querySelector(".pets-breed").textContent = editingPet.breed || newType;

        if (editingPet.photo) {
            const img = document.createElement("img");

            img.src = editingPet.photo;
            img.alt = editingPet.name + " profil fotoğrafı";
            img.className = "pet-uploaded-photo";

            imageContainer.replaceChildren(img);
        } else {
            const span = document.createElement("span");
            span.textContent = editingPet.avatar;

            imageContainer.replaceChildren(span);
        }
        editingCard.querySelector(".pets-details span").textContent =
            "🎂 " + editingPet.age;
        editDialog.close();
    });
    // ========================================
// HAYVAN PROFİL FOTOĞRAFI
// ========================================

    photoButtons.forEach(function (button) {

        const card = button.closest(".pets-profile-card");
        const fileInput = card.querySelector(".pets-photo-input");

        if (!fileInput) return;

        // Fotoğraf seçme penceresini aç
        button.addEventListener("click", function () {
            fileInput.click();
        });

        // Seçilen fotoğrafı göster
        fileInput.addEventListener("change", function () {

            const file = fileInput.files[0];
            if (!file) return;

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {
                alert("Lütfen JPG, PNG veya WebP formatında bir fotoğraf seçin.");
                fileInput.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Fotoğraf en fazla 5 MB olabilir.");
                fileInput.value = "";
                return;
            }

            const petName = card.querySelector(".pets-card-title h3")
                ?.textContent.trim();

            const pet = pets[petName];
            if (!pet) return;

            const reader = new FileReader();

            reader.onload = function (event) {
                const photoUrl = event.target.result;

                // Fotoğrafı örnek hayvan verisinde tut
                pet.photo = photoUrl;

                // Karttaki emojiyi fotoğrafla değiştir
                const imageContainer = card.querySelector(".pets-card-image");

                imageContainer.replaceChildren();

                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = pet.name + " profil fotoğrafı";
                img.className = "pet-uploaded-photo";

                imageContainer.appendChild(img);

                fileInput.value = "";
            };

            reader.readAsDataURL(file);
        });
    });
    // ========================================
// HAYVAN SİLME İŞLEMİ
// ========================================

    // ========================================
// HAYVAN SİLME İŞLEMİ
// ========================================

    const deleteDialog = document.getElementById("pet-delete-dialog");
    const deleteName = document.getElementById("pet-delete-name");
    const deleteCancel = document.getElementById("pet-delete-cancel");
    const deleteConfirm = document.getElementById("pet-delete-confirm");

    let petToDelete = null;
    let cardToDelete = null;

// Silme onay penceresini aç
    deleteButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const card = button.closest(".pets-profile-card");
            if (!card) return;

            const petName = card.querySelector(".pets-card-title h3")
                ?.textContent.trim();

            const pet = pets[petName];
            if (!pet) return;

            petToDelete = pet;
            cardToDelete = card;

            deleteName.textContent = pet.name;

            deleteDialog.showModal();
        });

    });

// Vazgeç butonu
    deleteCancel.addEventListener("click", function () {
        deleteDialog.close();
    });

// Silme işlemini onayla
    deleteConfirm.addEventListener("click", function () {

        if (!petToDelete || !cardToDelete) return;

        // Örnek verilerden kaldır
        delete pets[petToDelete.name];

        // Hayvan kartını kaldır
        cardToDelete.remove();

        deleteDialog.close();
    });

// Pencere kapandığında seçimi temizle
    deleteDialog.addEventListener("close", function () {
        petToDelete = null;
        cardToDelete = null;
    });

// Pencerenin dışına tıklayınca kapat
    deleteDialog.addEventListener("click", function (event) {
        if (event.target === deleteDialog) {
            deleteDialog.close();
        }
    });
    // ========================================
// YENİ HAYVAN EKLEME
// ========================================

// Yeni Hayvan Ekle butonu
    addButton.addEventListener("click", function () {
        addForm.reset();
        addDialog.showModal();
    });

// X butonu
    addCloseButton.addEventListener("click", function () {
        addDialog.close();
    });

// Vazgeç butonu
    addCancelButton.addEventListener("click", function () {
        addDialog.close();
    });

// Pencerenin dışına tıklayınca kapat
    addDialog.addEventListener("click", function (event) {
        if (event.target === addDialog) {
            addDialog.close();
        }
    });
    // ========================================
// YENİ HAYVAN KARTLARI İÇİN BUTON BAĞLANTILARI
// ========================================

    function setupNewPetCard(card) {

        // Profili Gör
        card.querySelector(".pets-profile-btn")
            .addEventListener("click", function () {

                const petName = card.querySelector(".pets-card-title h3")
                    .textContent.trim();

                const pet = pets[petName];

                if (pet) {
                    openPetProfile(pet);
                }
            });

        // Bilgileri Düzenle
        card.querySelector(".pets-edit-btn")
            .addEventListener("click", function () {

                const petName = card.querySelector(".pets-card-title h3")
                    .textContent.trim();

                const pet = pets[petName];
                if (!pet) return;

                editingPet = pet;
                editingCard = card;

                document.getElementById("pet-edit-name").value = pet.name;
                document.getElementById("pet-edit-type").value = pet.type;
                document.getElementById("pet-edit-breed").value = pet.breed ?? "";
                document.getElementById("pet-edit-gender").value = pet.gender ?? "";
                document.getElementById("pet-edit-birthdate").value = pet.birthdate ?? "";
                document.getElementById("pet-edit-weight").value = pet.weight ?? "";
                document.getElementById("pet-edit-notes").value = pet.notes ?? "";

                editDialog.showModal();
            });

        // Profil Fotoğrafı
        const photoButton = card.querySelector(".pets-photo-btn");
        const photoInput = card.querySelector(".pets-photo-input");

        photoButton.addEventListener("click", function () {
            photoInput.click();
        });

        photoInput.addEventListener("change", function () {

            const file = photoInput.files[0];
            if (!file) return;

            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

            if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
                alert("Lütfen en fazla 5 MB boyutunda JPG, PNG veya WebP fotoğraf seçin.");
                photoInput.value = "";
                return;
            }

            const petName = card.querySelector(".pets-card-title h3")
                .textContent.trim();

            const pet = pets[petName];
            if (!pet) return;

            const reader = new FileReader();

            reader.onload = function () {
                pet.photo = reader.result;

                const img = document.createElement("img");
                img.src = pet.photo;
                img.alt = pet.name + " profil fotoğrafı";
                img.className = "pet-uploaded-photo";

                card.querySelector(".pets-card-image").replaceChildren(img);
                photoInput.value = "";
            };

            reader.readAsDataURL(file);
        });

        // Hayvanı Sil
        card.querySelector(".pets-delete-btn")
            .addEventListener("click", function () {

                const petName = card.querySelector(".pets-card-title h3")
                    .textContent.trim();

                const pet = pets[petName];
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

    addForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("pet-add-name").value.trim();
        const type = document.getElementById("pet-add-type").value;

        if (!name || !type) return;

        // Aynı isimde hayvan eklenmesini önle
        if (pets[name]) {
            alert("Bu isimde bir hayvan zaten var.");
            return;
        }

        const avatars = {
            Kedi: "🐱",
            Köpek: "🐶",
            Kuş: "🐦",
            Diğer: "🐾"
        };

        const birthdate =
            document.getElementById("pet-add-birthdate").value || null;

        if (birthdate && !calculatePetAge(birthdate)) {
            alert("Lütfen geçerli bir doğum tarihi girin.");
            return;
        }

        const pet = {
            name: name,
            type: type,
            age: calculatePetAge(birthdate) || "Belirtilmedi",
            avatar: avatars[type] || "🐾",
            breed: document.getElementById("pet-add-breed").value.trim() || null,
            gender: document.getElementById("pet-add-gender").value || null,
            birthdate: birthdate,
            weight: document.getElementById("pet-add-weight").value || null,
            notes: document.getElementById("pet-add-notes").value.trim() || null,
            photo: null
        };

        // JavaScript verilerine ekle
        pets[name] = pet;

        // Yeni kartı oluştur
        const card = document.createElement("article");
        card.className = "pets-profile-card";
        // Hayvanın türüne göre görsel alanının rengini belirle
        const imageColors = {
            Kedi: "pets-cat-image",
            Köpek: "pets-dog-image",
            Kuş: "pets-bird-image",
            Diğer: "pets-other-image"
        };

        const imageColorClass = imageColors[pet.type] || "pets-other-image";

        card.innerHTML = `
        <div class="pets-card-image ${imageColorClass}">
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
                       accept="image/png,image/jpeg,image/webp"
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

        // Kartın bilgilerini doldur
        card.querySelector(".pets-card-title h3").textContent = pet.name;
        card.querySelector(".pets-type-badge").textContent = pet.type;
        card.querySelector(".pets-breed").textContent = pet.breed || pet.type;
        card.querySelector(".pets-details span").textContent = "🎂 " + pet.age;
        card.querySelector(".pets-card-image span").textContent = pet.avatar;

        // Yeni kartın butonlarını çalıştır
        setupNewPetCard(card);

        // Kartı sayfaya ekle
        document.querySelector(".pets-grid").appendChild(card);

        // Formu kapat
        addDialog.close();
        addForm.reset();
    });
});
