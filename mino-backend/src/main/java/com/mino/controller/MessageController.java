package com.mino.controller;

import com.mino.dto.MessageDtos.MessageRequest;
import com.mino.dto.MessageDtos.MessageResponse;
import com.mino.email.EmailService;
import com.mino.model.Groupe;
import com.mino.model.Lecture;
import com.mino.model.Maman;
import com.mino.model.Message;
import com.mino.model.Role;
import com.mino.model.Utilisateur;
import com.mino.notification.NotificationService;
import com.mino.repository.GroupeRepository;
import com.mino.repository.LectureRepository;
import com.mino.repository.MamanRepository;
import com.mino.repository.MessageRepository;
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
 * Messagerie du groupe de 5 femmes uniquement (voir SecurityConfig : "/api/messages/groupe/**"
 * -> MAMAN ou COORDINATRICE). La messagerie 1-a-1 (conversation_id) n'est pas couverte ici -
 * elle demande un modele de conversation/participants qui n'existe pas encore.
 *
 * Isolation : une MAMAN ne peut lire/ecrire que dans SON groupe, verifie explicitement,
 * jamais en se basant uniquement sur l'URL (meme principe que GroupeController.monGroupe
 * et InscriptionAtelierController).
 */
@RestController
@RequestMapping("/api/messages/groupe")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MAMAN', 'COORDINATRICE')")
public class MessageController {

    private final MessageRepository messageRepository;
    private final GroupeRepository groupeRepository;
    private final MamanRepository mamanRepository;
    private final LectureRepository lectureRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @PostMapping("/{groupeId}/marquer-lu")
    public ResponseEntity<Void> marquerLu(@PathVariable String groupeId,
                                            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierAccesGroupe(groupeId, utilisateurConnecte);
        Lecture lecture = lectureRepository.findByUtilisateurIdAndCle(utilisateurConnecte.getId(), groupeId)
                .orElseGet(() -> {
                    Lecture nouvelle = new Lecture();
                    nouvelle.setUtilisateur(utilisateurConnecte);
                    nouvelle.setCle(groupeId);
                    return nouvelle;
                });
        lecture.setDateLecture(LocalDateTime.now());
        lectureRepository.save(lecture);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{groupeId}/non-lus")
    public ResponseEntity<Long> compterNonLus(@PathVariable String groupeId,
                                                @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierAccesGroupe(groupeId, utilisateurConnecte);
        LocalDateTime derniereLecture = lectureRepository
                .findByUtilisateurIdAndCle(utilisateurConnecte.getId(), groupeId)
                .map(Lecture::getDateLecture)
                .orElse(LocalDateTime.MIN);

        long nonLus = messageRepository.findByGroupeIdOrderByDateEnvoiAsc(groupeId).stream()
                .filter(m -> m.getDateEnvoi().isAfter(derniereLecture))
                .count();
        return ResponseEntity.ok(nonLus);
    }

    @PostMapping("/{groupeId}")
    public ResponseEntity<MessageResponse> envoyer(@PathVariable String groupeId,
                                                      @Valid @RequestBody MessageRequest request,
                                                      @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Groupe groupe = groupeRepository.findById(groupeId)
                .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + groupeId));

        verifierAccesGroupe(groupeId, utilisateurConnecte);

        Message message = new Message();
        message.setGroupe(groupe);
        message.setExpediteur(utilisateurConnecte);
        message.setContenu(request.contenu());
        message = messageRepository.save(message);

        // Notifie les autres membres actifs du groupe (jamais l'expediteur lui-meme)
        mamanRepository.findByGroupeId(groupeId).stream()
                .map(Maman::getUtilisateur)
                .filter(u -> u.isActif() && !u.getId().equals(utilisateurConnecte.getId()))
                .forEach(destinataire -> {
                    notificationService.notifier(destinataire.getId(), "nouveau-message",
                            "Nouveau message dans votre groupe de " + utilisateurConnecte.getPrenom());
                    emailService.envoyer(
                            destinataire.getEmail(),
                            "Nouveau message dans votre groupe MINO",
                            utilisateurConnecte.getPrenom() + " a ecrit dans votre groupe :\n\n\""
                                    + request.contenu() + "\"\n\n"
                                    + "Connectez-vous a votre espace pour repondre."
                    );
                });

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(message));
    }

    @GetMapping("/{groupeId}")
    public ResponseEntity<List<MessageResponse>> lister(@PathVariable String groupeId,
                                                           @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        if (!groupeRepository.existsById(groupeId)) {
            throw new NoSuchElementException("Groupe introuvable : " + groupeId);
        }
        verifierAccesGroupe(groupeId, utilisateurConnecte);

        List<MessageResponse> messages = messageRepository.findByGroupeIdOrderByDateEnvoiAsc(groupeId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(messages);
    }

    /**
     * Suppression d'un message - reservee a la COORDINATRICE (moderation) ou a
     * son propre auteur. Utile aussi pour nettoyer une donnee corrompue en dev.
     */
    @DeleteMapping("/{groupeId}/{messageId}")
    public ResponseEntity<Void> supprimer(@PathVariable String groupeId,
                                            @PathVariable String messageId,
                                            @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NoSuchElementException("Message introuvable : " + messageId));

        if (message.getGroupe() == null || !message.getGroupe().getId().equals(groupeId)) {
            throw new NoSuchElementException("Ce message n'appartient pas a ce groupe.");
        }

        boolean estLAuteur = message.getExpediteur().getId().equals(utilisateurConnecte.getId());
        if (utilisateurConnecte.getRole() != Role.COORDINATRICE && !estLAuteur) {
            throw new AccessDeniedException("Vous ne pouvez supprimer que vos propres messages.");
        }

        messageRepository.delete(message);
        return ResponseEntity.noContent().build();
    }

    /**
     * Une COORDINATRICE a acces a tous les groupes (moderation). Une MAMAN n'a acces
     * qu'a SON PROPRE groupe - jamais a celui d'un autre groupe, meme en connaissant l'id.
     */
    private void verifierAccesGroupe(String groupeId, Utilisateur utilisateurConnecte) {
        if (utilisateurConnecte.getRole() == Role.COORDINATRICE) {
            return;
        }
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));
        if (maman.getGroupe() == null || !maman.getGroupe().getId().equals(groupeId)) {
            throw new AccessDeniedException("Vous ne pouvez acceder qu'aux messages de votre propre groupe.");
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
