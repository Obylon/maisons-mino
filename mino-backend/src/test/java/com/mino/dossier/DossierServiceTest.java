package com.mino.dossier;

import com.mino.BaseIntegrationTest;
import com.mino.model.Cohorte;
import com.mino.model.Groupe;
import com.mino.model.Message;
import com.mino.model.Role;
import com.mino.model.Utilisateur;
import com.mino.repository.MessageRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verrouille une promesse faite aux utilisatrices : les messages PRIVES entre
 * mamans sont strictement prives (voir MessagePriveController). Le dossier
 * archive, consultable par la coordinatrice, ne doit donc JAMAIS en reprendre
 * le contenu - seulement les messages du fil de groupe, qu'elle peut deja
 * moderer. Ce test a ete ajoute apres avoir decouvert que ce n'etait pas le
 * cas : il empeche toute regression silencieuse.
 */
class DossierServiceTest extends BaseIntegrationTest {

    @Autowired
    private DossierService dossierService;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void dossierDUneMaman_neContientJamaisSesMessagesPrives() {
        Cohorte cohorte = creerCohorte("Cohorte test");
        Groupe groupe = creerGroupe(cohorte);

        Utilisateur marie = creerUtilisateur("marie@test.fr", "motdepasse123", Role.MAMAN, "Marie");
        Utilisateur sarah = creerUtilisateur("sarah@test.fr", "motdepasse123", Role.MAMAN, "Sarah");
        creerMaman(marie, cohorte, groupe);
        creerMaman(sarah, cohorte, groupe);

        Message messageDeGroupe = new Message();
        messageDeGroupe.setGroupe(groupe);
        messageDeGroupe.setExpediteur(marie);
        messageDeGroupe.setContenu("MESSAGE-DE-GROUPE-VISIBLE");

        Message messagePrive = new Message();
        messagePrive.setConversationId("prive:" + marie.getId() + ":" + sarah.getId());
        messagePrive.setExpediteur(marie);
        messagePrive.setContenu("SECRET-PRIVE-ENTRE-MAMANS");

        messageRepository.saveAndFlush(messageDeGroupe);
        messageRepository.saveAndFlush(messagePrive);
        entityManager.clear(); // recharge depuis la base, comme en conditions reelles

        String dossier = dossierService.genererResume(marie);

        assertThat(dossier).contains("MESSAGE-DE-GROUPE-VISIBLE");
        assertThat(dossier).doesNotContain("SECRET-PRIVE-ENTRE-MAMANS");
    }
}
