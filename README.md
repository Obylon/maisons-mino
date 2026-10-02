# Maisons MINO

Le village périnatal — de l'association au centre de référence.

Backend Spring Boot + Frontend React pour l'accompagnement des mamans, partenaires,
professionnels et coordinatrices sur un parcours de 14 mois (grossesse → post-partum).

## Structure du projet

```
maisons-mino/
├── mino-backend/     API Spring Boot (Java 17, PostgreSQL, JWT, Liquibase)
├── mino-frontend/    Application React (Vite)
└── .github/          Pipeline CI (compilation, tests et build à chaque push)
```

Chaque partie a son propre README plus détaillé :
[mino-backend/README.md](mino-backend/README.md) et
[mino-frontend/README.md](mino-frontend/README.md).

## Démarrage rapide

### Prérequis
- Java 17 et Maven
- Node.js 20.19+ ou 22.12+ (exigé par Vite)
- PostgreSQL (via Podman ou installation locale)
- Un compte Gmail avec un mot de passe d'application (pour l'envoi d'emails)

### Base de données

Le backend attend une base `mino_db` sur `localhost:5432`. Avec Podman :

```bash
podman run -d --name mino-db \
  -e POSTGRES_PASSWORD=<mot-de-passe> \
  -e POSTGRES_DB=mino_db \
  -p 5432:5432 \
  postgres:16
```

Le schéma est créé automatiquement par Liquibase au premier lancement du backend.

### Variables d'environnement

Définir ces variables avant de lancer le backend (`setx` sous Windows,
`export` sous Linux/Mac). Toutes ont une valeur par défaut de développement
dans `application.properties` : le backend démarre sans elles, mais l'envoi
d'emails ne fonctionnera pas et **aucune valeur par défaut ne doit être
utilisée en production**.

| Variable | Description | Défaut (dev) |
|---|---|---|
| `MINO_DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `MINO_DB_PASSWORD` | Mot de passe PostgreSQL | valeur de dev |
| `MINO_JWT_SECRET` | Clé secrète de signature des tokens JWT | valeur de dev |
| `MINO_EMAIL_ADRESSE` | Adresse Gmail d'envoi | `changeme@gmail.com` |
| `MINO_EMAIL_MOT_DE_PASSE_APP` | Mot de passe d'application Gmail (pas le vrai mot de passe) | `changeme` |

### Backend

```bash
cd mino-backend
mvn spring-boot:run
```

Démarre sur `http://localhost:8081`. Documentation interactive de l'API :
`http://localhost:8081/swagger-ui.html`

Un premier compte coordinatrice de démo est créé par Liquibase (changeset
`012-premier-utilisateur.yaml`, contexte `seed-dev`) ; les identifiants des
comptes de démo sont dans `mino-frontend/comptes-test-memo.md`.

### Frontend

```bash
cd mino-frontend
cp .env.example .env   # optionnel : l'URL de l'API par défaut est déjà http://localhost:8081/api
npm install
npm run dev
```

Démarre sur `http://localhost:5173`

### Tests

```bash
cd mino-backend
mvn verify
```

Tests d'intégration (MockMvc + base H2 en mémoire, profil `test`) : aucune
base PostgreSQL n'est nécessaire. Ils sont exécutés par la CI à chaque push
et pull request sur `main` et `dev`.

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

- Hébergement HDS (obligatoire — données de santé) et conformité RGPD
- HTTPS
- Secrets de production (`MINO_JWT_SECRET`, base, email) sans valeur par défaut
- Désactiver le contexte Liquibase `seed-dev` (comptes de démo)
- CORS restreint au domaine de production
- Désactiver ou protéger Swagger UI
- Sauvegardes de la base
- Étendre la couverture de tests (frontend, services backend)
- Pagination des listes
