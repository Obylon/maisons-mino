package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Séparation stricte : une conversation d'un compte PARTENAIRE ne doit jamais
 * référencer un groupe_id de type "groupe femmes" — à faire respecter au niveau service.
 */
@Entity
@Table(name = "message")
@Getter
@Setter
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Renseigné pour la messagerie du groupe de 5 ; null pour une conversation 1-to-1. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id")
    private Groupe groupe;

    /** Renseigné pour une conversation 1-to-1 (ex : avec la coordinatrice) ; null pour le fil de groupe. */
    @Column(name = "conversation_id")
    private String conversationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Utilisateur expediteur;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi = LocalDateTime.now();
}
