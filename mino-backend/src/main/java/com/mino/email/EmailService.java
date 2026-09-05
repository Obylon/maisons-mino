package com.mino.email;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envoi d'emails centralise. Chaque appel est protege par un try-catch : un
 * probleme SMTP (identifiants invalides, serveur injoignable...) ne doit jamais
 * faire echouer l'action metier qui a declenche l'email (creation de compte,
 * envoi d'un message...) - seulement etre logue.
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${mino.email.expediteur}")
    private String expediteur;

    public void envoyer(String destinataire, String sujet, String corps) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(expediteur);
            message.setTo(destinataire);
            message.setSubject(sujet);
            message.setText(corps);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Echec envoi email a {} (sujet: {}) : {}", destinataire, sujet, e.getMessage());
        }
    }
}
