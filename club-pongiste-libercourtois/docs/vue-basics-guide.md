# Guide Vue.js - Les bases pour comprendre votre projet

## 🎯 Introduction

Vue.js est un framework JavaScript pour créer des interfaces utilisateur. Nuxt.js utilise Vue.js comme base, donc comprendre Vue vous aidera à comprendre votre projet de club de ping-pong.

## 📁 Structure d'un composant Vue

Un fichier `.vue` contient 3 parties principales :

```vue
<template>
  <!-- HTML avec de la logique Vue -->
</template>

<script setup>
// JavaScript moderne (Composition API)
</script>

<style>
/* CSS pour le style */
</style>
```

## 🧩 Template - La partie HTML

### Affichage de données

```vue
<template>
  <div>
    <!-- Afficher une variable -->
    <h1>{{ clubName }}</h1>

    <!-- Afficher avec condition -->
    <p v-if="isOpen">Le club est ouvert</p>
    <p v-else>Le club est fermé</p>

    <!-- Afficher une liste -->
    <ul>
      <li v-for="member in members" :key="member.id">
        {{ member.name }}
      </li>
    </ul>
  </div>
</template>
```

### Directives Vue importantes

```vue
<template>
  <!-- v-if : affiche seulement si la condition est vraie -->
  <div v-if="showStats">Statistiques visibles</div>

  <!-- v-for : répète pour chaque élément -->
  <div v-for="player in players" :key="player.id">
    {{ player.name }}
  </div>

  <!-- v-show : cache/montre avec CSS -->
  <div v-show="isVisible">Contenu caché/visible</div>

  <!-- :class : ajoute des classes CSS dynamiquement -->
  <div :class="{ 'text-green': isWinner }">Résultat</div>

  <!-- @click : écoute les clics -->
  <button @click="nextImage">Image suivante</button>
</template>
```

## 💻 Script Setup - La logique JavaScript

### Variables réactives

```javascript
<script setup>
import { ref, computed } from 'vue'

// Variable simple qui peut changer
const clubName = ref('Club Pongiste Libercourtois')
const memberCount = ref(78)

// Variable calculée automatiquement
const memberStatus = computed(() => {
  return memberCount.value > 50 ? 'Grand club' : 'Petit club'
})

// Fonction pour changer les données
function addMember() {
  memberCount.value++
}
</script>
```

### Types de variables Vue

```javascript
<script setup>
import { ref, reactive, computed } from 'vue'

// ref() : pour les valeurs simples
const count = ref(0)
const name = ref('Pierre')
const isOpen = ref(true)

// reactive() : pour les objets
const club = reactive({
  name: 'Club Pongiste',
  members: 78,
  location: 'Libercourt'
})

// computed() : calcul automatique
const clubSize = computed(() => {
  return club.members > 50 ? 'Grand' : 'Petit'
})
</script>
```

## 🔄 Réactivité - Comment ça marche

```vue
<template>
  <div>
    <!-- Quand count change, l'affichage change automatiquement -->
    <p>Compteur : {{ count }}</p>
    <button @click="increment">+1</button>

    <!-- Quand l'objet change, l'affichage suit -->
    <p>Club : {{ club.name }} ({{ club.members }} membres)</p>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

// Variable réactive
const count = ref(0);

// Objet réactif
const club = reactive({
  name: "Mon Club",
  members: 50,
});

// Fonction qui modifie les données
function increment() {
  count.value++; // Vue détecte le changement et met à jour l'affichage
}
</script>
```

## 📡 Récupération de données (comme dans votre projet)

### Avec $fetch (données immédiates)

```javascript
<script setup>
  // Récupère les données au chargement de la page const clubInfo = await
  $fetch('/api/club/about') // Maintenant clubInfo contient les données du club
  console.log(clubInfo.name) // "Club Pongiste Libercourtois"
</script>
```

### Avec useLazyFetch (données avec état de chargement)

```javascript
<script setup>
// Récupère les données avec gestion du chargement
const { data: clubStats, pending, error } = await useLazyFetch('/api/club/stats')

// pending = true quand ça charge
// data contient les données quand c'est fini
// error contient les erreurs s'il y en a
</script>
```

```vue
<template>
  <div>
    <!-- Affichage conditionnel pendant le chargement -->
    <p v-if="pending">Chargement...</p>
    <p v-else-if="error">Erreur de chargement</p>
    <div v-else>
      <h2>Statistiques</h2>
      <p>Licenciés : {{ clubStats.licencies }}</p>
      <p>Équipes : {{ clubStats.equipes }}</p>
    </div>
  </div>
</template>
```

## 🎛️ Événements et interactions

```vue
<template>
  <div>
    <!-- Boutons avec actions -->
    <button @click="showInfo">Afficher infos</button>
    <button @click="hideInfo">Cacher infos</button>

    <!-- Navigation du carousel -->
    <button @click="previousImage">← Précédent</button>
    <button @click="nextImage">Suivant →</button>

    <!-- Condition d'affichage -->
    <div v-if="showDetails">
      <p>Détails du club...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const showDetails = ref(false);
const currentImageIndex = ref(0);
const totalImages = ref(5);

function showInfo() {
  showDetails.value = true;
}

function hideInfo() {
  showDetails.value = false;
}

function nextImage() {
  if (currentImageIndex.value < totalImages.value - 1) {
    currentImageIndex.value++;
  } else {
    currentImageIndex.value = 0; // Retour au début
  }
}

function previousImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  } else {
    currentImageIndex.value = totalImages.value - 1; // Va à la fin
  }
}
</script>
```

## 🔧 Cycle de vie des composants

```javascript
<script setup>
import { onMounted, onUnmounted } from 'vue'

// Quand le composant est créé et affiché
onMounted(() => {
  console.log('La page est chargée !')
  // Démarrer le carousel automatique
  startAutoPlay()
})

// Quand le composant est détruit
onUnmounted(() => {
  console.log('La page va être fermée')
  // Nettoyer les timers
  if (intervalId) {
    clearInterval(intervalId)
  }
})

let intervalId = null

function startAutoPlay() {
  intervalId = setInterval(() => {
    nextImage()
  }, 3000) // Change d'image toutes les 3 secondes
}
</script>
```

## 📝 Exemple concret de votre page club

Voici comment fonctionne votre page club, étape par étape :

```vue
<template>
  <div>
    <!-- 1. Affichage des statistiques avec état de chargement -->
    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">
          {{
            pending
              ? "..."
              : (clubStats?.licencies ?? clubInfo.statistics.members)
          }}
        </div>
        <div class="stat-label">Licenciés</div>
      </div>
    </div>

    <!-- 2. Liste des membres de l'équipe -->
    <div class="team">
      <div v-for="member in teamMembers" :key="member.id" class="team-member">
        <h3>{{ member.name }}</h3>
        <p>{{ getRoleDisplayName(member.role) }}</p>
      </div>
    </div>

    <!-- 3. Carousel d'images -->
    <div class="carousel">
      <img
        :src="facilityImages[currentImageIndex].src"
        :alt="facilityImages[currentImageIndex].alt"
      />
      <button @click="previousImage">←</button>
      <button @click="nextImage">→</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 1. Types TypeScript pour la sécurité
interface ClubStats {
  licencies: number
  equipes: number
  annees: number
  lastUpdated: string
}

// 2. Récupération des données
// Données dynamiques (avec loading)
const { data: clubStats, pending } = await useLazyFetch<ClubStats>('/api/club/stats')

// Données statiques (immédiates)
const clubInfo = await $fetch('/api/club/about')
const teamResponse = await $fetch('/api/club/team')
const teamMembers = teamResponse.team || []

// 3. État local du carousel
const currentImageIndex = ref(0)
const facilityImages = [
  { src: '/images/salle1.jpg', alt: 'Salle principale' },
  { src: '/images/salle2.jpg', alt: 'Salle d\'entraînement' },
  { src: '/images/salle3.jpg', alt: 'Vue d\'ensemble' }
]

// 4. Fonctions pour le carousel
function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % facilityImages.length
}

function previousImage() {
  currentImageIndex.value = currentImageIndex.value === 0
    ? facilityImages.length - 1
    : currentImageIndex.value - 1
}

// 5. Fonctions utilitaires
function getRoleDisplayName(role: string): string {
  const roles: Record<string, string> = {
    'president': 'Président',
    'secretary': 'Secrétaire',
    'treasurer': 'Trésorier'
  }
  return roles[role] || role
}

// 6. Cycle de vie - carousel automatique
let intervalId: NodeJS.Timeout | null = null

onMounted(() => {
  // Démarre le carousel automatique après 3 secondes
  setTimeout(() => {
    intervalId = setInterval(() => {
      nextImage()
    }, 5000) // Change toutes les 5 secondes
  }, 3000)
})

onUnmounted(() => {
  // Nettoie le timer quand on quitte la page
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
```

## 🎯 Points clés à retenir

### 1. Réactivité automatique

- Quand une variable `ref()` change, l'affichage se met à jour automatiquement
- Pas besoin de manipuler le DOM manuellement

### 2. Directives Vue

- `v-if` : affiche/cache selon une condition
- `v-for` : répète pour chaque élément d'une liste
- `@click` : écoute les clics
- `:class` : ajoute des classes CSS dynamiquement

### 3. Composition API (script setup)

- `ref()` : variables simples réactives
- `reactive()` : objets réactifs
- `computed()` : calculs automatiques
- `onMounted()` : code à exécuter au chargement

### 4. Fetch de données

- `$fetch` : données immédiates (SSR)
- `useLazyFetch` : données avec état de chargement
- Gestion automatique du cache et des erreurs

### 5. TypeScript

- Typage des données pour éviter les erreurs
- Autocomplétion dans l'éditeur
- Validation à la compilation

Cette base devrait vous aider à mieux comprendre comment fonctionne votre page club et Vue.js en général !
