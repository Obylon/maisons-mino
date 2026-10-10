package com.mino.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mino.dto.QuestionnaireDtos.QuestionnaireAdminResponse;
import com.mino.dto.QuestionnaireDtos.QuestionnaireRequest;
import com.mino.dto.QuestionnaireDtos.QuestionnaireResponse;
import com.mino.model.*;
import com.mino.notification.NotificationService;
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
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Questionnaires PROM/PREM - la donnee la plus sensible du modele.
 * Lors d'un PROM avec score EPDS >= 13, une alerte SSE est envoyée
 * à toutes les coordinatrices connectées.
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
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

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

        // Alerte SSE si PROM avec score EPDS élevé (>= 13)
        if ("PROM".equalsIgnoreCase(request.type())) {
            int score = calculerScoreEPDS(request.reponses());
            if (score >= 13) {
                String prenom = maman.getUtilisateur().getPrenom().replace("\"", "\\\"");
                String nom = maman.getUtilisateur().getNom().replace("\"", "\\\"");
                String payload = String.format(
                        "{\"type\":\"alerte-prom\",\"mamanPrenom\":\"%s\",\"mamanNom\":\"%s\",\"score\":%d}",
                        prenom, nom, score);
                utilisateurRepository.findByRole(Role.COORDINATRICE)
                        .forEach(c -> notificationService.notifier(c.getId(), "alerte-prom", payload));
            }
        }

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
                        q.getDateSoumission(),
                        q.getReponses()
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

    private boolean professionnelSuitCetteMaman(Utilisateur utilisateurConnecte, Maman maman) {
        if (maman.getGroupe() == null) {
            return false;
        }
        Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associe a ce compte"));

        return atelierRepository.findByProfessionnelId(professionnel.getId()).stream()
                .anyMatch(a -> a.getGroupe() != null && a.getGroupe().getId().equals(maman.getGroupe().getId()));
    }

    /** Score EPDS : items q1 et q2 sont à score inversé (3-valeur), les autres = valeur. */
    private int calculerScoreEPDS(String reponsesJson) {
        try {
            List<Map<String, Object>> arr = objectMapper.readValue(reponsesJson, new TypeReference<>() {});
            Set<String> reversed = Set.of("q1", "q2");
            int total = 0;
            for (Map<String, Object> item : arr) {
                if (item.get("questionId") instanceof String qId && item.get("valeur") instanceof Number num) {
                    int v = num.intValue();
                    total += reversed.contains(qId) ? 3 - v : v;
                }
            }
            return total;
        } catch (Exception e) {
            return 0;
        }
    }

    private QuestionnaireResponse toResponse(QuestionnairePromPrem q) {
        return new QuestionnaireResponse(
                q.getId(), q.getMaman().getId(), q.getType(), q.getPhase(), q.getDateSoumission(), q.getReponses()
        );
    }
}
