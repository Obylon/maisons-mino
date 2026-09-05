package com.mino;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mino.model.Cohorte;
import com.mino.model.Groupe;
import com.mino.model.Maman;
import com.mino.model.Role;
import com.mino.model.Utilisateur;
import com.mino.repository.CohorteRepository;
import com.mino.repository.GroupeRepository;
import com.mino.repository.MamanRepository;
import com.mino.repository.UtilisateurRepository;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base commune pour tous les tests d'integration - configure MockMvc (exerce
 * la vraie chaine de securite, pas de mocks), une base H2 en memoire isolee,
 * et un rollback automatique apres chaque test (@Transactional) pour ne pas
 * polluer les tests suivants.
 *
 * Reprend le meme esprit que les tests manuels faits via Postman pendant le
 * developpement : creer un utilisateur, se logger, appeler une route protegee.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UtilisateurRepository utilisateurRepository;

    @Autowired
    protected MamanRepository mamanRepository;

    @Autowired
    protected CohorteRepository cohorteRepository;

    @Autowired
    protected GroupeRepository groupeRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected Utilisateur creerUtilisateur(String email, String motDePasse, Role role, String prenom) {
        Utilisateur u = new Utilisateur();
        u.setEmail(email);
        u.setMotDePasseHash(passwordEncoder.encode(motDePasse));
        u.setRole(role);
        u.setNom("Test");
        u.setPrenom(prenom);
        u.setActif(true);
        u.setDateCreationCompte(LocalDateTime.now());
        return utilisateurRepository.save(u);
    }

    protected Cohorte creerCohorte(String nom) {
        Cohorte c = new Cohorte();
        c.setNom(nom);
        c.setVille("Paris");
        return cohorteRepository.save(c);
    }

    protected Groupe creerGroupe(Cohorte cohorte) {
        Groupe g = new Groupe();
        g.setCohorte(cohorte);
        return groupeRepository.save(g);
    }

    protected Maman creerMaman(Utilisateur utilisateur, Cohorte cohorte, Groupe groupe) {
        Maman m = new Maman();
        m.setUtilisateur(utilisateur);
        m.setCohorte(cohorte);
        m.setGroupe(groupe);
        return mamanRepository.save(m);
    }

    /** Se connecte via le vrai endpoint /api/auth/login et extrait le token JWT de la reponse. */
    protected String obtenirToken(String email, String motDePasse) throws Exception {
        String corps = objectMapper.writeValueAsString(new LoginPayload(email, motDePasse));
        String reponse = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(corps))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(reponse).get("token").asText();
    }

    private record LoginPayload(String email, String motDePasse) {}
}
