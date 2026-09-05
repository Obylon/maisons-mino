package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class MessageDtos {

    public record MessageRequest(
            @NotBlank String contenu
    ) {}

    public record MessageResponse(
            String id,
            String expediteurId,
            String expediteurNom,
            String contenu,
            LocalDateTime dateEnvoi
    ) {}
}
