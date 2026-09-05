package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class CompteRenduDtos {

    public record CompteRenduRequest(
            @NotBlank String atelierId,
            @NotBlank String contenu
    ) {}

    public record CompteRenduResponse(
            String id,
            String atelierId,
            String atelierTitre,
            LocalDateTime dateRedaction,
            String contenu
    ) {}
}
