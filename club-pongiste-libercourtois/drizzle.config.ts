import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./server/domains/club/schema.ts",
    "./server/domains/events/schema.ts",
  ],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Utilise la connexion non-poolée pour les migrations (requise par drizzle-kit)
    url:
      process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
      process.env.NETLIFY_DATABASE_URL ??
      process.env.DATABASE_URL!,
  },
});
