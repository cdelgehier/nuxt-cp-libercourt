# Guide de développement

## Démarrage

```bash
# 1. Installer les dépendances
pnpm install

# 2. Créer le .env (copier depuis l'exemple)
cp .env.example .env
# Remplir DATABASE_URL, SMARTPING_*, etc.

# 3. Pousser le schéma DB (première fois)
pnpm db:push

# 4. Seeder les données
pnpm db:seed

# 5. Lancer le serveur de dev
pnpm dev            # http://localhost:3000
# ou avec Netlify CLI (injecte les vars Netlify)
npx netlify-cli dev # http://localhost:8888
```

---

## Ajouter une fonctionnalité

### 1. Nouvelle table DB

Editer `server/domains/<domaine>/schema.ts` :

```typescript
export const clubSponsors = pgTable("club_sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  active: boolean("active").default(true),
});
```

Puis :

```bash
pnpm db:push       # En dev (applique directement)
# ou
pnpm db:generate   # Génère une migration SQL
pnpm db:migrate    # Applique la migration
```

### 2. Nouvelle route API

Créer `server/api/<domaine>/<nom>.get.ts` :

```typescript
import { getSponsors } from "~~/server/domains/club/service";

export default defineEventHandler(() => getSponsors());
```

Règles :

- La route délègue au service, pas de logique dans le handler
- Utiliser `~~` (racine du projet) et non `~` (répertoire `app/`)
- Nommer le fichier `[nom].get.ts`, `.post.ts`, `.delete.ts` selon la méthode HTTP

### 3. Nouveau composable

Créer `app/composables/useSponsors.ts` :

```typescript
export const useSponsors = () => {
  const { data, pending, error } = useLazyFetch("/api/club/sponsors");
  return { sponsors: data, pending, error };
};
```

### 4. Nouvelle page admin

Créer `app/pages/admin/sponsors.vue` avec le layout admin :

```vue
<script setup>
definePageMeta({ layout: "admin", middleware: "admin" });
</script>
```

---

## Modifier des données existantes

### Via Drizzle Studio (interface graphique)

```bash
pnpm db:studio
# Ouvre http://local.drizzle.studio
```

### Via le seed (réinitialisation complète)

Modifier le fichier JSON source dans `content/`, puis :

```bash
pnpm db:reset    # Vide les tables + reseed
```

> **Attention :** `db:reset` supprime TOUTES les données des tables seedées,
> y compris les inscriptions aux événements.

---

## TypeScript

Le projet utilise TypeScript strict avec `noUncheckedIndexedAccess`.

Règles importantes :

- Les accès tableau/Record retournent `T | undefined` → utiliser `!` ou `?? fallback`
- Alias d'imports : `~~` pointe vers la racine, `~` pointe vers `app/`
- Les types DB (via Drizzle) diffèrent des types frontend (legacy `types/index.ts`)

Vérification :

```bash
pnpm typecheck
```

---

## Structure d'un domaine

```typescript
// schema.ts — définit la table
export const clubFaqs = pgTable('club_faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  category: text('category').notNull(),
  isPopular: boolean('is_popular').default(false),
})

// types.ts — types TS + schémas Zod
export type Faq = InferSelectModel<typeof clubFaqs>
export type InsertFaq = InferInsertModel<typeof clubFaqs>
export const createFaqSchema = z.object({ question: z.string().min(1), ... })

// repository.ts — accès DB pur
export async function getAllFaqs() {
  return db.select().from(clubFaqs).orderBy(clubFaqs.sortOrder)
}

// service.ts — logique métier
export async function getFaqs() {
  const faqs = await getAllFaqs()
  // grouper par catégorie, calculer stats, etc.
  return { categories, popular, stats }
}
```

---

## Conventions de nommage

| Élément      | Convention           | Exemple                    |
| ------------ | -------------------- | -------------------------- |
| Fichiers API | kebab-case + méthode | `schedules-pricing.get.ts` |
| Composables  | camelCase avec `use` | `useClubFaq.ts`            |
| Composants   | PascalCase           | `EventCard.vue`            |
| Tables DB    | snake_case           | `club_team_members`        |
| Colonnes DB  | snake_case           | `is_popular`               |
| Props TS     | camelCase            | `isPopular`                |

---

## Déploiement

Le déploiement est automatique via Netlify sur push sur `main`.

```bash
# Build local (vérification)
pnpm build

# Les migrations DB doivent être appliquées manuellement avant déploiement
pnpm db:migrate
```

Variables Netlify à configurer (une seule fois) :

- `NETLIFY_DATABASE_URL` — fourni automatiquement par `netlify db init`
- `SMARTPING_*` — credentials FFTT
- `NUXT_OIDC_*` — credentials Authentik
- `FACEBOOK_*` — token page Facebook
