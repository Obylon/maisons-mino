package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Compte-rendu d'atelier redige par le professionnel. Visible uniquement par lui-meme
 * et la coordinatrice - jamais par la maman (decision produit, voir mockup).
 * PAS de @Lob sur les champs texte - piege deja rencontre sur Message.reponses et
 * QuestionnairePromPrem.reponses (Large Objects incompatibles avec le driver PostgreSQL
 * en mode auto-commit). Un simple @Column(columnDefinition = "TEXT") suffit.
 *
 * "contenu" est deprecie au profit des 3 champs structures ci-dessous (deroule,
 * pointsAttention, suiviRecommande) - conserve nullable pour ne pas perdre les
 * comptes-rendus deja rediges avant cette evolution.
 */
@Entity
@Table(name = "compte_rendu")
@Getter
@Setter
@NoArgsConstructor
public class CompteRendu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atelier_id", nullable = false)
    private Atelier atelier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professionnel_id", nullable = false)
    private Professionnel professionnel;

    @Column(name = "contenu", columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "deroule", columnDefinition = "TEXT")
    private String deroule;

    @Column(name = "points_attention", columnDefinition = "TEXT")
    private String pointsAttention;

    @Column(name = "suivi_recommande", columnDefinition = "TEXT")
    private String suiviRecommande;

    @Column(name = "date_redaction", nullable = false)
    private LocalDateTime dateRedaction;
}