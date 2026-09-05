package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Le "groupe de 5 femmes" - l'effet village.
 * Un groupe contient 5 mamans (1:N depuis Groupe) ; chaque maman appartient à un seul groupe.
 */
@Entity
@Table(name = "groupe")
@Getter
@Setter
@NoArgsConstructor
public class Groupe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cohorte_id", nullable = false)
    private Cohorte cohorte;

    @Column(name = "date_constitution")
    private LocalDate dateConstitution;

    /** Nom libre donne par la coordinatrice (ex: "Groupe A") - optionnel, purement organisationnel. */
    @Column(name = "nom")
    private String nom;

    @OneToMany(mappedBy = "groupe")
    private Set<Maman> mamans = new HashSet<>();

    /** Le groupe est pensé pour accueillir 5 mamans - à faire respecter côté service métier. */
    public static final int TAILLE_CIBLE = 5;
}
