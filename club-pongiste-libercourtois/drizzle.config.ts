import { defineConfig } from "drizzle-kit";

// pg v8+ treats sslmode=require as verify-full, which breaks drizzle-kit migrations.
// Replacing with sslmode=verify-full makes the intent explicit and fixes the connection.
const rawUrl =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
  process.env.NETLIFY_DATABASE_URL ??
  process.env.DATABASE_URL!;

const migrationUrl = rawUrl.replace("sslmode=require", "sslmode=verify-full");

export default defineConfig({
  schema: [
    "./server/domains/club/schema.ts",
    "./server/domains/events/schema.ts",
    "./server/domains/tournament/schema.ts",
  ],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Utilise la connexion non-poolée pour les migrations (requise par drizzle-kit)
    url: migrationUrl,
  },
});
