package com.mino.controller;

import com.mino.model.Atelier;
import com.mino.model.Professionnel;
import com.mino.model.Utilisateur;
import com.mino.repository.AtelierRepository;
import com.mino.repository.ProfessionnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exemple de contrôleur illustrant le pattern d'isolation défini dans le modèle de données :
 * un PROFESSIONNEL ne voit jamais la liste complète des ateliers, uniquement les siens.
 * Le filtrage se fait ici côté service (via professionnel_id), pas seulement côté route,
 * pour éviter tout accès transverse même en cas d'erreur de paramétrage d'URL.
 */
@RestController
@RequestMapping("/api/ateliers")
@RequiredArgsConstructor
public class AtelierController {

    private final AtelierRepository atelierRepository;
    private final ProfessionnelRepository professionnelRepository;

    @GetMapping("/mes-ateliers")
    @PreAuthorize("hasRole('PROFESSIONNEL')")
    public ResponseEntity<List<Atelier>> mesAteliers(@AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Professionnel professionnel = professionnelRepository
                .findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associé à ce compte"));

        List<Atelier> ateliers = atelierRepository.findByProfessionnelId(professionnel.getId());
        return ResponseEntity.ok(ateliers);
    }
}
