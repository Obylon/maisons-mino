package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "professionnel")
@Getter
@Setter
@NoArgsConstructor
public class Professionnel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Specialite specialite;

    @Column(name = "statut_conventionnement")
    private String statutConventionnement;

    public enum Specialite {
        KINESITHERAPEUTE, SAGE_FEMME, PSYCHOLOGUE, SEXOTHERAPEUTE, DIETETICIENNE
    }
}
