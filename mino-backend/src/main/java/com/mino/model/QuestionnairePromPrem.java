package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Strictement lié à Maman — jamais à Partenaire (voir document Modèle de données, section isolation).
 * Accès en lecture : MAMAN (le sien), PROFESSIONNEL (si suivi), COORDINATRICE (admin).
 *
 * "type" et "phase" sont des chaines libres depuis la migration 016 - avant, ils
 * etaient limites aux enums PROM/PREM et T0-T4. Desormais n'importe quel modele
 * cree via QuestionnaireModele peut etre utilise comme "type" (voir QuestionnaireController).
 * "phase" reste utile pour PROM/PREM (T0..T4) mais est optionnel pour les autres
 * questionnaires qui n'ont pas cette notion.
 */
@Entity
@Table(name = "questionnaire_prom_prem")
@Getter
@Setter
@NoArgsConstructor
public class QuestionnairePromPrem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maman_id", nullable = false)
    private Maman maman;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "phase")
    private String phase;

    @Column(name = "date_soumission")
    private LocalDateTime dateSoumission;

    // PAS de @Lob ici - piege deja rencontre 2 fois dans ce projet (Message.contenu,
    // et ce meme champ avant correction) : @Lob + PostgreSQL = "Large Objects should
    // not be used in auto-commit mode". Un simple TEXT suffit.
    @Column(columnDefinition = "TEXT")
    private String reponses; // JSON sérialisé des réponses
}
