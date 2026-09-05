package com.mino.dto;

import com.mino.model.Professionnel;
import com.mino.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTOs pour la creation d'un compte par la coordinatrice (POST /api/admin/utilisateurs).
 * Un seul DTO de requete couvre les 4 roles : les champs specifiques a chaque role
 * sont optionnels au niveau annotation, et valides manuellement dans le controleur
 * selon le role choisi (voir InscriptionController).
 */
public class InscriptionDtos {

    public record InscriptionRequest(
            @NotBlank @Email String email,
            @NotBlank String nom,
            @NotBlank String prenom,
            String telephone,
            @NotNull Role role,

            // --- Champs specifiques MAMAN (requis si role = MAMAN) ---
            String cohorteId,
            String groupeId,
            LocalDate dateTermeGrossesse,
            LocalDate dateNaissanceBebe,
            LocalDate dateEntreeParcours,
            LocalDate dateSortiePrevue,

            // --- Champs specifiques PARTENAIRE (optionnels) ---
            String mamanId,

            // --- Champs specifiques PROFESSIONNEL (requis si role = PROFESSIONNEL) ---
            Professionnel.Specialite specialite,
            String statutConventionnement
    ) {}

    public record InscriptionResponse(
            String utilisateurId,
            String email,
            Role role,
            String motDePasseTemporaire
    ) {}

    /** Vue liste - jamais de mot de passe ni de hash exposes ici. */
    public record UtilisateurResume(
            String id,
            String email,
            Role role,
            String nom,
            String prenom,
            boolean actif
    ) {}

    /** Utilisee pour choisir a quelle maman lier un compte PARTENAIRE (id = Maman.id, pas Utilisateur.id). */
    public record MamanResume(
            String mamanId,
            String nom,
            String prenom
    ) {}

    /** Utilisee pour choisir un professionnel (id = Professionnel.id, pas Utilisateur.id). */
    public record ProfessionnelResume(
            String professionnelId,
            String nom,
            String prenom,
            String specialite
    ) {}
}
