package com.mino.controller;

import com.mino.dto.MessageDtos.MessageRequest;
import com.mino.dto.MessageDtos.MessageResponse;
import com.mino.email.EmailService;
import com.mino.model.Lecture;
import com.mino.model.Maman;
import com.mino.model.Message;
import com.mino.model.Utilisateur;
import com.mino.notification.NotificationService;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Messagerie privee stricte entre deux mamans du MEME groupe - a la difference
 * de la messagerie de groupe (MessageController), aucune moderation par la
 * coordinatrice n'existe ici, volontairement (choix produit assume : deux
 * mamans qui se rapprochent doivent pouvoir se parler comme sur n'importe
 * quelle messagerie privee classique).
 *
 * A garder en tete pour la suite du projet : ce choix retire le filet de
 * securite qu'offre la moderation du fil de groupe (16,7% des femmes
 * presentent un risque de depression post-partum selon l'ENP 2021, voir
 * deck de presentation) - si une detresse s'exprime dans un message prive,
 * personne cote coordination/professionnels ne peut la voir. C'est un
 * compromis assume, pas un oubli.
 *
 * conversationId est construit de facon deterministe a partir des deux ids
 * utilisateur (tries alphabetiquement) pour que les deux mamans retrouvent
 * le meme fil, prefixe "prive:" pour ne jamais entrer en collision avec les
 * conversationId de la messagerie partenaire/coordinatrice (MessageConversationController).
 */
@RestController
@RequestMapping("/api/messages/prive")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MAMAN')")
public class MessagePriveController {

    private final MessageRepository messageRepository;
    private final MamanRepository mamanRepository;
    private final LectureRepository lectureRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @PostMapping("/{autreUtilisateurId}")
    public ResponseEntity<MessageResponse> envoyer(@PathVariable String autreUtilisateurId,
                                                   @Valid @RequestBody MessageRequest request,
                                                   @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Utilisateur autre = verifierMemeGroupeEtRecuperer(utilisateurConnecte.getId(), autreUtilisateurId);
        String conversationId = construireConversationId(utilisateurConnecte.getId(), autreUtilisateurId);

        Message message = new Message();
        message.setConversationId(conversationId);
        message.setExpediteur(utilisateurConnecte);
        message.setContenu(request.contenu());
        message = messageRepository.save(message);

        notificationService.notifier(autre.getId(), "nouveau-message-prive",
                "{\"expediteur\":\"" + utilisateurConnecte.getPrenom() + "\""
                + ",\"expediteurNom\":\"" + (utilisateurConnecte.getNom() != null ? utilisateurConnecte.getNom() : "") + "\""
                + ",\"fil\":\"prive\",\"cible\":\"" + utilisateurConnecte.getId() + "\"}");
        emailService.envoyer(
                autre.getEmail(),
                "Nouveau message privé - Maisons MINO",
                "Bonjour " + autre.getPrenom() + ",\n\n"
                        + utilisateurConnecte.getPrenom() + " vous a écrit en privé :\n\n\""
                        + request.contenu() + "\"\n\n"
                        + "Connectez-vous à votre espace pour répondre.\n\n"
                        + "L'équipe Maisons MINO"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(message));
    }

    @GetMapping("/{autreUtilisateurId}")
    public ResponseEntity<List<MessageResponse>> lister(@PathVariable String autreUtilisateurId,
                                                        @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierMemeGroupeEtRecuperer(utilisateurConnecte.getId(), autreUtilisateurId);
        String conversationId = construireConversationId(utilisateurConnecte.getId(), autreUtilisateurId);

        List<MessageResponse> messages = messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{autreUtilisateurId}/marquer-lu")
    public ResponseEntity<Void> marquerLu(@PathVariable String autreUtilisateurId,
                                          @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierMemeGroupeEtRecuperer(utilisateurConnecte.getId(), autreUtilisateurId);
        String conversationId = construireConversationId(utilisateurConnecte.getId(), autreUtilisateurId);

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

    @GetMapping("/{autreUtilisateurId}/non-lus")
    public ResponseEntity<Long> compterNonLus(@PathVariable String autreUtilisateurId,
                                              @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        verifierMemeGroupeEtRecuperer(utilisateurConnecte.getId(), autreUtilisateurId);
        String conversationId = construireConversationId(utilisateurConnecte.getId(), autreUtilisateurId);

        LocalDateTime derniereLecture = lectureRepository
                .findByUtilisateurIdAndCle(utilisateurConnecte.getId(), conversationId)
                .map(Lecture::getDateLecture)
                .orElse(LocalDateTime.MIN);

        long nonLus = messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId).stream()
                .filter(m -> m.getDateEnvoi().isAfter(derniereLecture))
                .filter(m -> !m.getExpediteur().getId().equals(utilisateurConnecte.getId()))
                .count();
        return ResponseEntity.ok(nonLus);
    }

    /**
     * Total des messages non lus tous membres du groupe confondus - utilise pour
     * le point rouge global sur le lien "Messages prives" de la navigation,
     * distinct du compteur par conversation individuelle.
     */
    @GetMapping("/non-lus-total")
    public ResponseEntity<Long> compterNonLusTotal(@AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman moi = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associé à ce compte"));

        if (moi.getGroupe() == null) return ResponseEntity.ok(0L);

        long total = mamanRepository.findByGroupeId(moi.getGroupe().getId()).stream()
                .filter(autre -> !autre.getUtilisateur().getId().equals(utilisateurConnecte.getId()))
                .mapToLong(autre -> {
                    String conversationId = construireConversationId(utilisateurConnecte.getId(), autre.getUtilisateur().getId());
                    LocalDateTime derniereLecture = lectureRepository
                            .findByUtilisateurIdAndCle(utilisateurConnecte.getId(), conversationId)
                            .map(Lecture::getDateLecture)
                            .orElse(LocalDateTime.MIN);
                    return messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId).stream()
                            .filter(m -> m.getDateEnvoi().isAfter(derniereLecture))
                            .filter(m -> !m.getExpediteur().getId().equals(utilisateurConnecte.getId()))
                            .count();
                })
                .sum();

        return ResponseEntity.ok(total);
    }

    private String construireConversationId(String id1, String id2) {
        List<String> ids = new ArrayList<>(List.of(id1, id2));
        Collections.sort(ids);
        return "prive:" + ids.get(0) + ":" + ids.get(1);
    }

    /** Verifie que les deux mamans partagent le meme groupe, et renvoie l'utilisateur "autre". */
    private Utilisateur verifierMemeGroupeEtRecuperer(String monUtilisateurId, String autreUtilisateurId) {
        Maman moi = mamanRepository.findByUtilisateurId(monUtilisateurId)
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associé à ce compte"));
        Maman autre = mamanRepository.findByUtilisateurId(autreUtilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Cette personne n'existe pas ou n'est pas une maman"));

        if (moi.getGroupe() == null || autre.getGroupe() == null
                || !moi.getGroupe().getId().equals(autre.getGroupe().getId())) {
            throw new AccessDeniedException("Vous ne pouvez écrire qu'aux mamans de votre propre groupe.");
        }
        return autre.getUtilisateur();
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