# Vue.js expliqué avec votre page Club - Guide pratique

## 🎯 On va décortiquer votre fichier `pages/club.vue`

Au lieu de théorie abstraite, regardons comment **votre vraie page club** fonctionne !

## 📂 Structure de votre fichier club.vue

```vue
<!-- Votre fichier fait 518 lignes, divisé en 3 parties : -->

<template>
  <!-- HTML de la page (lignes 1-320) -->
</template>

<script setup>
<!-- JavaScript logique (lignes 321-518) -->
</script>

<!-- Pas de <style> car vous utilisez Tailwind CSS -->
```

## 🧩 Partie Template - Votre HTML

### 1. Section Hero avec statistiques (lignes 4-35)

```vue
<!-- VOTRE CODE RÉEL : -->
<section
  class="bg-gradient-to-br from-club-navy via-club-green to-club-navy py-16 lg:py-24"
></section>
```

**Explication :**

- `{{ clubInfo.name }}` → Affiche "Club Pongiste Libercourtois"
- `{{ clubInfo.foundedYear }}` → Affiche "1970"
- Ces données viennent de votre fichier `content/club/about.json`

### 2. Cartes de statistiques avec état de chargement (lignes 16-34)

```vue
<!-- VOTRE CODE RÉEL : -->
<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
  <div class="text-3xl font-bold text-club-yellow">
    {{ pending ? '...' : clubStats?.licencies ?? clubInfo.statistics.members }}
  </div>
  <div class="text-sm text-gray-300">Licenciés</div>
</div>
```

**Explication :**

- `pending` = true quand les données se chargent
- `clubStats?.licencies` = nombre de licenciés du site PingPocket (78)
- `clubInfo.statistics.members` = valeur par défaut si pas de données
- `??` = "ou sinon" (si la première valeur est null/undefined)

### 3. Boucle sur les valeurs du club (lignes 70-80)

```vue
<!-- VOTRE CODE RÉEL : -->
<div
  v-for="(value, index) in clubInfo.values"
  :key="index"
  class="adaptive-card rounded-lg p-6 text-center"
>
  <div class="w-12 h-12 bg-club-yellow rounded-full">
    <UIcon :name="getValueIcon(index)" class="adaptive-text-primary text-xl" />
  </div>
  <h3 class="font-semibold adaptive-title">{{ value }}</h3>
</div>
```

**Explication :**

- `v-for="(value, index) in clubInfo.values"` → Répète pour chaque valeur
- `clubInfo.values` contient : ["Esprit d'équipe", "Respect et fair-play", ...]
- `:key="index"` → Vue a besoin d'un identifiant unique pour chaque élément
- `getValueIcon(index)` → Fonction qui retourne une icône selon la position

### 4. Carousel d'images (lignes 200-230)

```vue
<!-- VOTRE CODE RÉEL : -->
<div class="relative rounded-xl shadow-xl overflow-hidden">
  <img
    :src="facilityImages[currentImageIndex].src"
    :alt="facilityImages[currentImageIndex].alt"
    class="w-full h-80 object-cover transition-all duration-500"
  >

  <!-- Boutons de navigation -->
  <button
    @click="previousImage"
    class="absolute left-4 top-1/2 transform -translate-y-1/2"
  >
    <UIcon name="i-heroicons-chevron-left" class="text-2xl" />
  </button>

  <button
    @click="nextImage"
    class="absolute right-4 top-1/2 transform -translate-y-1/2"
  >
    <UIcon name="i-heroicons-chevron-right" class="text-2xl" />
  </button>
</div>
```

**Explication :**

- `facilityImages[currentImageIndex]` → Image actuelle du tableau
- `currentImageIndex` = 0, 1, ou 2 (votre position dans le carousel)
- `@click="previousImage"` → Quand on clique, appelle la fonction `previousImage()`
- `:src` et `:alt` → Liaison dynamique aux propriétés de l'image

## 💻 Partie Script - Votre logique JavaScript

### 1. Types TypeScript (lignes 398-403)

```typescript
// VOTRE CODE RÉEL :
interface ClubStats {
  licencies: number;
  equipes: number;
  annees: number;
  lastUpdated: string;
}
```

**Explication :**

- Définit la structure des données de statistiques
- TypeScript vérifie que vous utilisez les bonnes propriétés
- Autocomplétion dans votre éditeur

### 2. Récupération des données (lignes 405-420)

```typescript
// VOTRE CODE RÉEL :
// Données dynamiques (temps réel depuis PingPocket)
const { data: clubStats, pending } = await useLazyFetch<ClubStats>(
  "/api/club/stats",
  {
    key: "club-page-stats",
    default: () => ({
      licencies: 78,
      equipes: 9,
      annees: new Date().getFullYear() - 1970,
      lastUpdated: new Date().toISOString(),
    }),
  },
);

// Données statiques (depuis votre fichier JSON)
const clubInfo = await $fetch("/api/club/about");

// Équipe dirigeante
const teamResponse = (await $fetch("/api/club/team")) as any;
const teamMembers = teamResponse.team || [];
```

**Explication :**

- `useLazyFetch` → Charge les données avec un état de chargement (`pending`)
- `$fetch` → Charge les données immédiatement
- `default: () => ({...})` → Valeurs par défaut pendant le chargement
- Les données viennent de vos APIs dans `server/api/club/`

### 3. État du carousel (lignes 422-430)

```typescript
// VOTRE CODE RÉEL :
const facilityImages = [
  {
    src: "/images/salle-deladerriere.jpg",
    alt: "Vue de la salle depuis le fond",
  },
  {
    src: "/images/salle-deladerriere-1.jpg",
    alt: "Vue de la salle depuis l'entree",
  },
  {
    src: "/images/grande-salle.jpg",
    alt: "Vue d'ensemble de la grande salle",
  },
];

const currentImageIndex = ref(0);
```

**Explication :**

- `facilityImages` → Tableau avec 3 images de votre salle
- `currentImageIndex = ref(0)` → Variable réactive qui commence à 0
- `ref()` → Rend la variable réactive (Vue surveille les changements)

### 4. Fonctions de navigation (lignes 433-450)

```typescript
// VOTRE CODE RÉEL :
function nextImage() {
  currentImageIndex.value =
    (currentImageIndex.value + 1) % facilityImages.length;
  pauseAutoPlay();
}

function previousImage() {
  currentImageIndex.value =
    currentImageIndex.value === 0
      ? facilityImages.length - 1
      : currentImageIndex.value - 1;
  pauseAutoPlay();
}

function goToImage(index: number) {
  currentImageIndex.value = index;
  pauseAutoPlay();
}
```

**Explication :**

- `nextImage()` → Passe à l'image suivante (ou revient à 0 à la fin)
- `% facilityImages.length` → Modulo pour faire une boucle (0,1,2,0,1,2...)
- `currentImageIndex.value` → Avec `ref()`, on doit utiliser `.value`
- `pauseAutoPlay()` → Arrête le défilement automatique quand on clique

### 5. Carousel automatique (lignes 452-480)

```typescript
// VOTRE CODE RÉEL :
let intervalId: NodeJS.Timeout | null = null;

function startAutoPlay() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(() => {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % facilityImages.length;
  }, 5000); // Change d'image toutes les 5 secondes
}

function pauseAutoPlay() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  // Resume auto-play after 10 seconds of inactivity
  setTimeout(() => {
    startAutoPlay();
  }, 10000);
}

onMounted(() => {
  // Start auto-play after 3 seconds
  setTimeout(() => {
    startAutoPlay();
  }, 3000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
```

**Explication :**

- `intervalId` → Stocke la référence du timer
- `setInterval(() => {...}, 5000)` → Exécute le code toutes les 5 secondes
- `onMounted()` → Quand la page est chargée, démarre le carousel après 3s
- `onUnmounted()` → Quand on quitte la page, nettoie le timer
- `pauseAutoPlay()` → Pause 10s puis reprend (quand l'utilisateur interagit)

### 6. Fonctions utilitaires (lignes 490-518)

```typescript
// VOTRE CODE RÉEL :
function getRoleDisplayName(role: string): string {
  const roles: Record<string, string> = {
    president: "Président",
    "vice-president": "Vice-Président",
    secretary: "Secrétaire adjoint",
    treasurer: "Trésorier",
    coach: "Entraîneur",
    member: "Membre du bureau",
  };
  return roles[role] || role;
}

function getValueIcon(index: number): string {
  const icons = [
    "i-heroicons-users",
    "i-heroicons-heart",
    "i-heroicons-arrow-trending-up",
    "i-heroicons-face-smile",
    "i-heroicons-academic-cap",
  ];
  return icons[index] || "i-heroicons-star";
}
```

**Explication :**

- `getRoleDisplayName()` → Convertit 'president' en 'Président'
- `Record<string, string>` → Type TypeScript pour un objet clé-valeur
- `roles[role] || role` → Retourne la traduction ou le rôle original
- `getValueIcon()` → Retourne une icône selon la position (0=users, 1=heart...)

## 🔄 Comment tout s'articule

### 1. Au chargement de la page

```text
1. Nuxt charge pages/club.vue
2. Script setup s'exécute :
   - Récupère clubInfo depuis /api/club/about (immédiat)
   - Récupère clubStats depuis /api/club/stats (avec loading)
   - Récupère teamMembers depuis /api/club/team (immédiat)
3. Template s'affiche avec les données disponibles
4. Après 3s, le carousel automatique démarre
```

### 2. Quand l'utilisateur clique "Image suivante"

```text
1. @click="nextImage" détecte le clic
2. nextImage() s'exécute :
   - currentImageIndex.value passe de 0 à 1
   - pauseAutoPlay() arrête le timer
3. Template se met à jour automatiquement :
   - facilityImages[1] remplace facilityImages[0]
   - L'image change instantanément
4. Après 10s, le carousel automatique reprend
```

### 3. Quand les stats arrivent du serveur

```text
1. API /api/club/stats termine son scraping de PingPocket
2. clubStats.value se remplit avec les vraies données
3. pending devient false
4. Template se met à jour automatiquement :
   - "..." devient "78" (nombre de licenciés)
   - Sans aucune intervention de votre part !
```

## 🎯 Les concepts Vue.js dans votre projet

### Réactivité

- `currentImageIndex = ref(0)` → Quand ça change, l'image change
- `pending` → Quand ça devient false, "..." devient les vraies stats

### Directives

- `v-for="value in clubInfo.values"` → Crée une carte pour chaque valeur
- `v-if="pending"` → Affiche "..." pendant le chargement
- `@click="nextImage"` → Déclenche la fonction au clic

### Composition API

- `onMounted()` → Code à exécuter au chargement
- `ref()` → Variables réactives
- `await $fetch()` → Récupération de données

### Props et liaisons

- `:src="image.src"` → Lie dynamiquement l'attribut src
- `{{ clubInfo.name }}` → Affiche la valeur dans le HTML

Voilà ! Votre page club utilise tous ces concepts Vue.js de manière très concrète. Chaque ligne a un but précis pour créer une expérience utilisateur fluide.
