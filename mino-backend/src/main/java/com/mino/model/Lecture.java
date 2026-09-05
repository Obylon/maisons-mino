package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Suivi de derniere lecture par utilisateur et par fil de discussion (groupe_id
 * ou conversation_id, indifferemment stocke dans "cle"). Permet de calculer un
 * vrai nombre de messages non lus, plutot que le nombre total de messages.
 */
@Entity
@Table(name = "lecture")
@Getter
@Setter
@NoArgsConstructor
public class Lecture {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "cle", nullable = false)
    private String cle;

    @Column(name = "date_lecture", nullable = false)
    private LocalDateTime dateLecture;
}
