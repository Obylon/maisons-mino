package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class QuestionnaireDtos {

    public record QuestionnaireRequest(
            @NotBlank String type,
            String phase,
            @NotBlank String reponses
    ) {}

    public record QuestionnaireResponse(
            String id,
            String mamanId,
            String type,
            String phase,
            LocalDateTime dateSoumission,
            String reponses
    ) {}

    /** Vue liste globale - reservee COORDINATRICE (rapport d'impact annuel, relances). */
    public record QuestionnaireAdminResponse(
            String id,
            String mamanId,
            String mamanNom,
            String mamanPrenom,
            String type,
            String phase,
            LocalDateTime dateSoumission
    ) {}

    public record ModeleRequest(
            @NotBlank String nom,
            String description
    ) {}

    public record ModeleResponse(
            String id,
            String nom,
            String description,
            boolean actif
    ) {}

    public record QuestionRequest(
            @NotBlank String texte,
            @NotBlank String type, // TEXTE_LIBRE, CHOIX_UNIQUE, ECHELLE_1_10
            String options, // liste separee par virgules, uniquement pour CHOIX_UNIQUE
            int ordre
    ) {}

    public record QuestionResponse(
            String id,
            String texte,
            String type,
            String options,
            int ordre
    ) {}
}
