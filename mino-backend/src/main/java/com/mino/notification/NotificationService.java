package com.mino.notification;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Registre des connexions SSE ouvertes, par utilisateur. Un meme utilisateur
 * peut avoir plusieurs onglets ouverts -> liste d'emitters, pas un seul.
 *
 * Complementaire de l'email (EmailService) : le SSE ne fonctionne QUE si
 * l'utilisateur a l'application ouverte au moment de l'evenement (vraiment
 * "temps reel", mais rien n'est garde s'il est deconnecte) - l'email, lui,
 * finit toujours par arriver, meme hors ligne. Les deux sont envoyes ensemble.
 */
@Service
public class NotificationService {

    private final Map<String, List<SseEmitter>> emittersParUtilisateur = new ConcurrentHashMap<>();

    public SseEmitter creerConnexion(String utilisateurId) {
        SseEmitter emitter = new SseEmitter(0L); // pas de timeout - reste ouvert
        emittersParUtilisateur.computeIfAbsent(utilisateurId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> retirer(utilisateurId, emitter));
        emitter.onTimeout(() -> retirer(utilisateurId, emitter));
        emitter.onError(e -> retirer(utilisateurId, emitter));

        return emitter;
    }

    private void retirer(String utilisateurId, SseEmitter emitter) {
        List<SseEmitter> liste = emittersParUtilisateur.get(utilisateurId);
        if (liste != null) liste.remove(emitter);
    }

    /** Envoie un evenement a toutes les connexions ouvertes de cet utilisateur (silencieux si aucune). */
    public void notifier(String utilisateurId, String type, String message) {
        List<SseEmitter> liste = emittersParUtilisateur.get(utilisateurId);
        if (liste == null || liste.isEmpty()) return;

        for (SseEmitter emitter : List.copyOf(liste)) {
            try {
                emitter.send(SseEmitter.event().name(type).data(message));
            } catch (IOException e) {
                retirer(utilisateurId, emitter);
            }
        }
    }
}
