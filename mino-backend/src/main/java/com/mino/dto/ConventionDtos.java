package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ConventionDtos {

    public record ConventionRequest(
            @NotBlank String professionnelId,
            BigDecimal tarif,
            String statut,
            LocalDate dateSignature
    ) {}

    public record ConventionResponse(
            String id,
            String professionnelId,
            String professionnelNom,
            BigDecimal tarif,
            String statut,
            LocalDate dateSignature
    ) {}
}
