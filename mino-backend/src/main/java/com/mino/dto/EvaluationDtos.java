package com.mino.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class EvaluationDtos {

    public record EvaluationRequest(
            @NotBlank String atelierId,
            @Min(1) @Max(5) int noteAtelier,
            @Min(1) @Max(5) int noteProfessionnel,
            String commentaire
    ) {}

    public record EvaluationResponse(
            String id,
            String atelierId,
            String atelierTitre,
            int noteAtelier,
            int noteProfessionnel,
            String commentaire,
            LocalDateTime dateSoumission
    ) {}

    /** Moyennes d'un atelier - volontairement sans aucune identite de maman (evaluations anonymes). */
    public record EvaluationSyntheseResponse(
            String atelierId,
            String atelierTitre,
            LocalDateTime dateHeure,
            String professionnelId,
            String professionnelNom,
            int nombreEvaluations,
            double moyenneAtelier,
            double moyenneProfessionnel
    ) {}

    /** Atelier auquel la maman a assiste mais qu'elle n'a pas encore evalue. */
    public record AtelierAEvaluerResponse(
            String atelierId,
            String atelierTitre,
            String professionnelNom,
            LocalDateTime dateHeure
    ) {}
}