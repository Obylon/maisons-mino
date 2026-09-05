package com.mino.controller;

import com.mino.dto.ProfessionnelDtos.ProfessionnelProfilRequest;
import com.mino.dto.ProfessionnelDtos.ProfessionnelProfilResponse;
import com.mino.model.Professionnel;
import com.mino.model.Utilisateur;
import com.mino.repository.ProfessionnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Profil professionnel en auto-service - permet a un kine/sage-femme/psy/sexo/
 * dieteticienne de corriger sa specialite ou son statut de conventionnement
 * apres la creation du compte par la coordinatrice.
 */
@RestController
@RequestMapping("/api/professionnel")
@RequiredArgsConstructor
public class ProfessionnelController {

    private final ProfessionnelRepository professionnelRepository;

    @GetMapping("/mon-profil")
    @PreAuthorize("hasRole('PROFESSIONNEL')")
    public ResponseEntity<ProfessionnelProfilResponse> monProfil(@AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        return ResponseEntity.ok(new ProfessionnelProfilResponse(
                professionnel.getSpecialite(), professionnel.getStatutConventionnement()
        ));
    }

    @PutMapping("/mon-profil")
    @PreAuthorize("hasRole('PROFESSIONNEL')")
    public ResponseEntity<Void> mettreAJourProfil(@RequestBody ProfessionnelProfilRequest request,
                                                    @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        professionnel.setSpecialite(request.specialite());
        professionnel.setStatutConventionnement(request.statutConventionnement());
        professionnelRepository.save(professionnel);

        return ResponseEntity.noContent().build();
    }
}
