# MINO Backend — API V1

Backend Spring Boot de l'application MINO, conforme à la stack et au modèle de données validés
(voir documents `MINO_ModeleDonnees_V1.docx` et `MINO_Ecrans_Fonctionnalites_V1.docx`).

## Stack

- Java 17 / Spring Boot 3.3
- PostgreSQL (via Spring Data JPA)
- Spring Security + JWT
- Lombok

## Structure

```
src/main/java/com/mino/
  model/         → les 11 entités JPA (Utilisateur, Maman, Partenaire, Professionnel, Cohorte,
                   Groupe, Atelier, InscriptionAtelier, QuestionnairePromPrem, Message,
                   ConventionPrestation)
  repository/    → interfaces Spring Data JPA
  security/      → JWT (génération, filtre) + UserDetailsService
  config/        → SecurityConfig (règles d'accès par rôle)
  controller/    → endpoints REST
  dto/           → objets de transfert (requêtes/réponses)
```

## Ce qui est déjà en place

- Les 11 entités du modèle de données, avec les commentaires rappelant les règles d'isolation
  (notamment `Partenaire.mamanId`, volontairement non navigable en JPA, et
  `QuestionnairePromPrem` strictement lié à `Maman`).
- Authentification JWT complète (`POST /api/auth/login`).
- Règles d'accès par rôle dans `SecurityConfig` — reflètent exactement les 4 profils et leurs
  périmètres définis dans le document Écrans & fonctionnalités.
- Un contrôleur d'exemple (`AtelierController.mesAteliers`) qui montre le pattern à suivre pour
  tout endroit où un filtrage par rôle est nécessaire (ne pas se contenter d'un `findAll()`).

## Ce qu'il reste à faire (prochaines étapes)

- [ ] Contrôleurs CRUD pour les autres entités (Maman, Cohorte, Groupe, Message, PROM/PREM...)
- [ ] Gestion des exceptions globales (`@ControllerAdvice`) pour des réponses d'erreur propres
- [ ] Endpoint d'inscription / création de compte par la coordinatrice
- [ ] Tests unitaires et d'intégration (notamment sur les règles d'isolation Partenaire)
- [ ] Migration vers Flyway ou Liquibase pour remplacer `ddl-auto: update` en production
- [ ] Déploiement sur un hébergeur certifié HDS (Clever Cloud ou OVHcloud) avant toute donnée réelle

## Lancer en local

Prérequis : Java 17, Maven, une base PostgreSQL locale (`mino_db`).

```bash
export DB_PASSWORD=votre_mot_de_passe
export JWT_SECRET=une_chaine_aleatoire_longue
mvn spring-boot:run
```

> Note : ce scaffold n'a pas pu être compilé dans cet environnement (pas d'accès réseau à Maven
> Central ici). À builder et tester dans ton environnement de dev local avant la suite.
