package com.mino.controller;

import com.mino.dto.CompteRenduDtos.CompteRenduRequest;
import com.mino.dto.CompteRenduDtos.CompteRenduResponse;
import com.mino.model.Atelier;
import com.mino.model.CompteRendu;
import com.mino.model.Professionnel;
import com.mino.model.Role;
import com.mino.model.Utilisateur;
import com.mino.repository.AtelierRepository;
import com.mino.repository.CompteRenduRepository;
import com.mino.repository.ProfessionnelRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Comptes-rendus d'atelier - reserves au professionnel qui a anime l'atelier et a
 * la coordinatrice (jamais a la maman, decision produit deja documentee dans le
 * mockup existant). Voir SecurityConfig : "/api/comptes-rendus/**" -> PROFESSIONNEL, COORDINATRICE.
 */
@RestController
@RequestMapping("/api/comptes-rendus")
@RequiredArgsConstructor
public class CompteRenduController {

    private final CompteRenduRepository compteRenduRepository;
    private final AtelierRepository atelierRepository;
    private final ProfessionnelRepository professionnelRepository;

    @PostMapping
    @PreAuthorize("hasRole('PROFESSIONNEL')")
    public ResponseEntity<CompteRenduResponse> rediger(@Valid @RequestBody CompteRenduRequest request,
                                                          @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Atelier atelier = atelierRepository.findById(request.atelierId())
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + request.atelierId()));

        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        if (atelier.getProfessionnel() == null || !atelier.getProfessionnel().getId().equals(professionnel.getId())) {
            throw new AccessDeniedException("Vous ne pouvez rediger un compte-rendu que pour vos propres ateliers.");
        }

        CompteRendu compteRendu = new CompteRendu();
        compteRendu.setAtelier(atelier);
        compteRendu.setProfessionnel(professionnel);
        compteRendu.setContenu(request.contenu());
        compteRendu.setDateRedaction(LocalDateTime.now());
        compteRendu = compteRenduRepository.save(compteRendu);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(compteRendu));
    }

    @GetMapping("/mes-comptes-rendus")
    @PreAuthorize("hasRole('PROFESSIONNEL')")
    public ResponseEntity<List<CompteRenduResponse>> mesComptesRendus(
            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        List<CompteRenduResponse> comptesRendus = compteRenduRepository.findByProfessionnelId(professionnel.getId())
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(comptesRendus);
    }

    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<CompteRenduResponse>> listerTout() {
        List<CompteRenduResponse> comptesRendus = compteRenduRepository.findAll()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(comptesRendus);
    }

    private CompteRenduResponse toResponse(CompteRendu c) {
        return new CompteRenduResponse(
                c.getId(),
                c.getAtelier().getId(),
                c.getAtelier().getTitre(),
                c.getDateRedaction(),
                c.getContenu()
        );
    }
}
