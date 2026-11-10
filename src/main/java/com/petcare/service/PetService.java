
package com.petcare.service;

import com.petcare.entity.Pet;
import com.petcare.entity.User;
import com.petcare.repository.PetRepository;
import com.petcare.repository.UserRepository;
import com.petcare.exception.PetNotFoundException;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class PetService {

    @Inject
    private PetRepository petRepository;

    @Inject
    private UserRepository userRepository;

    // Kullanıcının hayvanlarını listele
    public List<Pet> getPetsByUser(Long userId) {
        validateUserId(userId);
        return petRepository.findByUserId(userId);
    }

    // Kullanıcıya ait hayvanın bilgilerini getir
    public Pet getPet(Long userId, Long petId) {
        validateUserId(userId);

        if (petId == null) {
            throw new IllegalArgumentException(
                    "Hayvan ID bilgisi gereklidir."
            );
        }

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new PetNotFoundException(
                        "Hayvan bulunamadı."
                ));

        if (!pet.getUser().getId().equals(userId)) {
            throw new PetNotFoundException(
                    "Hayvan bulunamadı."
            );
        }

        return pet;
    }

    // Yeni hayvan ekle
    @Transactional
    public Pet addPet(Long userId, Pet pet) {
        validateUserId(userId);

        if (pet == null) {
            throw new IllegalArgumentException(
                    "Hayvan bilgileri gereklidir."
            );
        }

        validatePet(pet);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Kullanıcı bulunamadı."
                ));

        pet.setUser(user);
        petRepository.save(pet);

        return pet;
    }

    // Hayvan bilgilerini güncelle
    @Transactional
    public Pet updatePet(Long userId, Long petId, Pet updatedPet) {
        Pet pet = getPet(userId, petId);

        if (updatedPet == null) {
            throw new IllegalArgumentException(
                    "Güncellenecek bilgiler gereklidir."
            );
        }

        validatePet(updatedPet);

        pet.setName(updatedPet.getName().trim());
        pet.setType(updatedPet.getType().trim());
        pet.setBreed(updatedPet.getBreed());
        pet.setGender(updatedPet.getGender());
        pet.setBirthDate(updatedPet.getBirthDate());
        pet.setWeight(updatedPet.getWeight());
        pet.setNotes(updatedPet.getNotes());

        return petRepository.update(pet);
    }

    // Hayvanı sil
    @Transactional
    public void deletePet(Long userId, Long petId) {
        Pet pet = getPet(userId, petId);
        petRepository.delete(pet);
    }

    // Hayvanın profil fotoğrafı yolunu güncelle
    @Transactional
    public Pet updatePetPhoto(Long userId, Long petId, String photoPath) {

        // Hayvanın giriş yapan kullanıcıya ait olduğunu doğrula
        Pet pet = getPet(userId, petId);

        if (photoPath == null || photoPath.isBlank()) {
            throw new IllegalArgumentException(
                    "Fotoğraf yolu boş olamaz."
            );
        }

        // PostgreSQL'deki photo_path alanını güncelle
        pet.setPhotoPath(photoPath);

        return petRepository.update(pet);
    }

    // Kullanıcı ID kontrolü
    private void validateUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException(
                    "Geçersiz kullanıcı bilgisi."
            );
        }
    }

    // Temel hayvan bilgilerini doğrula
    private void validatePet(Pet pet) {
        if (pet.getName() == null ||
                pet.getName().isBlank() ||
                pet.getName().trim().length() > 100) {
            throw new IllegalArgumentException(
                    "Hayvan adı 1-100 karakter arasında olmalıdır."
            );
        }

        if (pet.getType() == null ||
                pet.getType().isBlank() ||
                pet.getType().trim().length() > 30) {
            throw new IllegalArgumentException(
                    "Geçerli bir hayvan türü girin."
            );
        }

        if (pet.getWeight() != null &&
                pet.getWeight().signum() <= 0) {
            throw new IllegalArgumentException(
                    "Hayvanın kilosu sıfırdan büyük olmalıdır."
            );
        }
    }
}
