package com.mino.dto;

import com.mino.model.Atelier.TypeAtelier;
import com.mino.model.InscriptionAtelier.StatutPresence;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class AtelierDtos {

    public record AtelierRequest(
            String titre,
            @NotNull TypeAtelier type,
            LocalDateTime dateHeure,
            Integer dureeMinutes,
            String professionnelId,
            String groupeId
    ) {}

    public record AtelierResponse(
            String id,
            String titre,
            TypeAtelier type,
            LocalDateTime dateHeure,
            Integer dureeMinutes,
            String professionnelId,
            String professionnelNom,
            String groupeId,
            String groupeNom
    ) {}

    public record CalendrierAtelierResponse(
            String id,
            String titre,
            TypeAtelier type,
            java.time.LocalDateTime dateHeure,
            Integer dureeMinutes,
            String professionnelNom,
            boolean inscrite
    ) {}

    public record InscriptionResponse(
            String id,
            String atelierId,
            String utilisateurId,
            String utilisateurNom,
            StatutPresence statutPresence
    ) {}
}