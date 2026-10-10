package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ressource")
@Getter
@Setter
@NoArgsConstructor
public class Ressource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 100)
    private String categorie;

    @Column(length = 500)
    private String url;

    @Column(columnDefinition = "text")
    private String contenu;

    @Column(name = "date_publication", nullable = false)
    private LocalDateTime datePublication;

    @Column(nullable = false)
    private boolean publiee = true;

    // ── Pièce jointe (optionnelle) ─────────────────────────────────────────────

    /** Indicateur rapide — pas besoin de charger le blob pour le listage. */
    @Column(name = "has_fichier", nullable = false)
    private boolean hasFichier = false;

    @Column(name = "nom_fichier", length = 255)
    private String nomFichier;

    @Column(name = "type_fichier", length = 100)
    private String typeFichier;

    @Column(name = "fichier_data")
    private byte[] fichierData;
}
