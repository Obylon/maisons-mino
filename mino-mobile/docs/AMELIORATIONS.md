# Maisons MINO — Refonte Premium v2.0
**Date :** Octobre 2026  
**Scope :** Application mobile Expo Go (`mino-mobile`)

---

## Vue d'ensemble

Refonte complète de l'application mobile pour atteindre un niveau de sophistication digne d'une présentation à un groupe médical. Chaque composant, écran et interaction a été repensé autour d'un système de design cohérent et professionnel.

---

## 1. Système de design (`src/theme/index.js`)

### Palette de couleurs medical-luxury
- **Navy profond** `#0A2342` — couleur de marque principale
- **Bleu médical** `#1B4F8A` — couleur primaire
- **Teal accent** `#0D9488` — accent secondaire
- **Fond** `#F0F4F8` — background neutre élégant
- **Surface** `#FFFFFF` — cartes et modals

### Couleurs par rôle
| Rôle | Primaire | Gradient |
|------|----------|----------|
| MAMAN | `#1D4ED8` (bleu roi) | `#1E3A8A → #2563EB` |
| PARTENAIRE | `#92400E` (ambre) | `#78350F → #D97706` |
| PROFESSIONNEL | `#065F46` (vert émeraude) | `#064E3B → #059669` |
| COORDINATRICE | `#4C1D95` (violet) | `#3B0764 → #7C3AED` |

### Tokens exportés
- **spacing** : xs(4), sm(8), md(12), lg(16), xl(20), xxl(24), xxxl(32)
- **typography** : h1–h4, body, caption, label
- **shadows** : sm, md, lg, xl (avec elevation Android)
- **radii** : sm(8), md(12), lg(16), xl(20), full(999)

---

## 2. Composants mis à jour

### `Screen.jsx` — Composant de base repensé
- Fond `#F0F4F8` au lieu de blanc plat
- Support header avec gradient `LinearGradient` via prop `headerGradient`
- Props supplémentaires : `title`, `subtitle`, `headerContent`
- `RefreshControl` avec couleur de brand

### `Card.jsx` — Cartes premium
- Radius 16px, shadows profondes
- Variants : `default`, `elevated`, `flat`
- `StatCard` redesigné : valeur en 34px/800 weight, icône optionnelle
- Export `CardTitle` avec support couleur

### `Btn.jsx` — Boutons avec dégradé
- **Gradient automatique** via `expo-linear-gradient` pour les variantes colorées
- **Haptic feedback** via `expo-haptics` (légère vibration au tap)
- Variantes : `primary`, `secondary`, `danger`, `ghost`, `outline`, `success`
- Tailles : `sm`, `md`, `lg`
- Rétrocompatibilité : props `secondary` et `danger` fonctionnent toujours

---

## 3. Nouveaux composants

### `Avatar.jsx`
Avatars avec initiales générées automatiquement depuis le nom. Couleur unique par personne (déterministe depuis le hash du nom). Tailles sm/md/lg/xl. Badge de statut optionnel.

### `EmptyState.jsx`
État vide élégant avec grande icône emoji, titre, sous-titre, et bouton d'action optionnel. Remplace les `<Text style={{ color: "#888" }}>Aucun...</Text>` éparpillés.

### `Badge.jsx`
Badge de notification positionnable (absolu top-right). Support chiffre (avec max 99+) et point. Intégré dans le custom tab bar pour les messages non lus.

### `Input.jsx`
TextInput premium avec :
- Label flottant au-dessus du champ
- Icône gauche (Ionicons)
- Border bleue au focus
- Border rouge en erreur
- Bouton œil pour les mots de passe
- Support multiline

### `Chip.jsx`
Tag/filtre cliquable. Variantes `outlined` (par défaut) et `filled` (sélectionné). Couleur personnalisable par rôle. Utilisé pour les filtres rôle dans UtilisateursScreen.

### `SectionTitle.jsx`
Titre de section avec barre verticale colorée et sous-titre optionnel. Remplace les en-têtes de section hétérogènes.

---

## 4. Nouveau contexte : `BadgeContext.jsx`

Gestion centralisée des badges de notification. Rafraîchit automatiquement toutes les 30 secondes. Expose `{ groupeBadge, priveBadge, refreshBadges }`.

- `groupeBadge` : messages non lus dans le groupe (MAMAN uniquement)
- `priveBadge` : messages privés non lus (MAMAN uniquement)
- Affiché dans le tab bar sur les onglets correspondants

---

## 5. Écran de connexion — App.js

Refonte complète de niveau enterprise :

- **Header gradient** `#0A2342 → #1B4F8A` occupant 38% de l'écran
- **Logo "M"** stylisé dans cercle blanc avec shadow
- **Animation fade + slide** au montage (Animated)
- **Écran splash** avec gradient pendant le chargement du token
- **Inputs premium** (composant Input avec icônes)
- **Bouton connexion** avec gradient horizontal
- **KeyboardAvoidingView** correct

---

## 6. Navigation — Custom Tab Bar

Le tab bar par défaut React Navigation est remplacé par `CustomTabBar` :

- **Fond blanc** avec shadow subtile (`elevation: 8`)
- **Icônes Ionicons** (outline pour inactif, filled pour actif)
- **Pill colorée** en fond de l'icône active (couleur du rôle)
- **Badge de notification** sur les onglets messagerie
- **Safe area** respectée (padding bottom)
- **Hauteur 70px** + safe area

---

## 7. Écrans redessinés

### Maman — `AccueilScreen.jsx`
- **Hero card** gradient bleu avec avatar et prénom
- **Timeline grossesse/bébé** : indicateur SA ou jours de bébé
- **Countdown** prochain atelier ("dans X jours")
- **Bannière messages non lus** cliquable (navigue vers messagerie groupe)
- **Grille accès rapide** animée (spring stagger) avec icônes colorées

### Coordinatrice — `DashboardScreen.jsx`
- **Hero card** gradient violet avec avatar
- **3 stat pills** : Cohortes, Questionnaires, Ateliers sans professionnel
- **Grille d'actions rapides** : 6 raccourcis vers les fonctionnalités

### Coordinatrice — `MenuScreen.jsx`
- Grille **2 colonnes** de cartes colorées au lieu d'une liste
- Icônes Ionicons pour chaque section
- Couleur de fond par catégorie

### Coordinatrice — `UtilisateursScreen.jsx`
- **Barre de recherche** pour filtrer par nom/email
- **Chips de filtre par rôle** (horizontal scrollable)
- **Avatars** avec initiales dans chaque item
- **Badges de rôle** colorés
- Modal créer compte avec les composants Input et Chip

### Maman — `CalendrierScreen.jsx`
- **Groupement par mois** avec en-têtes
- **Barre latérale colorée** par type d'atelier
- **Badge type** et **badge "Inscrite"** avec checkmark
- Icônes pour date et intervenant
- Bouton "Se désinscrire" en variante outline

### Maman — `MessagerieGroupeScreen.jsx`
- **Bulles iMessage** avec ombre subtile
- **Séparateurs de date** ("Aujourd'hui", "Hier", date)
- **Avatar** des autres participants dans les bulles
- **Indicateur ✓✓** sur les messages envoyés
- Barre d'envoi avec input arrondi et bouton icône
- Intégration `BadgeContext` pour marquer comme lu

### Partenaire — `AccueilScreen.jsx`
- **Hero card** gradient orange avec avatar
- **Hero card prochain atelier** en grand gradient ambre
- Timeline visuelle avec points colorés
- Séparation passés/à venir

### Profil — `ProfilScreen.jsx` (partagé tous rôles)
- **Header gradient** couleur du rôle avec grand avatar
- **Badge de rôle** dans le header
- Sections dans des cartes séparées (Informations / Sécurité)
- Composants Input premium

---

## 8. Packages installés

```
expo-linear-gradient  — dégradés natifs
expo-haptics          — retour haptique sur les boutons
```

Note : `@expo/vector-icons` était déjà disponible via Expo SDK (pas de nouvelle installation).

---

## 9. Bugs corrigés

| Bug | Fix |
|-----|-----|
| `Screen` acceptait `loading` mais la prop était `refreshing` | Tous les écrans utilisent désormais `refreshing` |
| `DetailCohorteScreen` comparaison `cohorteId` numérique vs string | `String(g.cohorteId) === String(id)` |
| Web `MessagerieCoordinatrice` : `.filter()` sur un objet paginated | `(res.data.content ?? res.data).filter(...)` |
| Mobile `MessageriePartenaireScreen` : détection `isMe` par prénom (fragile) | `item.expediteurId === user?.utilisateurId` |
| `UtilisateursScreen` : création maman sans cohorteId | Ajout sélecteur de cohorte dans le modal |
| `BadgeContext` : référence à `messageApi.nonLusPrives` inexistant | Corrigé en `messageApi.nonLusTotal` |

---

## 10. Architecture des fichiers

```
mino-mobile/
├── App.js                          ← Écran connexion premium + splash
├── src/
│   ├── theme/
│   │   └── index.js                ← Système de design (NOUVEAU)
│   ├── components/
│   │   ├── Screen.jsx              ← Mis à jour (header gradient)
│   │   ├── Card.jsx                ← Mis à jour (variants, StatCard)
│   │   ├── Btn.jsx                 ← Mis à jour (gradient, haptics)
│   │   ├── Avatar.jsx              ← NOUVEAU
│   │   ├── EmptyState.jsx          ← NOUVEAU
│   │   ├── Badge.jsx               ← NOUVEAU
│   │   ├── Input.jsx               ← NOUVEAU
│   │   ├── Chip.jsx                ← NOUVEAU
│   │   └── SectionTitle.jsx        ← NOUVEAU
│   ├── context/
│   │   ├── AuthContext.jsx         ← Inchangé
│   │   └── BadgeContext.jsx        ← NOUVEAU
│   ├── navigation/
│   │   └── AppNavigator.jsx        ← Mis à jour (custom tab bar)
│   └── screens/
│       ├── ProfilScreen.jsx        ← Refonte premium
│       ├── maman/
│       │   ├── AccueilScreen.jsx   ← Refonte premium
│       │   ├── CalendrierScreen.jsx ← Refonte premium
│       │   └── MessagerieGroupeScreen.jsx ← Refonte premium
│       ├── partenaire/
│       │   └── AccueilScreen.jsx   ← Refonte premium
│       └── coordinatrice/
│           ├── DashboardScreen.jsx ← Refonte premium
│           ├── MenuScreen.jsx      ← Refonte grille 2 colonnes
│           └── UtilisateursScreen.jsx ← Refonte + recherche + filtres
└── docs/
    └── AMELIORATIONS.md            ← Ce fichier
```

---

## 11. Guide d'utilisation des nouveaux composants

### Utiliser le thème
```js
import { colors, spacing, typography, shadows } from '../../theme';

// Utilisation dans StyleSheet
const s = StyleSheet.create({
  container: { backgroundColor: colors.background },
  title: { ...typography.h2 },
  card: { ...shadows.lg, borderRadius: 16 },
});
```

### Composant Input
```jsx
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="exemple@email.fr"
  keyboardType="email-address"
  autoCapitalize="none"
  leftIcon="mail-outline"
  error={emailError}
/>
```

### Composant Btn avec gradient
```jsx
// Primary gradient (défaut)
<Btn label="Se connecter" onPress={handleLogin} loading={loading} />

// Variantes
<Btn label="Annuler" onPress={onClose} variant="ghost" />
<Btn label="Supprimer" onPress={handleDelete} variant="danger" />
<Btn label="Petit" onPress={fn} size="sm" />
```

### Composant Avatar
```jsx
<Avatar prenom="Marie" nom="Dupont" size="lg" />
<Avatar prenom="Joyce" nom="" size="xl" statusColor="#22C55E" />
```

### Composant EmptyState
```jsx
<EmptyState
  icon="📭"
  title="Aucun résultat"
  subtitle="Modifiez votre recherche pour trouver ce que vous cherchez."
  actionLabel="Effacer la recherche"
  onAction={() => setSearch("")}
/>
```

### Composant Chip (filtres)
```jsx
<ScrollView horizontal>
  {["Tous", "MAMAN", "PROFESSIONNEL"].map((r) => (
    <Chip
      key={r}
      label={r}
      selected={filtre === r}
      onPress={() => setFiltre(r)}
      color={ROLE_COLOR[r] || colors.primary}
    />
  ))}
</ScrollView>
```

### Screen avec header gradient
```jsx
// Screen sans header natif React Navigation
<Screen
  headerGradient={colors.MAMAN.gradient}
  title="Calendrier"
  subtitle="Vos ateliers à venir"
  onRefresh={charger}
  refreshing={loading}
>
  {/* contenu */}
</Screen>
```

---

## 12. Recommandations futures

1. **Notifications push** : intégrer `expo-notifications` pour alertes en temps réel
2. **Mode hors-ligne** : mise en cache des données avec `@react-native-async-storage`
3. **Animations de navigation** : transitions personnalisées entre écrans
4. **Dark mode** : étendre le thème avec des tokens dark
5. **Biométrie** : déverrouillage par empreinte/Face ID via `expo-local-authentication`
6. **PDF** : export des comptes rendus en PDF via `expo-print`
