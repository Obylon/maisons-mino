package com.mino.controller;

import com.mino.dto.ConventionDtos.ConventionRequest;
import com.mino.dto.ConventionDtos.ConventionResponse;
import com.mino.model.ConventionPrestation;
import com.mino.model.Professionnel;
import com.mino.model.Utilisateur;
import com.mino.repository.ConventionPrestationRepository;
import com.mino.repository.ProfessionnelRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Conventions de prestation (75€/atelier par defaut, voir ConventionPrestation.java).
 * CRUD complet reserve a la COORDINATRICE ; un PROFESSIONNEL peut uniquement
 * consulter SA PROPRE convention via /ma-convention (jamais celle des autres).
 */
@RestController
@RequestMapping("/api/conventions")
@RequiredArgsConstructor
public class ConventionController {

    private static final BigDecimal TARIF_PAR_DEFAUT = new BigDecimal("75.00");

    private final ConventionPrestationRepository conventionRepository;
    private final ProfessionnelRepository professionnelRepository;

    @PostMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<ConventionResponse> creer(@Valid @RequestBody ConventionRequest request) {
        Professionnel professionnel = professionnelRepository.findById(request.professionnelId())
                .orElseThrow(() -> new NoSuchElementException("Professionnel introuvable : " + request.professionnelId()));

        ConventionPrestation convention = new ConventionPrestation();
        convention.setProfessionnel(professionnel);
        convention.setTarif(request.tarif() != null ? request.tarif() : TARIF_PAR_DEFAUT);
        convention.setStatut(request.statut());
        convention.setDateSignature(request.dateSignature());
        convention = conventionRepository.save(convention);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(convention));
    }

    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<ConventionResponse>> lister() {
        List<ConventionResponse> conventions = conventionRepository.findAll()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(conventions);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<ConventionResponse> obtenir(@PathVariable String id) {
        ConventionPrestation convention = conventionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Convention introuvable : " + id));
        return ResponseEntity.ok(toResponse(convention));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<ConventionResponse> modifier(@PathVariable String id,
                                                          @Valid @RequestBody ConventionRequest request) {
        ConventionPrestation convention = conventionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Convention introuvable : " + id));
        Professionnel professionnel = professionnelRepository.findById(request.professionnelId())
                .orElseThrow(() -> new NoSuchElementException("Professionnel introuvable : " + request.professionnelId()));

        convention.setProfessionnel(professionnel);
        convention.setTarif(request.tarif() != null ? request.tarif() : TARIF_PAR_DEFAUT);
        convention.setStatut(request.statut());
        convention.setDateSignature(request.dateSignature());
        convention = conventionRepository.save(convention);

        return ResponseEntity.ok(toResponse(convention));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        if (!conventionRepository.existsById(id)) {
            throw new NoSuchElementException("Convention introuvable : " + id);
        }
        conventionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Un professionnel ne voit que SES propres conventions, jamais celles des autres. */
    @GetMapping("/ma-convention")
    @PreAuthorize("hasRole('PROFESSIONNEL')")
    public ResponseEntity<List<ConventionResponse>> maConvention(
            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        List<ConventionResponse> conventions = conventionRepository.findByProfessionnelId(professionnel.getId())
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(conventions);
    }

    private ConventionResponse toResponse(ConventionPrestation c) {
        return new ConventionResponse(
                c.getId(),
                c.getProfessionnel().getId(),
                c.getProfessionnel().getUtilisateur().getPrenom() + " " + c.getProfessionnel().getUtilisateur().getNom(),
                c.getTarif(),
                c.getStatut(),
                c.getDateSignature()
        );
    }
}
