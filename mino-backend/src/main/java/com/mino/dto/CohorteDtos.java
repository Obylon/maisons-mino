package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class CohorteDtos {

    public record CohorteRequest(
            @NotBlank String nom,
            String ville,
            LocalDate dateDebut,
            LocalDate dateFin
    ) {}

    public record CohorteResponse(
            String id,
            String nom,
            String ville,
            LocalDate dateDebut,
            LocalDate dateFin
    ) {}

    /** Une maman de la cohorte qui n'a pas encore de groupe assigne. */
    public record MamanEnAttenteResponse(
            String mamanId,
            String utilisateurId,
            String nom,
            String prenom,
            LocalDate dateTermeGrossesse,
            LocalDate dateEntreeParcours
    ) {}
}
