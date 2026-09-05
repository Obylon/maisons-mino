package com.mino.controller;

import com.mino.dto.QuestionnaireDtos.QuestionnaireAdminResponse;
import com.mino.dto.QuestionnaireDtos.QuestionnaireRequest;
import com.mino.dto.QuestionnaireDtos.QuestionnaireResponse;
import com.mino.model.*;
import com.mino.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
 * Questionnaires PROM/PREM - la donnee la plus sensible du modele (voir
 * QuestionnairePromPrem.java : "Strictement lie a MAMAN, jamais a PARTENAIRE").
 *
 * Regles d'acces en lecture (documentees sur l'entite) :
 * - MAMAN : uniquement les siens.
 * - PROFESSIONNEL : uniquement s'il "suit" cette maman, c'est-a-dire s'il anime
 *   au moins un atelier rattache au groupe de cette maman (verifie explicitement
 *   ci-dessous, jamais suppose depuis l'URL).
 * - COORDINATRICE : acces complet (administration/impact).
 * En ecriture : une MAMAN ne peut soumettre que pour elle-meme, jamais pour une autre.
 */
@RestController
@RequestMapping("/api/prom-prem")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MAMAN', 'PROFESSIONNEL', 'COORDINATRICE')")
public class QuestionnaireController {

    private final QuestionnairePromPremRepository questionnaireRepository;
    private final QuestionnaireModeleRepository modeleRepository;
    private final MamanRepository mamanRepository;
    private final ProfessionnelRepository professionnelRepository;
    private final AtelierRepository atelierRepository;

    @PostMapping
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<QuestionnaireResponse> soumettre(@Valid @RequestBody QuestionnaireRequest request,
                                                           @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        boolean modeleValide = modeleRepository.findAll().stream()
                .anyMatch(m -> m.isActif() && m.getNom().equalsIgnoreCase(request.type()));
        if (!modeleValide) {
            throw new IllegalArgumentException(
                    "Type de questionnaire inconnu ou desactive : " + request.type());
        }

        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));

        QuestionnairePromPrem questionnaire = new QuestionnairePromPrem();
        questionnaire.setMaman(maman);
        questionnaire.setType(request.type());
        questionnaire.setPhase(request.phase());
        questionnaire.setReponses(request.reponses());
        questionnaire.setDateSoumission(LocalDateTime.now());
        questionnaire = questionnaireRepository.save(questionnaire);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(questionnaire));
    }

    @GetMapping("/mes-reponses")
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<List<QuestionnaireResponse>> mesReponses(
            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));

        List<QuestionnaireResponse> reponses = questionnaireRepository.findByMamanId(maman.getId())
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(reponses);
    }

    /** Vue globale (rapport d'impact annuel, relances) - reservee COORDINATRICE. */
    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Page<QuestionnaireAdminResponse>> listerTout(@PageableDefault(size = 20) Pageable pageable) {
        Page<QuestionnaireAdminResponse> tout = questionnaireRepository.findAll(pageable)
                .map(q -> new QuestionnaireAdminResponse(
                        q.getId(),
                        q.getMaman().getId(),
                        q.getMaman().getUtilisateur().getNom(),
                        q.getMaman().getUtilisateur().getPrenom(),
                        q.getType(),
                        q.getPhase(),
                        q.getDateSoumission()
                ));
        return ResponseEntity.ok(tout);
    }

    @GetMapping("/maman/{mamanId}")
    @PreAuthorize("hasAnyRole('PROFESSIONNEL', 'COORDINATRICE')")
    public ResponseEntity<List<QuestionnaireResponse>> parMaman(
            @PathVariable String mamanId, @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findById(mamanId)
                .orElseThrow(() -> new NoSuchElementException("Maman introuvable : " + mamanId));

        if (utilisateurConnecte.getRole() == Role.PROFESSIONNEL && !professionnelSuitCetteMaman(utilisateurConnecte, maman)) {
            throw new AccessDeniedException("Vous ne suivez pas cette patiente - acces refuse.");
        }

        List<QuestionnaireResponse> reponses = questionnaireRepository.findByMamanId(mamanId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(reponses);
    }

    /**
     * Un professionnel "suit" une maman s'il anime au moins un atelier rattache
     * au groupe de cette maman - jamais suppose, toujours verifie ici.
     */
    private boolean professionnelSuitCetteMaman(Utilisateur utilisateurConnecte, Maman maman) {
        if (maman.getGroupe() == null) {
            return false;
        }
        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        return atelierRepository.findByProfessionnelId(professionnel.getId()).stream()
                .anyMatch(a -> a.getGroupe() != null && a.getGroupe().getId().equals(maman.getGroupe().getId()));
    }

    private QuestionnaireResponse toResponse(QuestionnairePromPrem q) {
        return new QuestionnaireResponse(
                q.getId(), q.getMaman().getId(), q.getType(), q.getPhase(), q.getDateSoumission(), q.getReponses()
        );
    }
}