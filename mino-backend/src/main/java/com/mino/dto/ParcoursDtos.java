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
}
