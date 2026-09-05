package com.mino.controller;

import com.mino.BaseIntegrationTest;
import com.mino.model.Role;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reprend le test manuel fait avec Postman : creer un compte MAMAN, verifier
 * qu'elle ne peut PAS creer de cohorte (403), verifier qu'une COORDINATRICE
 * le peut (201). Le controle d'acces par role est le coeur de tout ce projet -
 * c'est la premiere chose qui doit rester couverte par des tests automatises.
 */
class CohorteControllerTest extends BaseIntegrationTest {

    @Test
    void coordinatricePeutCreerUneCohorte() throws Exception {
        creerUtilisateur("joyce@test.fr", "motdepasse123", Role.COORDINATRICE, "Joyce");
        String token = obtenirToken("joyce@test.fr", "motdepasse123");

        mockMvc.perform(post("/api/cohortes")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {"nom":"Paris 17e - Cohorte 1","ville":"Paris"}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void mamanNePeutPasCreerUneCohorte() throws Exception {
        var utilisateur = creerUtilisateur("marie@test.fr", "motdepasse123", Role.MAMAN, "Marie");
        var cohorte = creerCohorte("Cohorte test");
        creerMaman(utilisateur, cohorte, null);
        String token = obtenirToken("marie@test.fr", "motdepasse123");

        mockMvc.perform(post("/api/cohortes")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("""
                                {"nom":"Tentative interdite","ville":"Paris"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void accesSansToken_renvoie401OuForbidden() throws Exception {
        mockMvc.perform(get("/api/cohortes"))
                .andExpect(status().is4xxClientError());
    }
}
