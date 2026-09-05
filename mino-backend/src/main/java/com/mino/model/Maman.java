package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "maman")
@Getter
@Setter
@NoArgsConstructor
public class Maman {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    @Column(name = "date_terme_grossesse")
    private LocalDate dateTermeGrossesse;

    @Column(name = "date_naissance_bebe")
    private LocalDate dateNaissanceBebe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cohorte_id")
    private Cohorte cohorte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;

    @Column(name = "date_entree_parcours")
    private LocalDate dateEntreeParcours; // M-4, 6e mois de grossesse

    @Column(name = "date_sortie_prevue")
    private LocalDate dateSortiePrevue; // 10 mois du bébé
}
