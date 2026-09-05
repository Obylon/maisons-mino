package com.mino.dto;

import java.time.LocalDate;

public class ParcoursDtos {

    /**
     * semaineGrossesse et ageBebeJours sont mutuellement exclusifs : l'un des deux
     * est toujours null selon que le bebe est deja ne ou non (dateNaissanceBebe).
     */
    public record ParcoursResponse(
            LocalDate dateEntreeParcours,
            LocalDate dateSortiePrevue,
            LocalDate dateTermeGrossesse,
            LocalDate dateNaissanceBebe,
            Integer semaineGrossesse,
            Integer ageBebeJours
    ) {}

    /**
     * Seules dateTermeGrossesse et dateNaissanceBebe sont modifiables par la maman
     * elle-meme (corriger une erreur, ou completer une info manquante a la creation
     * du compte). dateEntreeParcours et dateSortiePrevue restent administratives,
     * definies par la coordinatrice - elles delimitent le parcours officiel de 14 mois.
     */
    public record ParcoursUpdateRequest(
            LocalDate dateTermeGrossesse,
            LocalDate dateNaissanceBebe
    ) {}
}