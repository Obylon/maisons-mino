package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Une question d'un modele de questionnaire (voir QuestionnaireModele).
 * "options" n'est renseigne que pour le type CHOIX_UNIQUE : liste de choix
 * separes par des virgules (ex: "Tres bien,Bien,Moyen,Mauvais"). Simplification
 * volontaire - pas de table enfant dediee aux options, vu le nombre limite de
 * choix attendus par question.
 */
@Entity
@Table(name = "question_modele")
@Getter
@Setter
@NoArgsConstructor
public class QuestionModele {

    public enum TypeQuestion {
        TEXTE_LIBRE,
        CHOIX_UNIQUE,
        ECHELLE_1_10
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modele_id", nullable = false)
    private QuestionnaireModele modele;

    @Column(name = "texte", nullable = false)
    private String texte;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TypeQuestion type;

    @Column(name = "options")
    private String options;

    @Column(name = "ordre", nullable = false)
    private int ordre = 0;
}
