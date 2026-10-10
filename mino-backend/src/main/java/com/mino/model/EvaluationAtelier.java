package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Evaluation d'un atelier par une maman qui y a assiste. Une seule evaluation
 * par (atelier, maman) - voir contrainte unique en base. Notes sur 5, l'une
 * pour le fond de l'atelier, l'autre pour le professionnel qui l'a anime.
 */
@Entity
@Table(name = "evaluation_atelier")
@Getter
@Setter
@NoArgsConstructor
public class EvaluationAtelier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atelier_id", nullable = false)
    private Atelier atelier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maman_id", nullable = false)
    private Maman maman;

    @Column(name = "note_atelier", nullable = false)
    private int noteAtelier;

    @Column(name = "note_professionnel", nullable = false)
    private int noteProfessionnel;

    @Column(name = "commentaire", columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "date_soumission", nullable = false)
    private LocalDateTime dateSoumission;
}
