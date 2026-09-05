package com.mino.controller;

import com.mino.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Règles d'accès par rôle, directement dérivées des décisions prises dans
 * le document "Écrans & fonctionnalités par profil" et le modèle de données.
 *
 * Point clé : PARTENAIRE n'a explicitement accès à AUCUNE route sensible
 * (groupes, messages de groupe, questionnaires PROM/PREM) — ni en lecture ni en écriture.
 *
 * CORS : autorise le frontend React (Vite, port 5173 par défaut) à appeler cette API
 * depuis un domaine différent — indispensable pour le navigateur, sans lien avec les
 * règles d'autorisation par rôle ci-dessous qui restent inchangées.
 */
@Configuration
@EnableMethodSecurity // active @PreAuthorize sur les contrôleurs pour un filtrage plus fin (ex: par atelier_id)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // API stateless avec JWT — pas de session, pas de cookie
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Authentification ouverte à tous
                // Authentification ouverte a tous - SEULEMENT le login et le mot de passe
                // oublie ; changer-mot-de-passe exige d'etre deja connecte (voir plus bas,
                // couvert par anyRequest().authenticated() puisqu'il n'est plus dans permitAll).
                .requestMatchers("/api/auth/login", "/api/auth/mot-de-passe-oublie").permitAll()
                // Evite qu'un 404 (forward interne Spring Boot) ne se transforme en 403
                .requestMatchers("/error").permitAll()
                // Documentation interactive de l'API (Swagger UI) - la page elle-meme est
                // publique, mais chaque appel de route protegee depuis Swagger necessite
                // toujours un token valide via le bouton "Authorize".
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                // Espace MAMAN
                .requestMatchers("/api/prom-prem/**").hasAnyRole("MAMAN", "PROFESSIONNEL", "COORDINATRICE")
                .requestMatchers("/api/groupes/**").hasAnyRole("MAMAN", "COORDINATRICE")
                .requestMatchers("/api/messages/groupe/**").hasAnyRole("MAMAN", "COORDINATRICE")

                // Espace PARTENAIRE — explicitement restreint à ses seules routes
                .requestMatchers("/api/ateliers/p1-p2/**").hasAnyRole("PARTENAIRE", "COORDINATRICE")

                // Espace PROFESSIONNEL
                .requestMatchers("/api/ateliers/mes-ateliers/**").hasRole("PROFESSIONNEL")
                .requestMatchers("/api/comptes-rendus/**").hasAnyRole("PROFESSIONNEL", "COORDINATRICE")
                .requestMatchers("/api/conventions/**").hasAnyRole("PROFESSIONNEL", "COORDINATRICE")

                // Espace COORDINATRICE (admin)
                .requestMatchers("/api/admin/**").hasRole("COORDINATRICE")
                .requestMatchers("/api/cohortes/**").hasRole("COORDINATRICE")

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Origines autorisées : les deux ports de dev habituels (Vite par défaut = 5173,
     * mais certains setups CRA/autres utilisent 3000) sur localhost et 127.0.0.1.
     * A completer avec le domaine de production le moment venu (ex: https://app.maisonsmino.fr).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
