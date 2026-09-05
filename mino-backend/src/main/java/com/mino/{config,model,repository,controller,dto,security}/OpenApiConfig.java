package com.mino;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentation interactive de l'API, accessible sur /swagger-ui.html une fois le
 * backend demarre. Le schema "bearerAuth" ajoute un bouton "Authorize" en haut de la
 * page : coller le token recu via POST /api/auth/login (sans le mot "Bearer" devant,
 * Swagger l'ajoute automatiquement) pour tester ensuite n'importe quelle route protegee
 * directement depuis le navigateur.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mineoOpenApi() {
        final String schemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("Maisons MINO — API")
                        .description("API du backend MINO : cohortes, groupes, ateliers, messagerie, PROM/PREM, conventions.")
                        .version("v0.1"))
                .addSecurityItem(new SecurityRequirement().addList(schemeName))
                .components(new Components().addSecuritySchemes(schemeName,
                        new SecurityScheme()
                                .name(schemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
