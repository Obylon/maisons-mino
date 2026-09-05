package com.mino.controller;

import com.mino.dto.AtelierDtos.AtelierResponse;
import com.mino.dto.AtelierDtos.CalendrierAtelierResponse;
import com.mino.dto.AtelierDtos.InscriptionResponse;
import com.mino.model.*;
import com.mino.model.Atelier.TypeAtelier;
import com.mino.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Inscription/desinscription aux ateliers, et consultation de la liste P1/P2.
 *
 * Regle metier centrale (voir Atelier.java et le modele de donnees) :
 * - une MAMAN ne peut s'inscrire qu'aux ateliers MENSUEL_STANDARD / SEANCE_INDIVIDUELLE_S0
 *   de SON PROPRE groupe - jamais a un atelier d'un autre groupe.
 * - un PARTENAIRE ne peut s'inscrire qu'aux ateliers P1_GROSSESSE_PARTENAIRE /
 *   P2_POSTPARTUM_PARTENAIRE (voir SecurityConfig : "/api/ateliers/p1-p2/**").
 * Cette isolation est verifiee ici, cote service, pas seulement au niveau route -
 * meme principe que documente dans AtelierController.
 */
@RestController
@RequestMapping("/api/ateliers")
@RequiredArgsConstructor
public class InscriptionAtelierController {

    private static final Set<TypeAtelier> TYPES_MAMAN = Set.of(
            TypeAtelier.MENSUEL_STANDARD, TypeAtelier.SEANCE_INDIVIDUELLE_S0
    );
    private static final Set<TypeAtelier> TYPES_PARTENAIRE = Set.of(
            TypeAtelier.P1_GROSSESSE_PARTENAIRE, TypeAtelier.P2_POSTPARTUM_PARTENAIRE
    );

    private final AtelierRepository atelierRepository;
    private final InscriptionAtelierRepository inscriptionRepository;
    private final MamanRepository mamanRepository;

    /**
     * Ateliers du groupe de la maman connectee, tries par date, avec son propre
     * statut d'inscription pour chacun - vue "calendrier" cote MAMAN.
     */
    @GetMapping("/mon-calendrier")
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<List<CalendrierAtelierResponse>> monCalendrier(
            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));

        if (maman.getGroupe() == null) {
            return ResponseEntity.ok(List.of());
        }

        List<CalendrierAtelierResponse> calendrier = atelierRepository.findByGroupeId(maman.getGroupe().getId())
                .stream()
                .sorted((a, b) -> {
                    if (a.getDateHeure() == null) return 1;
                    if (b.getDateHeure() == null) return -1;
                    return a.getDateHeure().compareTo(b.getDateHeure());
                })
                .map(a -> {
                    boolean inscrite = inscriptionRepository.findByAtelierId(a.getId()).stream()
                            .anyMatch(insc -> insc.getUtilisateur().getId().equals(utilisateurConnecte.getId()));
                    return new CalendrierAtelierResponse(
                            a.getId(), a.getTitre(), a.getType(), a.getDateHeure(), a.getDureeMinutes(),
                            a.getProfessionnel() != null
                                    ? a.getProfessionnel().getUtilisateur().getPrenom() + " " + a.getProfessionnel().getUtilisateur().getNom()
                                    : null,
                            inscrite
                    );
                })
                .toList();

        return ResponseEntity.ok(calendrier);
    }

    @PostMapping("/{id}/inscriptions")
    @PreAuthorize("hasAnyRole('MAMAN', 'PARTENAIRE')")
    public ResponseEntity<InscriptionResponse> sInscrire(@PathVariable String id,
                                                         @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Atelier atelier = atelierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + id));

        if (utilisateurConnecte.getRole() == Role.MAMAN) {
            if (!TYPES_MAMAN.contains(atelier.getType())) {
                throw new IllegalArgumentException(
                        "Cet atelier n'est pas accessible aux mamans (type " + atelier.getType() + ").");
            }
            Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                    .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));
            if (atelier.getGroupe() == null || maman.getGroupe() == null
                    || !atelier.getGroupe().getId().equals(maman.getGroupe().getId())) {
                throw new IllegalArgumentException("Cet atelier n'appartient pas a votre groupe.");
            }
        } else if (utilisateurConnecte.getRole() == Role.PARTENAIRE) {
            if (!TYPES_PARTENAIRE.contains(atelier.getType())) {
                throw new IllegalArgumentException(
                        "Cet atelier n'est pas accessible aux partenaires (type " + atelier.getType() + ").");
            }
        }

        boolean dejaInscrit = inscriptionRepository.findByAtelierId(id).stream()
                .anyMatch(insc -> insc.getUtilisateur().getId().equals(utilisateurConnecte.getId()));
        if (dejaInscrit) {
            throw new IllegalStateException("Vous etes deja inscrit(e) a cet atelier.");
        }

        InscriptionAtelier inscription = new InscriptionAtelier();
        inscription.setAtelier(atelier);
        inscription.setUtilisateur(utilisateurConnecte);
        inscription = inscriptionRepository.save(inscription);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(inscription));
    }

    @DeleteMapping("/{id}/inscriptions/moi")
    @PreAuthorize("hasAnyRole('MAMAN', 'PARTENAIRE')")
    public ResponseEntity<Void> seDesinscrire(@PathVariable String id,
                                              @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        InscriptionAtelier inscription = inscriptionRepository.findByAtelierId(id).stream()
                .filter(insc -> insc.getUtilisateur().getId().equals(utilisateurConnecte.getId()))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Vous n'etes pas inscrit(e) a cet atelier."));
        inscriptionRepository.delete(inscription);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/inscriptions")
    @PreAuthorize("hasAnyRole('COORDINATRICE', 'PROFESSIONNEL')")
    public ResponseEntity<List<InscriptionResponse>> listerInscrits(
            @PathVariable String id, @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Atelier atelier = atelierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + id));

        boolean estLeProfessionnelDeLAtelier = utilisateurConnecte.getRole() == Role.PROFESSIONNEL
                && atelier.getProfessionnel() != null
                && atelier.getProfessionnel().getUtilisateur().getId().equals(utilisateurConnecte.getId());

        if (utilisateurConnecte.getRole() == Role.PROFESSIONNEL && !estLeProfessionnelDeLAtelier) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Vous ne pouvez consulter que les inscriptions de vos propres ateliers.");
        }

        List<InscriptionResponse> inscriptions = inscriptionRepository.findByAtelierId(id).stream()
                .map(this::toResponse).toList();
        return ResponseEntity.ok(inscriptions);
    }

    /** Liste des ateliers P1/P2 disponibles - route dediee aux partenaires (voir SecurityConfig). */
    @GetMapping("/p1-p2")
    @PreAuthorize("hasAnyRole('PARTENAIRE', 'COORDINATRICE')")
    public ResponseEntity<List<AtelierResponse>> listerAteliersP1P2() {
        List<AtelierResponse> ateliers = atelierRepository.findAll().stream()
                .filter(a -> TYPES_PARTENAIRE.contains(a.getType()))
                .map(a -> new AtelierResponse(
                        a.getId(), a.getTitre(), a.getType(), a.getDateHeure(), a.getDureeMinutes(),
                        a.getProfessionnel() != null ? a.getProfessionnel().getId() : null,
                        a.getProfessionnel() != null
                                ? a.getProfessionnel().getUtilisateur().getPrenom() + " " + a.getProfessionnel().getUtilisateur().getNom()
                                : null,
                        a.getGroupe() != null ? a.getGroupe().getId() : null,
                        null // les ateliers P1/P2 n'ont pas de groupe
                ))
                .toList();
        return ResponseEntity.ok(ateliers);
    }

    private InscriptionResponse toResponse(InscriptionAtelier i) {
        return new InscriptionResponse(
                i.getId(),
                i.getAtelier().getId(),
                i.getUtilisateur().getId(),
                i.getUtilisateur().getPrenom() + " " + i.getUtilisateur().getNom(),
                i.getStatutPresence()
        );
    }
}