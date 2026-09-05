package com.mino.controller;

import com.mino.BaseIntegrationTest;
import com.mino.model.Role;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reprend les scenarios testes manuellement via Postman en debut de session :
 * login valide -> 200 + token, mauvais mot de passe -> 401 propre (pas de 500
 * brut, voir GlobalExceptionHandler), compte inexistant -> 401.
 */
class AuthControllerTest extends BaseIntegrationTest {

    @Test
    void loginAvecBonsIdentifiants_renvoie200EtUnToken() throws Exception {
        creerUtilisateur("joyce@test.fr", "motdepasse123", Role.COORDINATRICE, "Joyce");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"joyce@test.fr","motDePasse":"motdepasse123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("COORDINATRICE"));
    }

    @Test
    void loginAvecMauvaisMotDePasse_renvoie401Propre() throws Exception {
        creerUtilisateur("joyce@test.fr", "motdepasse123", Role.COORDINATRICE, "Joyce");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"joyce@test.fr","motDePasse":"mauvais"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void loginAvecEmailInconnu_renvoie401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"email":"personne@test.fr","motDePasse":"peuimporte"}
                                """))
                .andExpect(status().isUnauthorized());
    }
}
