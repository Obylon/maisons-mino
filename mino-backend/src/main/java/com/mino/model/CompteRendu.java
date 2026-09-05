package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Compte-rendu d'atelier redige par le professionnel. Visible uniquement par lui-meme
 * et la coordinatrice - jamais par la maman (decision produit, voir mockup).
 * PAS de @Lob sur contenu - piege deja rencontre sur Message.reponses et
 * QuestionnairePromPrem.reponses (Large Objects incompatibles avec le driver PostgreSQL
 * en mode auto-commit). Un simple @Column(columnDefinition = "TEXT") suffit.
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

    @Column(name = "contenu", nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "date_redaction", nullable = false)
    private LocalDateTime dateRedaction;
}
