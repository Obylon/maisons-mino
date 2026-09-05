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
            String prenom
    ) {}

    public record MotDePasseOublieRequest(
            @NotBlank @Email String email
    ) {}

    public record ChangerMotDePasseRequest(
            @NotBlank String ancienMotDePasse,
            @NotBlank String nouveauMotDePasse
    ) {}
}
