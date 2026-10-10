package com.mino.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class RessourceDtos {

    public record RessourceRequest(
            @NotBlank @Size(max = 200) String titre,
            String description,
            @NotBlank @Size(max = 100) String categorie,
            @Size(max = 500) String url,
            String contenu,
            boolean publiee
    ) {}

    public record RessourceResponse(
            String id,
            String titre,
            String description,
            String categorie,
            String url,
            String contenu,
            LocalDateTime datePublication,
            boolean publiee,
            boolean hasFichier,
            String nomFichier,
            String typeFichier
    ) {}
}
