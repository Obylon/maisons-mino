package com.mino.dto;

import com.mino.model.Professionnel;

public class ProfessionnelDtos {

    public record ProfessionnelProfilResponse(
            Professionnel.Specialite specialite,
            String statutConventionnement
    ) {}

    /**
     * Permet a un professionnel de corriger sa specialite ou son statut de
     * conventionnement apres la creation du compte (erreur de saisie de la
     * coordinatrice, ou information manquante au depart).
     */
    public record ProfessionnelProfilRequest(
            Professionnel.Specialite specialite,
            String statutConventionnement
    ) {}
}
