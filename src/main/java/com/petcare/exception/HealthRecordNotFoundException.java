package com.petcare.exception;

public class HealthRecordNotFoundException extends RuntimeException {

    public HealthRecordNotFoundException(String message) {
        super(message);
    }
}