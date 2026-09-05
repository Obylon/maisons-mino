package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inscription_atelier", uniqueConstraints = @UniqueConstraint(columnNames = {"atelier_id", "utilisateur_id"}))
@Getter
@Setter
@NoArgsConstructor
public class InscriptionAtelier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atelier_id", nullable = false)
    private Atelier atelier;

    /** Maman ou Partenaire selon le type d'atelier. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_presence")
    private StatutPresence statutPresence = StatutPresence.INSCRIT;

    public enum StatutPresence {
        INSCRIT, PRESENT, ABSENT
    }
}
