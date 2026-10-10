package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public class CompteRenduDtos {

    public record PresenceRequest(
            @NotBlank String utilisateurId,
            @NotBlank String statutPresence // "PRESENT" ou "ABSENT"
    ) {}

    public record CompteRenduRequest(
            @NotBlank String atelierId,
            String deroule,
            String pointsAttention,
            String suiviRecommande,
            List<PresenceRequest> presences // optionnel - mise a jour de la presence des inscrits
    ) {}

    public record PresenceResponse(
            String utilisateurId,
            String prenom,
            String nom,
            String statutPresence
    ) {}

    public record CompteRenduResponse(
            String id,
            String atelierId,
            String atelierTitre,
            String professionnelNom,
            LocalDateTime dateRedaction,
            String deroule,
            String pointsAttention,
            String suiviRecommande,
            List<PresenceResponse> presences
    ) {}
}