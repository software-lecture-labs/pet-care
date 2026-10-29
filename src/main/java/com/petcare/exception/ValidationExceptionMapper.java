package com.petcare.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.Map;
import java.util.stream.Collectors;

@Provider
public class ValidationExceptionMapper
        implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException exception) {

        String message = exception.getConstraintViolations()
                .stream()
                .map(violation -> {

                    String fieldName = "";

                    for (Path.Node node : violation.getPropertyPath()) {
                        if (node.getKind() == jakarta.validation.ElementKind.PROPERTY
                                || node.getKind() == jakarta.validation.ElementKind.PARAMETER) {
                            fieldName = node.getName();
                        }
                    }

                    if (fieldName == null || fieldName.isBlank()) {
                        return violation.getMessage();
                    }

                    return fieldName + ": " + violation.getMessage();
                })
                .distinct()
                .sorted()
                .collect(Collectors.joining(", "));

        if (message.isBlank()) {
            message = "Gönderilen bilgiler geçersiz.";
        }

        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("message", message))
                .build();
    }
}