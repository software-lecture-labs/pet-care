package com.petcare.exception;

public class AppointmentSlotConflictException extends RuntimeException {

    public AppointmentSlotConflictException(String message) {
        super(message);
    }

    public AppointmentSlotConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}