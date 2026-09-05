package com.mino.dto;

import java.time.LocalDateTime;

public class DossierDtos {

    /** Vue liste - sans le contenu complet, pour ne pas alourdir la liste. */
    public record DossierResume(
            String id,
            String nom,
            String prenom,
            String email,
            String role,
            boolean compteSupprime,
            LocalDateTime dateDerniereMaj
    ) {}

    public record DossierDetail(
            String id,
            String nom,
            String prenom,
            String email,
            String role,
            boolean compteSupprime,
            LocalDateTime dateCreation,
            LocalDateTime dateDerniereMaj,
            String contenu
    ) {}
}
