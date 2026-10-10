package com.mino.controller;

import com.mino.dto.CompteRenduDtos.CompteRenduRequest;
import com.mino.dto.CompteRenduDtos.CompteRenduResponse;
import com.mino.dto.CompteRenduDtos.PresenceRequest;
import com.mino.dto.CompteRenduDtos.PresenceResponse;
import com.mino.email.EmailService;
import com.mino.model.Atelier;
import com.mino.model.CompteRendu;
import com.mino.model.InscriptionAtelier.StatutPresence;
import com.mino.model.Professionnel;
import com.mino.model.Utilisateur;
import com.mino.notification.NotificationService;
import com.mino.repository.AtelierRepository;
import com.mino.repository.CompteRenduRepository;
import com.mino.repository.InscriptionAtelierRepository;
import com.mino.repository.ProfessionnelRepository;
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
 * Comptes-rendus d'atelier - reserves au professionnel qui a anime l'atelier et a
 * la coordinatrice (jamais a la maman, decision produit deja documentee dans le
 * mockup existant). Voir SecurityConfig : "/api/comptes-rendus/**" -> PROFESSIONNEL, COORDINATRICE.
 *
 * Rediger un compte-rendu met aussi a jour la presence des inscrits (PRESENT/
 * ABSENT) et declenche une invitation a evaluer l'atelier (email + notification
 * temps reel) aupres de chaque maman marquee PRESENTE - voir EvaluationController
 * pour le formulaire d'evaluation cote maman.
 */
@RestController
@RequestMapping("/api/comptes-rendus")
@RequiredArgsConstructor
public class CompteRenduController {

    private final CompteRenduRepository compteRenduRepository;
    private final AtelierRepository atelierRepository;
    private final ProfessionnelRepository professionnelRepository;
    private final InscriptionAtelierRepository inscriptionAtelierRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

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
        compteRendu.setDeroule(request.deroule());
        compteRendu.setPointsAttention(request.pointsAttention());
        compteRendu.setSuiviRecommande(request.suiviRecommande());
        compteRendu.setDateRedaction(LocalDateTime.now());
        compteRendu = compteRenduRepository.save(compteRendu);

        // Mise a jour de la presence + invitation a evaluer pour chaque maman marquee presente
        if (request.presences() != null) {
            for (PresenceRequest p : request.presences()) {
                inscriptionAtelierRepository.findByAtelierId(atelier.getId()).stream()
                        .filter(insc -> insc.getUtilisateur().getId().equals(p.utilisateurId()))
                        .findFirst()
                        .ifPresent(inscription -> {
                            StatutPresence statut = StatutPresence.valueOf(p.statutPresence());
                            inscription.setStatutPresence(statut);
                            inscriptionAtelierRepository.save(inscription);

                            if (statut == StatutPresence.PRESENT) {
                                inviterAEvaluer(inscription.getUtilisateur(), atelier);
                            }
                        });
            }
        }

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
    public ResponseEntity<Page<CompteRenduResponse>> listerTout(@PageableDefault(size = 20) Pageable pageable) {
        Page<CompteRenduResponse> comptesRendus = compteRenduRepository.findAll(pageable).map(this::toResponse);
        return ResponseEntity.ok(comptesRendus);
    }

    private void inviterAEvaluer(Utilisateur maman, Atelier atelier) {
        String libelle = atelier.getTitre() != null ? atelier.getTitre() : atelier.getType().name();

        notificationService.notifier(maman.getId(), "invitation-evaluation",
                "Donnez votre avis sur l'atelier \"" + libelle + "\"");

        emailService.envoyer(
                maman.getEmail(),
                "Votre avis sur l'atelier - Maisons MINO",
                "Bonjour " + maman.getPrenom() + ",\n\n"
                        + "Vous avez participé à l'atelier \"" + libelle + "\".\n"
                        + "Votre avis compte : connectez-vous à votre espace pour l'évaluer "
                        + "(quelques secondes suffisent).\n\n"
                        + "L'équipe Maisons MINO"
        );
    }

    private CompteRenduResponse toResponse(CompteRendu c) {
        List<PresenceResponse> presences = inscriptionAtelierRepository.findByAtelierId(c.getAtelier().getId())
                .stream()
                .map(insc -> new PresenceResponse(
                        insc.getUtilisateur().getId(),
                        insc.getUtilisateur().getPrenom(),
                        insc.getUtilisateur().getNom(),
                        insc.getStatutPresence().name()
                ))
                .toList();

        return new CompteRenduResponse(
                c.getId(),
                c.getAtelier().getId(),
                c.getAtelier().getTitre(),
                c.getProfessionnel().getUtilisateur().getPrenom() + " " + c.getProfessionnel().getUtilisateur().getNom(),
                c.getDateRedaction(),
                c.getDeroule(),
                c.getPointsAttention(),
                c.getSuiviRecommande(),
                presences
        );
    }
}