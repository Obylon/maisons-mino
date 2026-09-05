package com.mino.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public class GroupeDtos {

    public record GroupeRequest(
            @NotBlank String cohorteId,
            String nom,
            LocalDate dateConstitution
    ) {}

    /**
     * Constitution en une fois : cree le groupe ET affecte directement les mamans
     * selectionnees, au lieu de creer un groupe vide puis d'affecter une maman a la fois.
     */
    public record ConstituerGroupeRequest(
            @NotBlank String cohorteId,
            String nom,
            LocalDate dateConstitution,
            List<String> mamanIds
    ) {}

    /** Ajout d'une maman a un groupe DEJA EXISTANT (au lieu d'en creer un nouveau a chaque fois). */
    public record AjouterMamanRequest(
            @NotBlank String mamanId
    ) {}

    /** Vue admin - utilisee par la COORDINATRICE (creation, liste, detail). */
    public record GroupeResponse(
            String id,
            String cohorteId,
            String cohorteNom,
            String nom,
            LocalDate dateConstitution,
            int tailleActuelle,
            int tailleCible
    ) {}

    /**
     * Vue "mon groupe" - utilisee par une MAMAN pour voir son propre groupe.
     * Ne remonte que le prenom des autres membres (effet village), jamais
     * leurs donnees de sante (voir isolation stricte documentee sur QuestionnairePromPrem).
     */
    public record GroupeDetailResponse(
            String id,
            String nom,
            LocalDate dateConstitution,
            List<MembreDto> membres
    ) {}

    public record MembreDto(
            String mamanId,
            String utilisateurId,
            String prenom
    ) {}
}
