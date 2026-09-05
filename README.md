# Maisons MINO

Le village périnatal — de l'association au centre de référence.

Backend Spring Boot + Frontend React pour l'accompagnement des mamans, partenaires,
professionnels et coordinatrices sur un parcours de 14 mois (grossesse → post-partum).

## Structure du projet

```
Mino-app/
├── mino-backend/     API Spring Boot (Java 17, PostgreSQL, JWT, Liquibase)
├── mino-frontend/    Application React (Vite)
└── .github/          Pipeline CI (verification automatique a chaque push)
```

## Démarrage rapide

### Prérequis
- Java 17
- Node.js 18+
- PostgreSQL (via Podman ou installation locale)
- Un compte Gmail avec un mot de passe d'application (pour l'envoi d'emails)

### Variables d'environnement requises

Avant de lancer le backend, définir ces variables (voir `setx` sous Windows,
`export` sous Linux/Mac) :

| Variable | Description |
|---|---|
| `MINO_DB_PASSWORD` | Mot de passe PostgreSQL |
| `MINO_JWT_SECRET` | Clé secrète de signature des tokens JWT |
| `MINO_EMAIL_ADRESSE` | Adresse Gmail d'envoi |
| `MINO_EMAIL_MOT_DE_PASSE_APP` | Mot de passe d'application Gmail (pas le vrai mot de passe) |

### Backend

```bash
cd mino-backend
mvn spring-boot:run
```

Démarre sur `http://localhost:8081`. Documentation interactive de l'API :
`http://localhost:8081/swagger-ui.html`

### Frontend

```bash
cd mino-frontend
npm install
npm run dev
```

Démarre sur `http://localhost:5173`

## Fonctionnalités principales

- 4 espaces distincts : Maman, Partenaire, Professionnel, Coordinatrice
- Gestion des cohortes et constitution des groupes de 5 femmes
- Ateliers avec inscription et rappels automatiques par email
- Messagerie de groupe et messagerie 1-à-1 (partenaire ↔ coordinatrice)
- Questionnaires PROM/PREM personnalisables (types et questions configurables)
- Notifications temps réel (SSE) et par email
- Dossiers archivés — trace permanente de l'activité, même après suppression d'un compte
- Comptes-rendus d'ateliers et conventions de prestation pour les professionnels

## Architecture technique

- **Backend** : Spring Boot 3.3, Spring Security (JWT), Spring Data JPA, Liquibase, Spring Mail
- **Base de données** : PostgreSQL, migrations versionnées (Liquibase)
- **Frontend** : React 19, React Router, axios
- **Temps réel** : Server-Sent Events (SSE)

## Workflow Git

- `main` — version stable
- `dev` — développement en cours
- Branches de fonctionnalité créées depuis `dev`, fusionnées après validation

## À faire avant une mise en production réelle

- Hébergement HDS (obligatoire — données de santé)
- HTTPS
- Tests automatisés
- Pagination des listes
