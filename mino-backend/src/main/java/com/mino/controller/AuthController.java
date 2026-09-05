package com.mino.controller;

import com.mino.dto.AuthDtos.ChangerMotDePasseRequest;
import com.mino.dto.AuthDtos.LoginRequest;
import com.mino.dto.AuthDtos.LoginResponse;
import com.mino.dto.AuthDtos.MotDePasseOublieRequest;
import com.mino.email.EmailService;
import com.mino.model.Utilisateur;
import com.mino.repository.UtilisateurRepository;
import com.mino.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        // Déclenche une BadCredentialsException (-> 401 via GlobalExceptionHandler) si invalide
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.motDePasse())
        );

        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.email())
                .orElseThrow(); // ne devrait pas arriver si authenticate() a réussi

        var userDetails = userDetailsService.loadUserByUsername(request.email());
        String token = jwtService.generateToken(userDetails, utilisateur.getRole().name(), utilisateur.getId());

        return ResponseEntity.ok(new LoginResponse(
                token,
                utilisateur.getRole().name(),
                utilisateur.getId(),
                utilisateur.getEmail(),
                utilisateur.getNom(),
                utilisateur.getPrenom()
        ));
    }

    /**
     * Mot de passe oublie, en libre-service, AVANT connexion (route publique,
     * couverte par la regle "/api/auth/**" -> permitAll de SecurityConfig).
     * Repond toujours 200 avec le meme message generique, que le compte existe
     * ou non / soit actif ou non - evite de laisser deviner quels emails sont
     * enregistres dans le systeme.
     */
    @PostMapping("/mot-de-passe-oublie")
    public ResponseEntity<String> motDePasseOublie(@Valid @RequestBody MotDePasseOublieRequest request) {
        utilisateurRepository.findByEmail(request.email())
                .filter(Utilisateur::isActif)
                .ifPresent(utilisateur -> {
                    String nouveauMotDePasse = genererMotDePasseTemporaire();
                    utilisateur.setMotDePasseHash(passwordEncoder.encode(nouveauMotDePasse));
                    utilisateurRepository.save(utilisateur);

                    emailService.envoyer(
                            utilisateur.getEmail(),
                            "Reinitialisation de votre mot de passe MINO",
                            "Bonjour " + utilisateur.getPrenom() + ",\n\n"
                                    + "Vous avez demande la reinitialisation de votre mot de passe.\n"
                                    + "Nouveau mot de passe temporaire : " + nouveauMotDePasse + "\n\n"
                                    + "Connectez-vous puis changez-le depuis votre profil.\n\n"
                                    + "Si vous n'etes pas a l'origine de cette demande, contactez la coordination.\n\n"
                                    + "L'equipe Maisons MINO"
                    );
                });

        return ResponseEntity.ok(
                "Si un compte existe avec cet email, un mot de passe temporaire vient de lui etre envoye."
        );
    }

    /**
     * Changement de mot de passe en libre-service, pour un compte deja connecte
     * (n'importe quel role) - verifie l'ancien mot de passe avant d'appliquer
     * le nouveau, pour eviter qu'une session volee ne puisse verrouiller le
     * vrai proprietaire du compte.
     */
    @PutMapping("/changer-mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(@Valid @RequestBody ChangerMotDePasseRequest request,
                                                     @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        if (!passwordEncoder.matches(request.ancienMotDePasse(), utilisateurConnecte.getMotDePasseHash())) {
            throw new IllegalArgumentException("Ancien mot de passe incorrect.");
        }
        utilisateurConnecte.setMotDePasseHash(passwordEncoder.encode(request.nouveauMotDePasse()));
        utilisateurRepository.save(utilisateurConnecte);
        return ResponseEntity.noContent().build();
    }

    private String genererMotDePasseTemporaire() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
