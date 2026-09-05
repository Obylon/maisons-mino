package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "atelier")
@Getter
@Setter
@NoArgsConstructor
public class Atelier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAtelier type;

    @Column(name = "date_heure")
    private LocalDateTime dateHeure;

    @Column(name = "duree_minutes")
    private Integer dureeMinutes = 120; // format standard : 30 min libre + 1h pro + 30 min libre

    @Column(name = "rappel_envoye", nullable = false)
    private boolean rappelEnvoye = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professionnel_id")
    private Professionnel professionnel;

    /** Nullable : un atelier P1/P2 (partenaire) n'est pas forcément rattaché à un groupe de femmes. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;

    public enum TypeAtelier {
        MENSUEL_STANDARD, P1_GROSSESSE_PARTENAIRE, P2_POSTPARTUM_PARTENAIRE, SEANCE_INDIVIDUELLE_S0
    }
}
