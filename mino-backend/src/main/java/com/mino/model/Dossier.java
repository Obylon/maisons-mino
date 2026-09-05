package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Dossier archive - resume de toute l'activite d'une personne (maman, partenaire,
 * professionnel, coordinatrice), independant de son compte utilisateur.
 *
 * Aucune FK vers Utilisateur : "utilisateurIdOrigine" est juste une copie de
 * l'id au moment de la generation, a titre indicatif - le dossier doit pouvoir
 * survivre a la suppression du compte (voir DossierService et InscriptionController.supprimer).
 *
 * PAS de @Lob sur contenu - piege deja rencontre 2 fois dans ce projet
 * (Message.contenu, QuestionnairePromPrem.reponses) : @Lob + PostgreSQL =
 * "Large Objects should not be used in auto-commit mode". Un simple TEXT suffit.
 */
@Entity
@Table(name = "dossier")
@Getter
@Setter
@NoArgsConstructor
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "utilisateur_id_origine")
    private String utilisateurIdOrigine;

    @Column(name = "email")
    private String email;

    @Column(name = "nom")
    private String nom;

    @Column(name = "prenom")
    private String prenom;

    @Column(name = "role")
    private String role;

    @Column(name = "compte_supprime", nullable = false)
    private boolean compteSupprime = false;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_derniere_maj", nullable = false)
    private LocalDateTime dateDerniereMaj;

    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    private String contenu;
}
