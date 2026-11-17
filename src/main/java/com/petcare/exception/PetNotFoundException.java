package com.petcare.exception;

public class PetNotFoundException extends RuntimeException {

    public PetNotFoundException(String message) {
        super(message);
    }
}