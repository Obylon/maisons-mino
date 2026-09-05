package com.mino.dossier;

import com.mino.model.*;
import com.mino.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Construit le resume textuel complet d'une personne, quel que soit son role -
 * c'est ce texte qui est stocke dans Dossier.contenu, et qui doit rester lisible
 * meme des annees apres la suppression du compte d'origine.
 *
 * Appele a deux moments :
 * - a la demande (bouton "Actualiser le dossier" cote coordinatrice, pour un
 *   compte encore actif) ;
 * - automatiquement juste avant la suppression definitive d'un compte (voir
 *   InscriptionController.supprimerDefinitivement), pour figer une derniere
 *   version avant que les donnees vivantes ne disparaissent.
 */
@Service
@RequiredArgsConstructor
public class DossierService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final MamanRepository mamanRepository;
    private final PartenaireRepository partenaireRepository;
    private final ProfessionnelRepository professionnelRepository;
    private final InscriptionAtelierRepository inscriptionAtelierRepository;
    private final AtelierRepository atelierRepository;
    private final QuestionnairePromPremRepository questionnaireRepository;
    private final MessageRepository messageRepository;
    private final CompteRenduRepository compteRenduRepository;
    private final ConventionPrestationRepository conventionRepository;

    public String genererResume(Utilisateur u) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== DOSSIER — ").append(u.getPrenom()).append(" ").append(u.getNom()).append(" ===\n");
        sb.append("Role : ").append(u.getRole()).append("\n");
        sb.append("Email : ").append(u.getEmail()).append("\n");
        sb.append("Telephone : ").append(u.getTelephone() != null ? u.getTelephone() : "—").append("\n");
        sb.append("Compte cree le : ").append(u.getDateCreationCompte() != null ? u.getDateCreationCompte().format(FMT) : "—").append("\n\n");

        switch (u.getRole()) {
            case MAMAN -> resumerMaman(sb, u);
            case PARTENAIRE -> resumerPartenaire(sb, u);
            case PROFESSIONNEL -> resumerProfessionnel(sb, u);
            case COORDINATRICE -> resumerCoordinatrice(sb, u);
        }

        return sb.toString();
    }

    private void resumerMaman(StringBuilder sb, Utilisateur u) {
        mamanRepository.findByUtilisateurId(u.getId()).ifPresentOrElse(maman -> {
            sb.append("--- Parcours ---\n");
            sb.append("Cohorte : ").append(maman.getCohorte() != null ? maman.getCohorte().getNom() : "—").append("\n");
            sb.append("Groupe : ").append(maman.getGroupe() != null ? (maman.getGroupe().getNom() != null ? maman.getGroupe().getNom() : maman.getGroupe().getId()) : "—").append("\n");
            sb.append("Terme de grossesse : ").append(maman.getDateTermeGrossesse() != null ? maman.getDateTermeGrossesse() : "—").append("\n");
            sb.append("Naissance du bebe : ").append(maman.getDateNaissanceBebe() != null ? maman.getDateNaissanceBebe() : "—").append("\n");
            sb.append("Entree dans le parcours : ").append(maman.getDateEntreeParcours() != null ? maman.getDateEntreeParcours() : "—").append("\n\n");

            List<Partenaire> partenaires = partenaireRepository.findByMamanId(maman.getId());
            sb.append("--- Partenaire lie ---\n");
            if (partenaires.isEmpty()) {
                sb.append("Aucun\n\n");
            } else {
                partenaires.forEach(p -> sb.append(p.getUtilisateur().getPrenom()).append(" ")
                        .append(p.getUtilisateur().getNom()).append(" (").append(p.getUtilisateur().getEmail()).append(")\n"));
                sb.append("\n");
            }

            sb.append("--- Ateliers suivis (").append(inscriptionAtelierRepository.findByUtilisateurId(u.getId()).size()).append(") ---\n");
            inscriptionAtelierRepository.findByUtilisateurId(u.getId()).forEach(insc -> {
                Atelier a = insc.getAtelier();
                sb.append("- ").append(a.getTitre() != null ? a.getTitre() : a.getType())
                        .append(" — ").append(a.getDateHeure() != null ? a.getDateHeure().format(FMT) : "date non fixee")
                        .append(" (").append(insc.getStatutPresence()).append(")\n");
            });
            sb.append("\n");

            List<QuestionnairePromPrem> questionnaires = questionnaireRepository.findByMamanId(maman.getId());
            sb.append("--- Questionnaires soumis (").append(questionnaires.size()).append(") ---\n");
            questionnaires.forEach(q -> sb.append("- [").append(q.getType()).append("]")
                    .append(q.getPhase() != null ? " phase " + q.getPhase() : "")
                    .append(" le ").append(q.getDateSoumission() != null ? q.getDateSoumission().format(FMT) : "—")
                    .append(" : ").append(q.getReponses()).append("\n"));
            sb.append("\n");
        }, () -> sb.append("(Profil maman introuvable au moment de la generation du dossier)\n\n"));

        List<Message> messages = messageRepository.findByExpediteurId(u.getId());
        sb.append("--- Messages envoyes dans le groupe (").append(messages.size()).append(") ---\n");
        messages.forEach(m -> sb.append("- ").append(m.getDateEnvoi().format(FMT)).append(" : ").append(m.getContenu()).append("\n"));
    }

    private void resumerPartenaire(StringBuilder sb, Utilisateur u) {
        partenaireRepository.findAll().stream()
                .filter(p -> p.getUtilisateur().getId().equals(u.getId()))
                .findFirst()
                .ifPresent(partenaire -> {
                    sb.append("--- Lien administratif ---\n");
                    sb.append("Maman liee (id d'origine) : ").append(partenaire.getMamanId() != null ? partenaire.getMamanId() : "—").append("\n\n");
                });

        sb.append("--- Ateliers P1/P2 suivis (").append(inscriptionAtelierRepository.findByUtilisateurId(u.getId()).size()).append(") ---\n");
        inscriptionAtelierRepository.findByUtilisateurId(u.getId()).forEach(insc -> {
            Atelier a = insc.getAtelier();
            sb.append("- ").append(a.getTitre() != null ? a.getTitre() : a.getType())
                    .append(" — ").append(a.getDateHeure() != null ? a.getDateHeure().format(FMT) : "date non fixee").append("\n");
        });
        sb.append("\n");

        List<Message> messages = messageRepository.findByExpediteurId(u.getId());
        sb.append("--- Messages envoyes a la coordination (").append(messages.size()).append(") ---\n");
        messages.forEach(m -> sb.append("- ").append(m.getDateEnvoi().format(FMT)).append(" : ").append(m.getContenu()).append("\n"));
    }

    private void resumerProfessionnel(StringBuilder sb, Utilisateur u) {
        professionnelRepository.findByUtilisateurId(u.getId()).ifPresentOrElse(professionnel -> {
            sb.append("--- Profil professionnel ---\n");
            sb.append("Specialite : ").append(professionnel.getSpecialite() != null ? professionnel.getSpecialite() : "—").append("\n");
            sb.append("Statut conventionnement : ").append(professionnel.getStatutConventionnement() != null ? professionnel.getStatutConventionnement() : "—").append("\n\n");

            List<Atelier> ateliers = atelierRepository.findByProfessionnelId(professionnel.getId());
            sb.append("--- Ateliers animes (").append(ateliers.size()).append(") ---\n");
            ateliers.forEach(a -> sb.append("- ").append(a.getTitre() != null ? a.getTitre() : a.getType())
                    .append(" — ").append(a.getDateHeure() != null ? a.getDateHeure().format(FMT) : "date non fixee").append("\n"));
            sb.append("\n");

            List<CompteRendu> comptesRendus = compteRenduRepository.findByProfessionnelId(professionnel.getId());
            sb.append("--- Comptes-rendus rediges (").append(comptesRendus.size()).append(") ---\n");
            comptesRendus.forEach(c -> sb.append("- ").append(c.getDateRedaction().format(FMT)).append(" : ").append(c.getContenu()).append("\n"));
            sb.append("\n");

            List<ConventionPrestation> conventions = conventionRepository.findByProfessionnelId(professionnel.getId());
            sb.append("--- Conventions (").append(conventions.size()).append(") ---\n");
            conventions.forEach(c -> sb.append("- Tarif ").append(c.getTarif()).append("€, statut ").append(c.getStatut())
                    .append(", signee le ").append(c.getDateSignature() != null ? c.getDateSignature() : "—").append("\n"));
        }, () -> sb.append("(Profil professionnel introuvable au moment de la generation du dossier)\n"));
    }

    private void resumerCoordinatrice(StringBuilder sb, Utilisateur u) {
        List<Message> messages = messageRepository.findByExpediteurId(u.getId());
        sb.append("--- Messages envoyes (moderation groupes + reponses conversations) (").append(messages.size()).append(") ---\n");
        messages.forEach(m -> sb.append("- ").append(m.getDateEnvoi().format(FMT)).append(" : ").append(m.getContenu()).append("\n"));
    }
}
