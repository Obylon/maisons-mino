package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Modele de questionnaire (ex: PROM, PREM, ou tout autre questionnaire cree par
 * la coordinatrice - satisfaction atelier, bilan post-natal, etc). PROM et PREM
 * sont crees par defaut (voir migration 016), pas de logique speciale codee en dur
 * pour eux - ce sont juste les deux premiers modeles.
 */
@Entity
@Table(name = "questionnaire_modele")
@Getter
@Setter
@NoArgsConstructor
public class QuestionnaireModele {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "nom", nullable = false, unique = true)
    private String nom;

    @Column(name = "description")
    private String description;

    @Column(name = "actif", nullable = false)
    private boolean actif = true;
}
