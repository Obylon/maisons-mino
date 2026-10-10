# Maisons MINO — Refonte Web Premium v2.0

**Date :** Octobre 2026  
**Scope :** Application web Vite + React 19 (`mino-frontend`)

---

## Vue d'ensemble

Refonte complète du frontend web pour un positionnement enterprise médical. Chaque couche visuelle a été repensée autour d'un design system cohérent, professionnel et accessible.

---

## 1. Système de design — `src/styles/tokens.css`

### Nouvelle palette medical-luxury

| Token | Valeur | Rôle |
|-------|--------|------|
| `--primary-deep` | `#0A2342` | Navy profond, ancre principale |
| `--primary` | `#1B4F8A` | Bleu médical |
| `--primary-light` | `#3B82F6` | Bleu clair, interactions |
| `--teal` | `#0D9488` | Accent secondaire |
| `--bg` | `#F0F4F8` | Fond général |
| `--surface` | `#FFFFFF` | Cartes et surfaces |
| `--border` | `#E2E8F0` | Bordures |

### Couleurs par rôle (cohérentes avec l'app mobile)

| Rôle | Couleur | Fond |
|------|---------|------|
| MAMAN | `#1D4ED8` bleu roi | `#EFF6FF` |
| PARTENAIRE | `#92400E` ambre | `#FFFBEB` |
| PROFESSIONNEL | `#065F46` émeraude | `#ECFDF5` |
| COORDINATRICE | `#4C1D95` violet | `#F5F3FF` |

### Rétro-compatibilité
Tous les anciens tokens (`--pine`, `--clay`, `--sand`, etc.) sont maintenus comme aliases pour ne pas casser les pages non modifiées.

### Nouvelles classes CSS

- `.stat-card` + `.stat-value` + `.stat-label` — KPI cards avec accent bar
- `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-sm`, `.btn-lg`
- `.search-bar` — barre de recherche avec état focus
- `.badge-success/danger/warning/info/neutral`
- `.hero-card` — carte avec dégradé navy pour les en-têtes de page
- `.empty-state` / `.empty-state-icon/title/text`
- `.notification-dot` — point rouge animé (pulse)
- `.notif-count` — badge numérique rouge
- `.topbar` — barre supérieure du contenu

---

## 2. Animations — `src/styles/animations.css` (nouveau fichier)

- `fadeIn`, `slideIn`, `scaleIn` — transitions de page
- `.skeleton` + `.skeleton-row/card/title/text` — loaders squelette
- `.toast-container` + `.toast` + variantes — système de notifications
- `.chat-bubble-me/other` + `.chat-input/send-btn` — composants chat premium
- `.chat-date-sep` — séparateurs de date dans les fils de discussion

---

## 3. Layout — `src/components/Layout.jsx`

### Sidebar repensée
- En-tête avec logo "Maisons **MINO**" (MINO en teal)
- Tagline "Plateforme périnatalité"
- Avatar initiales de l'utilisateur connecté
- Sections de navigation groupées pour COORDINATRICE ("Pilotage", "Suivi clinique", "Administration")
- Points de notification animés sur les liens messagerie
- Bouton déconnexion stylisé danger en pied de sidebar

### Top bar
- `NotificationBell` repositionné dans une `.topbar` dédiée

---

## 4. Login — `src/pages/Login.jsx`

Layout 2 colonnes enterprise :
- **Côté gauche** : dégradé navy `#0A2342 → #1B4F8A`, logo M arrondi, titre, sous-titre, 3 features avec icônes teal
- **Côté droit** : formulaire dans une card flottante avec ombres
- Responsive : hero masqué sur mobile (< 768px)
- Mode "mot de passe oublié" conservé et redessiné

---

## 5. Composants

### `src/context/ToastContext.jsx` (nouveau)
Système de notifications toast non-bloquant pour remplacer les `alert()` :
- `useToast()` hook exposant `toast(message, type, duration)`
- Types : `success`, `error`, `info`, `warning`
- Auto-dismiss après 3.5s
- Animations slide-in/out
- Wrappé autour de `App.jsx`

### `src/components/Avatar.jsx` (nouveau)
Avatar à initiales déterministe :
- Couleur de fond selon le rôle de l'utilisateur
- Taille configurable via prop `size`
- Utilisé dans : Layout sidebar, Utilisateurs, MessagerieGroupe

### `src/components/Modal.jsx` (mis à jour)
- Backdrop avec `backdrop-filter: blur(3px)` (effet glassmorphism)
- Animation d'entrée `modalSlideUp`
- Bouton fermeture rond avec hover state
- `document.body.overflow = hidden` pendant l'ouverture

### `src/components/NotificationBell.jsx` (mis à jour)
- Badge numérique (plus juste un point)
- Dropdown premium avec header (titre + "Tout marquer lu")
- Affichage structuré de chaque notification (emoji, message, temps écoulé, indicateur non-lu)
- Animation `scaleIn` à l'ouverture

---

## 6. Pages mises à jour

### `src/pages/coordinatrice/Dashboard.jsx`
- Hero card dégradé avec accueil personnalisé
- 4 stat-cards avec accent bar supérieure
- Grille d'accès rapide emoji + label vers les sections clés

### `src/pages/coordinatrice/Utilisateurs.jsx`
- Barre de recherche filtrante (nom + e-mail, local)
- Filtres par rôle (pills cliquables)
- Avatars à initiales dans le tableau
- Badges de rôle colorés
- Badges actif/inactif (vert/gris)
- Affichage du mot de passe temporaire dans un bloc monospace stylisé

### `src/pages/coordinatrice/Reporting.jsx`
- Intégration **recharts** : `BarChart`, `PieChart` (remplace les barres HTML maison)
- Tooltip custom cohérent avec le design system
- KPI row en stat-cards
- **Bouton "Exporter CSV"** : génère un fichier téléchargeable depuis les données déjà chargées (côté client, sans appel backend supplémentaire)

### `src/pages/maman/Accueil.jsx`
- Hero card dégradé avec bonjour personnalisé
- Badge non-lus messagerie en lien inline dans le hero
- Carte "Prochain atelier" avec countdown en jours
- Grille d'accès rapide 8 liens avec couleurs rôle-appropriées et hover animé

### `src/pages/maman/MessagerieGroupe.jsx`
- Bulles de chat premium (dégradé pour "moi", blanc pour les autres)
- Séparateurs de date ("Aujourd'hui", "Hier", date longue)
- Avatars initiales pour chaque expéditeur
- Textarea multi-ligne (Shift+Entrée = saut de ligne, Entrée = envoyer)
- Auto-scroll à chaque nouveau message
- Indicateur d'heure sur chaque bulle

### `src/pages/maman/MessageriePrivee.jsx`
- **Layout 2 colonnes** : liste des conversations à gauche (300 px fixe), chat à droite
- Colonne gauche : avatar initiales, nom, dernier message preview, badge de non-lus (numérique), surbrillance de la conversation active
- Colonne droite : header avec avatar + badge "🔒 Chiffrée", identique à MessagerieGroupe (bulles dégradées, séparateurs date, auto-scroll)
- Indicateurs de lecture : ✓ (envoyé) / ✓✓ bleu (lu) sur les bulles "moi"
- Textarea Entrée = envoyer, Shift+Entrée = saut de ligne
- State vide illustré (icône + message d'invite) quand aucune conversation sélectionnée
- Skeleton loader pendant le chargement des membres

---

## 7. Dépendances ajoutées

| Package | Version | Raison |
|---------|---------|--------|
| `recharts` | `^2.x` | Graphiques SVG pour le Reporting |

---

## 8. Notes d'architecture

- **Pas de breaking change** sur les noms de routes, composants ou appels API
- **Rétro-compatibilité CSS** : toutes les pages non modifiées bénéficient automatiquement du nouveau design via la redéfinition des classes `.card`, `.btn-primary`, `.badge-role-*`, etc.
- **`src/index.css`** était vide — remplacé par les imports explicites dans `main.jsx`
- Le `ToastProvider` est positionné à l'intérieur de `AuthProvider` pour avoir accès au contexte auth si nécessaire dans une version future
