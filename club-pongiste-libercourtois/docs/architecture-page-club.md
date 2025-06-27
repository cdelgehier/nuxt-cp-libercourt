# Architecture de la page Club - Documentation Nuxt/Vue.js

## Vue d'ensemble

Cette documentation explique comment fonctionne la page `/club` dans votre application Nuxt, depuis l'affichage jusqu'à la récupération des données.

## 🔄 Flux de données global

```mermaid
graph TD
    A[Navigateur pages/club.vue] --> B[Script Setup]
    B --> C[API about]
    B --> D[API stats]
    B --> E[API team]

    C --> F[about.json]
    D --> G[Site PingPocket]
    E --> H[team.json]

    F --> I[Template Vue]
    G --> I
    H --> I

    I --> J[Affichage utilisateur]
```

## 🏗️ Structure de l'architecture

```mermaid
graph TB
    subgraph Frontend[Frontend Vue.js]
        A[pages/club.vue]
        A1[Template HTML]
        A2[Script Setup]
        A3[Composables]
    end

    subgraph Backend[Backend Nitro Server]
        B[server/api/club/about.ts]
        C[server/api/club/stats.ts]
        D[server/api/club/team.ts]
    end

    subgraph Data[Données]
        E[content/club/about.json]
        F[Site externe PingPocket]
        G[content/club/team.json]
    end

    A --> A1
    A --> A2
    A --> A3

    A2 --> B
    A2 --> C
    A2 --> D

    B --> E
    C --> F
    D --> G
```

## 📱 Détail de la page Club

### Structure du fichier `pages/club.vue`

```mermaid
graph TD
    A[pages/club.vue] --> B[Template]
    A --> C[Script Setup]

    B --> B1[Hero Section avec stats]
    B --> B2[Histoire du club]
    B --> B3[Mission et valeurs]
    B --> B4[Equipe dirigeante]
    B --> B5[Installations avec carousel]
    B --> B6[Realisations recentes]

    C --> C1[Types TypeScript]
    C --> C2[Fetch des donnees]
    C --> C3[Logique carousel]
    C --> C4[Fonctions utilitaires]
```

## 🔌 APIs et récupération de données

### 1. API About (Données statiques)

```mermaid
sequenceDiagram
    participant P as pages/club.vue
    participant A as /api/club/about
    participant J as about.json

    P->>A: $fetch('/api/club/about')
    A->>J: import('~/content/club/about.json')
    J-->>A: Données du club (nom, histoire, mission...)
    A-->>P: Retour des données

    Note over P: Affichage des infos statiques<br/>dans le template
```

### 2. API Stats (Données dynamiques)

```mermaid
sequenceDiagram
    participant P as pages/club.vue
    participant A as /api/club/stats
    participant C as Cache mémoire
    participant PP as Site PingPocket

    P->>A: useLazyFetch('/api/club/stats')
    A->>C: Vérifier cache (24h)

    alt Cache valide
        C-->>A: Données en cache
    else Cache expiré
        A->>PP: Scraping HTML
        PP-->>A: HTML de la page club
        A->>A: Extraction regex<br/>(licenciés, équipes)
        A->>C: Mise à jour cache
    end

    A-->>P: Données stats (licenciés, équipes, années)

    Note over P: Mise à jour réactive<br/>des statistiques
```

### 3. Composable useClubStats

```mermaid
graph LR
    A[pages/club.vue] --> B[composables/useClubStats.ts]
    B --> C[/api/club/stats]
    B --> D[Etat reactif]

    D --> D1[clubStats donnees]
    D --> D2[pending chargement]
    D --> D3[error erreurs]
    D --> D4[refresh fonction]
```

## 📦 Types et validation

```mermaid
graph TD
    A[types/index.ts] --> B[Interface ClubStats]
    A --> C[Autres types du club]

    B --> B1[licencies number]
    B --> B2[equipes number]
    B --> B3[annees number]
    B --> B4[lastUpdated string]

    D[server/api/club/stats.ts] --> E[Zod Schema]
    E --> E1[Validation runtime]
    E --> E2[Type safety]
```

## 🎨 Rendu côté client

### Lifecycle du composant

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant N as Nuxt Router
    participant P as pages/club.vue
    participant A as APIs

    U->>N: Navigation vers /club
    N->>P: Chargement du composant

    par Données statiques
        P->>A: $fetch about & team
        A-->>P: Données instantanées
    and Données dynamiques
        P->>A: useLazyFetch stats
        A-->>P: Données avec loading state
    end

    P->>P: onMounted() - Démarrage carousel
    P-->>U: Affichage de la page

    Note over P: Template réactif se met à jour<br/>quand les données arrivent
```

### Gestion du state réactif

```mermaid
graph TD
    A[Script Setup] --> B[Donnees reactives]

    B --> B1[clubInfo statique]
    B --> B2[clubStats dynamique avec pending]
    B --> B3[teamMembers statique]
    B --> B4[currentImageIndex carousel]

    C[Template] --> C1[Affichage conditionnel]
    C1 --> C1A[pending ternaire clubStats]
    C1 --> C1B[v-for sur teamMembers]
    C1 --> C1C[Carousel avec images]

    B --> C
```

## 🎯 Points clés à retenir

### 1. Différence entre les APIs

- **`$fetch`** : Exécution côté serveur (SSR), données disponibles immédiatement
- **`useLazyFetch`** : Hydratation côté client, avec état de chargement

### 2. Architecture en couches

1. **Page Vue** : Interface utilisateur et logique d'affichage
2. **API Routes** : Endpoints côté serveur pour récupérer les données
3. **Content** : Fichiers JSON statiques pour les données du club
4. **Composables** : Logique réutilisable avec gestion d'état

### 3. Types de données

- **Statiques** : Informations du club, équipe (changes peu)
- **Dynamiques** : Statistiques en temps réel (scraping externe)
- **Interactives** : State du carousel, interactions utilisateur

### 4. Performance

- Cache côté serveur (24h pour les stats)
- Lazy loading avec `useLazyFetch`
- SSR pour le contenu statique

Cette architecture permet une séparation claire des responsabilités tout en offrant une expérience utilisateur fluide avec des données toujours à jour.
