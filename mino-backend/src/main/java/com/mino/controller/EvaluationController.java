package com.mino.controller;

import com.mino.dto.EvaluationDtos.AtelierAEvaluerResponse;
import com.mino.dto.EvaluationDtos.EvaluationRequest;
import com.mino.dto.EvaluationDtos.EvaluationResponse;
import com.mino.dto.EvaluationDtos.EvaluationSyntheseResponse;
import com.mino.model.Atelier;
import com.mino.model.EvaluationAtelier;
import com.mino.model.InscriptionAtelier.StatutPresence;
import com.mino.model.Maman;
import com.mino.model.Professionnel;
import com.mino.model.Utilisateur;
import com.mino.repository.AtelierRepository;
import com.mino.repository.EvaluationAtelierRepository;
import com.mino.repository.InscriptionAtelierRepository;
import com.mino.repository.MamanRepository;
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
import java.util.Map;
import java.util.stream.Collectors;
import java.util.NoSuchElementException;

/**
 * Evaluation d'un atelier par une maman qui y a assiste - note le fond de
 * l'atelier et le professionnel separement, chacun sur 5. Une seule evaluation
 * par (atelier, maman) - contrainte verifiee ici avant toute creation.
 */
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationAtelierRepository evaluationRepository;
    private final AtelierRepository atelierRepository;
    private final MamanRepository mamanRepository;
    private final ProfessionnelRepository professionnelRepository;
    private final InscriptionAtelierRepository inscriptionAtelierRepository;

    @PostMapping
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<EvaluationResponse> soumettre(@Valid @RequestBody EvaluationRequest request,
                                                        @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associé à ce compte"));

        Atelier atelier = atelierRepository.findById(request.atelierId())
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + request.atelierId()));

        boolean etaitPresente = inscriptionAtelierRepository.findByAtelierId(atelier.getId()).stream()
                .anyMatch(insc -> insc.getUtilisateur().getId().equals(utilisateurConnecte.getId())
                        && insc.getStatutPresence() == StatutPresence.PRESENT);
        if (!etaitPresente) {
            throw new AccessDeniedException("Vous ne pouvez évaluer qu'un atelier auquel vous avez assisté.");
        }

        if (evaluationRepository.existsByAtelierIdAndMamanId(atelier.getId(), maman.getId())) {
            throw new IllegalArgumentException("Vous avez déjà évalué cet atelier.");
        }

        EvaluationAtelier evaluation = new EvaluationAtelier();
        evaluation.setAtelier(atelier);
        evaluation.setMaman(maman);
        evaluation.setNoteAtelier(request.noteAtelier());
        evaluation.setNoteProfessionnel(request.noteProfessionnel());
        evaluation.setCommentaire(request.commentaire());
        evaluation.setDateSoumission(LocalDateTime.now());
        evaluation = evaluationRepository.save(evaluation);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(evaluation));
    }

    /** Ateliers auxquels la maman a assiste mais qu'elle n'a pas encore evalues. */
    @GetMapping("/a-evaluer")
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<List<AtelierAEvaluerResponse>> ateliersAEvaluer(
            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associé à ce compte"));

        List<AtelierAEvaluerResponse> aEvaluer = inscriptionAtelierRepository.findByUtilisateurId(utilisateurConnecte.getId()).stream()
                .filter(insc -> insc.getStatutPresence() == StatutPresence.PRESENT)
                .map(insc -> insc.getAtelier())
                .filter(atelier -> !evaluationRepository.existsByAtelierIdAndMamanId(atelier.getId(), maman.getId()))
                .map(atelier -> new AtelierAEvaluerResponse(
                        atelier.getId(),
                        atelier.getTitre() != null ? atelier.getTitre() : atelier.getType().name(),
                        atelier.getProfessionnel() != null
                                ? atelier.getProfessionnel().getUtilisateur().getPrenom() + " " + atelier.getProfessionnel().getUtilisateur().getNom()
                                : "—",
                        atelier.getDateHeure()
                ))
                .toList();

        return ResponseEntity.ok(aEvaluer);
    }

    /**
     * Moyennes par atelier. La coordinatrice voit tous les ateliers evalues ; un
     * professionnel ne voit QUE les siens (meme principe d'isolation que partout
     * ailleurs). Aucune identite de maman n'est jamais exposee.
     */
    @GetMapping("/synthese")
    @PreAuthorize("hasAnyRole('COORDINATRICE', 'PROFESSIONNEL')")
    public ResponseEntity<List<EvaluationSyntheseResponse>> synthese(
            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {

        String professionnelFiltre = null;
        if (utilisateurConnecte.getRole().name().equals("PROFESSIONNEL")) {
            professionnelFiltre = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                    .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associé à ce compte"))
                    .getId();
        }
        final String filtre = professionnelFiltre;

        Map<String, List<EvaluationAtelier>> parAtelier = evaluationRepository.findAll().stream()
                .filter(e -> filtre == null
                        || (e.getAtelier().getProfessionnel() != null && e.getAtelier().getProfessionnel().getId().equals(filtre)))
                .collect(Collectors.groupingBy(e -> e.getAtelier().getId()));

        List<EvaluationSyntheseResponse> synthese = parAtelier.entrySet().stream()
                .map(entry -> {
                    List<EvaluationAtelier> evals = entry.getValue();
                    Atelier a = evals.get(0).getAtelier();
                    return new EvaluationSyntheseResponse(
                            a.getId(),
                            a.getTitre() != null ? a.getTitre() : a.getType().name(),
                            a.getDateHeure(),
                            a.getProfessionnel() != null ? a.getProfessionnel().getId() : null,
                            a.getProfessionnel() != null
                                    ? a.getProfessionnel().getUtilisateur().getPrenom() + " " + a.getProfessionnel().getUtilisateur().getNom()
                                    : "—",
                            evals.size(),
                            evals.stream().mapToInt(EvaluationAtelier::getNoteAtelier).average().orElse(0),
                            evals.stream().mapToInt(EvaluationAtelier::getNoteProfessionnel).average().orElse(0)
                    );
                })
                .sorted((x, y) -> {
                    if (x.dateHeure() == null) return 1;
                    if (y.dateHeure() == null) return -1;
                    return y.dateHeure().compareTo(x.dateHeure()); // plus recents d'abord
                })
                .toList();

        return ResponseEntity.ok(synthese);
    }

    /** Vue d'ensemble des evaluations d'un atelier - coordinatrice, ou le professionnel concerne. */
    @GetMapping("/atelier/{atelierId}")
    @PreAuthorize("hasAnyRole('COORDINATRICE', 'PROFESSIONNEL')")
    public ResponseEntity<List<EvaluationResponse>> parAtelier(@PathVariable String atelierId,
                                                               @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Atelier atelier = atelierRepository.findById(atelierId)
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + atelierId));

        if (utilisateurConnecte.getRole().name().equals("PROFESSIONNEL")) {
            Professionnel professionnel = professionnelRepository.findByUtilisateurId(utilisateurConnecte.getId())
                    .orElseThrow(() -> new IllegalStateException("Aucun profil professionnel associé à ce compte"));
            if (atelier.getProfessionnel() == null || !atelier.getProfessionnel().getId().equals(professionnel.getId())) {
                throw new AccessDeniedException("Vous ne pouvez consulter que les évaluations de vos propres ateliers.");
            }
        }

        List<EvaluationResponse> evaluations = evaluationRepository.findByAtelierId(atelierId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(evaluations);
    }

    private EvaluationResponse toResponse(EvaluationAtelier e) {
        return new EvaluationResponse(
                e.getId(),
                e.getAtelier().getId(),
                e.getAtelier().getTitre(),
                e.getNoteAtelier(),
                e.getNoteProfessionnel(),
                e.getCommentaire(),
                e.getDateSoumission()
        );
    }
}