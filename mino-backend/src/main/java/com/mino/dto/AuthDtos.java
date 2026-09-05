package com.mino.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String motDePasse
    ) {}

    public record LoginResponse(
            String token,
            String role,
            String utilisateurId,
            String email,
            String nom,
            String prenom,
            String telephone
    ) {}

    public record MotDePasseOublieRequest(
            @NotBlank @Email String email
    ) {}

    public record ChangerMotDePasseRequest(
            @NotBlank String ancienMotDePasse,
            @NotBlank String nouveauMotDePasse
    ) {}

    /** Champs communs aux 4 roles, modifiables par la personne elle-meme depuis son profil. */
    public record ProfilRequest(
            @NotBlank String nom,
            @NotBlank String prenom,
            String telephone
    ) {}
}