# MINO Frontend — Application V1

Frontend React (Vite) de l'application MINO, entièrement branché sur le backend
Spring Boot (`mino-backend`).

## Stack

- React 19 + Vite
- React Router (routing protégé par rôle)
- Axios (appels API + intercepteur JWT)
- Server-Sent Events (notifications temps réel)

## Structure

```
src/
  context/
    AuthContext.jsx              → gestion du JWT, login/logout, utilisateur courant
    NotificationContext.jsx      → connexion SSE unique partagée, notifications temps réel
  services/api.js                → tous les appels au backend, groupés par domaine
  hooks/                         → (dossier historique, remplacé par NotificationContext)
  components/
    ProtectedRoute.jsx           → garde de route par rôle (miroir de SecurityConfig backend)
    Layout.jsx                   → sidebar de navigation + cloche de notifications
    NotificationBell.jsx         → cloche avec badge non-lu et menu déroulant
    ProfilPage.jsx               → écran de profil générique (professionnel, partenaire, coordinatrice)
  pages/
    Login.jsx                    → connexion + mot de passe oublié en libre-service
    maman/                       → Accueil, Groupe, Messagerie, Calendrier, PROM/PREM, Parcours, Profil
    partenaire/                  → Accueil, Ateliers P1/P2, Messagerie coordinatrice, Profil
    professionnel/               → Planning, Comptes-rendus, Convention, Profil
    coordinatrice/                → Dashboard, Cohortes (+ détail), Ateliers, PROM/PREM admin,
                                    Modèles de questionnaires, Comptes-rendus admin, Conventions admin,
                                    Utilisateurs, Reporting, Dossiers archivés, Messagerie partenaires, Profil
  styles/tokens.css              → design tokens (couleurs par rôle)
```

## État actuel — tout est branché

Les 4 espaces (Maman, Partenaire, Professionnel, Coordinatrice) sont **entièrement
connectés** à l'API réelle. Il n'y a plus d'écran en `ApiPendingCard`.

Fonctionnalités notables :
- Authentification complète (login, mot de passe oublié, changement de mot de passe,
  déconnexion automatique en cas de token expiré)
- Routing protégé par rôle, isolation stricte entre espaces
- Constitution de groupes, ateliers avec inscription et rappels automatiques
- Messagerie de groupe + messagerie 1-à-1, avec notifications temps réel (SSE) et badge
  de messages non lus
- Questionnaires PROM/PREM et questionnaires personnalisés (types et questions
  configurables par la coordinatrice)
- Dossiers archivés (trace permanente même après suppression d'un compte)

## Lancer en local

```bash
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173` et attend le backend sur `http://localhost:8081`
(voir `mino-backend/README.md`). Variable d'environnement optionnelle `VITE_API_URL` si le
backend tourne ailleurs.

## Prochaines étapes (voir aussi le README racine)

- [ ] Tests (Vitest + React Testing Library), notamment sur `ProtectedRoute`
- [ ] Pagination des listes longues (utilisateurs, ateliers...)
- [ ] Gestion des erreurs réseau génériques (toast, état de chargement partagé)