package com.mino.controller;

import com.mino.model.Utilisateur;
import com.mino.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Flux de notifications temps reel (Server-Sent Events). Le frontend ouvre
 * une connexion persistante ici au demarrage de l'app (voir useNotifications.js
 * cote React) ; le token JWT passe en parametre d'URL car EventSource ne
 * permet pas de header personnalise (voir JwtAuthFilter).
 *
 * Route volontairement hors de "/api/auth/**" pour rester couverte par
 * anyRequest().authenticated() dans SecurityConfig - authentification requise.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter stream(@AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        return notificationService.creerConnexion(utilisateurConnecte.getId());
    }
}
