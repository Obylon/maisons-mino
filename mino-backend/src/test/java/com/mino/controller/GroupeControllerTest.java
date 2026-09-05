package com.mino.controller;

import com.mino.BaseIntegrationTest;
import com.mino.model.Cohorte;
import com.mino.model.Groupe;
import com.mino.model.Role;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reprend le test d'isolation le plus important de tout le projet, deja
 * verifie manuellement plusieurs fois pendant la session : une maman ne doit
 * jamais pouvoir consulter la liste de tous les groupes (reservee COORDINATRICE),
 * et /mon-groupe doit toujours renvoyer SON groupe a elle, jamais celui d'une autre.
 */
class GroupeControllerTest extends BaseIntegrationTest {

    @Test
    void mamanVoitSonPropreGroupeEtPasLesAutres() throws Exception {
        Cohorte cohorte = creerCohorte("Cohorte test");
        Groupe groupeDeMarie = creerGroupe(cohorte);
        Groupe groupeDeSarah = creerGroupe(cohorte);

        var utilisateurMarie = creerUtilisateur("marie@test.fr", "motdepasse123", Role.MAMAN, "Marie");
        creerMaman(utilisateurMarie, cohorte, groupeDeMarie);

        var utilisateurSarah = creerUtilisateur("sarah@test.fr", "motdepasse123", Role.MAMAN, "Sarah");
        creerMaman(utilisateurSarah, cohorte, groupeDeSarah);

        String tokenMarie = obtenirToken("marie@test.fr", "motdepasse123");

        mockMvc.perform(get("/api/groupes/mon-groupe")
                        .header("Authorization", "Bearer " + tokenMarie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(groupeDeMarie.getId()));
    }

    @Test
    void mamanNePeutPasListerTousLesGroupes() throws Exception {
        var utilisateur = creerUtilisateur("marie@test.fr", "motdepasse123", Role.MAMAN, "Marie");
        Cohorte cohorte = creerCohorte("Cohorte test");
        Groupe groupe = creerGroupe(cohorte);
        creerMaman(utilisateur, cohorte, groupe);
        String token = obtenirToken("marie@test.fr", "motdepasse123");

        mockMvc.perform(get("/api/groupes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void coordinatricePeutListerTousLesGroupes() throws Exception {
        creerUtilisateur("joyce@test.fr", "motdepasse123", Role.COORDINATRICE, "Joyce");
        String token = obtenirToken("joyce@test.fr", "motdepasse123");

        mockMvc.perform(get("/api/groupes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
