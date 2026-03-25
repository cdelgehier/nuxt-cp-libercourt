![Nuxt](https://img.shields.io/badge/Nuxt-4-00C58E.svg?style=for-the-badge&logo=nuxt.js&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D.svg?style=for-the-badge&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)
![DrizzleORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F.svg?style=for-the-badge&logo=drizzle&logoColor=black)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E5BF.svg?style=for-the-badge&logo=postgresql&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7.svg?style=for-the-badge&logo=netlify&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220.svg?style=for-the-badge&logo=pnpm&logoColor=white)

# Club Pongiste Libercourtois

Site officiel du Club Pongiste Libercourtois — club de tennis de table basé à Libercourt (62).

## Stack technique

- **Nuxt 4** (architecture `app/`, SSR, Netlify)
- **DDD** — domaines `club`, `events`, `competition`, `news`, `identity`
- **Neon PostgreSQL + Drizzle ORM** — données dynamiques avec validation Zod
- **SmartPing FFTT** — données en temps réel (équipes, classements, matchs)
- **nuxt-oidc-auth + Authentik** — authentification admin
- **@nuxt/ui v3 + Tailwind CSS** — UI adaptative dark/light

## Démarrage rapide

```bash
cd club-pongiste-libercourtois

# Installer les dépendances
pnpm install

# Copier et configurer les variables d'environnement
cp .env.example .env

# Créer les tables en DB
pnpm db:push

# Alimenter la DB depuis les JSON source
pnpm db:seed

# Lancer le serveur de développement
pnpm dev
```

## Scripts disponibles

| Commande         | Description                    |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Serveur de développement       |
| `pnpm build`     | Build production (Netlify)     |
| `pnpm typecheck` | Vérification TypeScript        |
| `pnpm lint`      | ESLint (fix auto)              |
| `pnpm test:unit` | Tests unitaires Vitest         |
| `pnpm test:e2e`  | Tests end-to-end Playwright    |
| `pnpm db:push`   | Créer/mettre à jour les tables |
| `pnpm db:seed`   | Alimenter la DB                |
| `pnpm db:reset`  | Réinitialiser et re-seeder     |
| `pnpm db:studio` | Interface Drizzle Studio       |

## Variables d'environnement

Voir [`.env.example`](./club-pongiste-libercourtois/.env.example) pour la liste complète.

```env
DATABASE_URL=postgresql://...
SMARTPING_APP_CODE=SX020
SMARTPING_PASSWORD=
SMARTPING_EMAIL=
NUXT_OIDC_ISSUER=https://auth.example.com/application/o/libercourt/
NUXT_OIDC_CLIENT_ID=
NUXT_OIDC_CLIENT_SECRET=
```

## Documentation

- [Architecture](./club-pongiste-libercourtois/docs/architecture.md) — stack, DDD, auth, DB
- [Flux de données](./club-pongiste-libercourtois/docs/data-flow.md) — API par page, Zod, SmartPing
- [Guide développement](./club-pongiste-libercourtois/docs/development.md) — conventions, ajout de fonctionnalités

## Déploiement Netlify

- **Build command** : `pnpm build`
- **Publish directory** : `.output/public`
- **Node version** : 20+
- **Package manager** : pnpm (détection automatique)

---

Club Pongiste Libercourtois — depuis 1970 · Par Cédric DELGEHIER
