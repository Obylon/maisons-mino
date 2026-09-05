package com.mino.rappel;

import com.mino.email.EmailService;
import com.mino.model.Atelier;
import com.mino.model.InscriptionAtelier;
import com.mino.repository.AtelierRepository;
import com.mino.repository.InscriptionAtelierRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Tache planifiee qui envoie un rappel par email aux inscrits, 24h avant le
 * debut de chaque atelier. Tourne toutes les 15 minutes ; "rappel_envoye"
 * evite qu'un meme atelier ne declenche plusieurs emails.
 *
 * Necessite @EnableScheduling sur MinoApplication pour etre active.
 */
@Service
@RequiredArgsConstructor
public class AtelierRappelService {

    private static final Logger log = LoggerFactory.getLogger(AtelierRappelService.class);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");

    private final AtelierRepository atelierRepository;
    private final InscriptionAtelierRepository inscriptionAtelierRepository;
    private final EmailService emailService;

    @Scheduled(fixedRate = 15 * 60 * 1000) // toutes les 15 minutes
    public void envoyerRappels() {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime dansVingtQuatreHeures = maintenant.plusHours(24);

        List<Atelier> candidats = atelierRepository.findByRappelEnvoyeFalse().stream()
                .filter(a -> a.getDateHeure() != null)
                .filter(a -> a.getDateHeure().isAfter(maintenant) && a.getDateHeure().isBefore(dansVingtQuatreHeures))
                .toList();

        for (Atelier atelier : candidats) {
            List<InscriptionAtelier> inscriptions = inscriptionAtelierRepository.findByAtelierId(atelier.getId());

            for (InscriptionAtelier insc : inscriptions) {
                if (!insc.getUtilisateur().isActif()) continue;
                emailService.envoyer(
                        insc.getUtilisateur().getEmail(),
                        "Rappel — atelier demain",
                        "Bonjour " + insc.getUtilisateur().getPrenom() + ",\n\n"
                                + "Petit rappel : vous etes inscrit(e) a l'atelier \""
                                + (atelier.getTitre() != null ? atelier.getTitre() : atelier.getType())
                                + "\" qui a lieu le " + atelier.getDateHeure().format(FMT) + ".\n\n"
                                + "A tres bientot,\nL'equipe Maisons MINO"
                );
            }

            atelier.setRappelEnvoye(true);
            atelierRepository.save(atelier);
            log.info("Rappel envoye pour l'atelier {} ({} destinataires)", atelier.getId(), inscriptions.size());
        }
    }
}
