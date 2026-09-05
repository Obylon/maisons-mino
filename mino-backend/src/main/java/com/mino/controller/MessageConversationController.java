package com.mino.controller;

import com.mino.dto.MessageDtos.MessageRequest;
import com.mino.dto.MessageDtos.MessageResponse;
import com.mino.email.EmailService;
import com.mino.model.Lecture;
import com.mino.model.Message;
import com.mino.model.Role;
import com.mino.model.Utilisateur;
import com.mino.notification.NotificationService;
import com.mino.repository.LectureRepository;
import com.mino.repository.MessageRepository;
import com.mino.repository.UtilisateurRepository;
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
 * Messagerie 1-a-1 entre un partenaire et la coordination (canal limite aux questions
 * pratiques/logistiques, voir mockup). Convention : conversationId = l'id utilisateur
 * du partenaire lui-meme, donc un seul canal par partenaire avec "la coordination"
 * (pas de notion de plusieurs coordinatrices distinctes pour l'instant).
 *
 * Isolation : un PARTENAIRE ne peut acceder qu'a SA PROPRE conversation (conversationId
 * doit correspondre a son propre id) ; la COORDINATRICE peut acceder a toutes.
 */
@RestController
@RequestMapping("/api/messages/conversation")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTENAIRE', 'COORDINATRICE')")
public class MessageConversationController {

    private final MessageRepository messageRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final LectureRepository lectureRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @PostMapping("/{conversationId}/marquer-lu")
    public ResponseEntity<Void> marquerLu(@PathVariable String conversationId,
                                            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierAcces(conversationId, utilisateurConnecte);
        Lecture lecture = lectureRepository.findByUtilisateurIdAndCle(utilisateurConnecte.getId(), conversationId)
                .orElseGet(() -> {
                    Lecture nouvelle = new Lecture();
                    nouvelle.setUtilisateur(utilisateurConnecte);
                    nouvelle.setCle(conversationId);
                    return nouvelle;
                });
        lecture.setDateLecture(LocalDateTime.now());
        lectureRepository.save(lecture);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{conversationId}/non-lus")
    public ResponseEntity<Long> compterNonLus(@PathVariable String conversationId,
                                                @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierAcces(conversationId, utilisateurConnecte);
        LocalDateTime derniereLecture = lectureRepository
                .findByUtilisateurIdAndCle(utilisateurConnecte.getId(), conversationId)
                .map(Lecture::getDateLecture)
                .orElse(LocalDateTime.MIN);

        long nonLus = messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId).stream()
                .filter(m -> m.getDateEnvoi().isAfter(derniereLecture))
                .count();
        return ResponseEntity.ok(nonLus);
    }

    @PostMapping("/{conversationId}")
    public ResponseEntity<MessageResponse> envoyer(@PathVariable String conversationId,
                                                      @Valid @RequestBody MessageRequest request,
                                                      @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierAcces(conversationId, utilisateurConnecte);

        Message message = new Message();
        message.setConversationId(conversationId);
        message.setExpediteur(utilisateurConnecte);
        message.setContenu(request.contenu());
        message = messageRepository.save(message);

        notifierAutrePartie(conversationId, utilisateurConnecte, request.contenu());

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(message));
    }

    /**
     * Si le PARTENAIRE ecrit, notifie toutes les coordinatrices actives.
     * Si la COORDINATRICE ecrit, notifie le partenaire concerne (conversationId = son id).
     */
    private void notifierAutrePartie(String conversationId, Utilisateur expediteur, String contenu) {
        String sujet = "Nouveau message - Messagerie coordinatrice MINO";
        String corps = expediteur.getPrenom() + " vous a ecrit :\n\n\"" + contenu + "\"\n\n"
                + "Connectez-vous a votre espace pour repondre.";
        String notifTexte = "Nouveau message de " + expediteur.getPrenom();

        if (expediteur.getRole() == Role.PARTENAIRE) {
            utilisateurRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.COORDINATRICE && u.isActif())
                    .forEach(coordinatrice -> {
                        notificationService.notifier(coordinatrice.getId(), "nouveau-message", notifTexte);
                        emailService.envoyer(coordinatrice.getEmail(), sujet, corps);
                    });
        } else {
            utilisateurRepository.findById(conversationId)
                    .filter(Utilisateur::isActif)
                    .ifPresent(partenaire -> {
                        notificationService.notifier(partenaire.getId(), "nouveau-message", notifTexte);
                        emailService.envoyer(partenaire.getEmail(), sujet, corps);
                    });
        }
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<MessageResponse>> lister(@PathVariable String conversationId,
                                                           @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierAcces(conversationId, utilisateurConnecte);

        List<MessageResponse> messages = messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(messages);
    }

    private void verifierAcces(String conversationId, Utilisateur utilisateurConnecte) {
        if (utilisateurConnecte.getRole() == Role.COORDINATRICE) {
            return;
        }
        if (!conversationId.equals(utilisateurConnecte.getId())) {
            throw new AccessDeniedException("Vous ne pouvez acceder qu'a votre propre conversation.");
        }
    }

    private MessageResponse toResponse(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getExpediteur().getId(),
                m.getExpediteur().getPrenom(),
                m.getContenu(),
                m.getDateEnvoi()
        );
    }
}
