package com.mino.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Format unique de reponse d'erreur pour toute l'API - retourne par GlobalExceptionHandler.
 * fieldErrors n'est renseigne que pour les erreurs de validation (@Valid sur les DTOs).
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
    public ErrorResponse(int status, String error, String message, String path) {
        this(LocalDateTime.now(), status, error, message, path, null);
    }

    public ErrorResponse(int status, String error, String message, String path, Map<String, String> fieldErrors) {
        this(LocalDateTime.now(), status, error, message, path, fieldErrors);
    }
}
