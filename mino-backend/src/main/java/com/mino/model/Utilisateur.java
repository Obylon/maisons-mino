package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Table de base commune aux 4 profils (MAMAN, PARTENAIRE, PROFESSIONNEL, COORDINATRICE).
 * Les entités de rôle (Maman, Partenaire, Professionnel) référencent cet utilisateur en 1:1.
 * La Coordinatrice n'a pas de table d'extension : son rôle suffit à lui donner l'accès admin.
 */
@Entity
@Table(name = "utilisateur")
@Getter
@Setter
@NoArgsConstructor
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "mot_de_passe_hash", nullable = false)
    private String motDePasseHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String nom;
    private String prenom;
    private String telephone;

    @Column(name = "date_creation_compte", nullable = false, updatable = false)
    private LocalDateTime dateCreationCompte = LocalDateTime.now();

    @Column(nullable = false)
    private boolean actif = true;
}
