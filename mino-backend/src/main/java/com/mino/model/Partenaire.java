package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * IMPORTANT — Isolation validée dans le modèle de données :
 * Le champ mamanId ci-dessous est un identifiant BRUT (pas une relation JPA @ManyToOne
 * vers Maman), volontairement. Il sert uniquement à la logistique et à la facturation
 * (ex : facturation du foyer). Aucune navigation objet ne doit permettre à un Partenaire
 * d'accéder aux données de la Maman (Groupe, Message, Questionnaire_PROM_PREM).
 *
 * Les règles Spring Security (voir SecurityConfig) doivent interdire explicitement
 * toute requête d'un compte PARTENAIRE vers ces ressources, quelle que soit la route appelée.
 */
@Entity
@Table(name = "partenaire")
@Getter
@Setter
@NoArgsConstructor
public class Partenaire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    /** Lien administratif / facturation uniquement — volontairement pas une relation JPA navigable. */
    @Column(name = "maman_id")
    private String mamanId;

    @Column(name = "lien_administratif_uniquement", nullable = false)
    private boolean lienAdministratifUniquement = true;
}
