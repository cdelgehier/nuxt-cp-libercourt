/**
 * Reset script : vide toutes les tables seedées (TRUNCATE + RESTART IDENTITY).
 * Usage : pnpm db:reset  (enchaîne reset + seed)
 */

import { resolve } from "node:path";
import { config } from "dotenv";

import { neon } from "@neondatabase/serverless";

config({ path: resolve(process.cwd(), ".env") });

async function reset() {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL manquante");

  const sql = neon(databaseUrl);
  await sql`TRUNCATE club_pricing, club_schedules, club_faqs, club_team_members, club_config, events RESTART IDENTITY CASCADE`;
  console.log("🗑️  Tables vidées");
}

reset().catch((e) => {
  console.error("❌ Erreur reset :", e.message);
  process.exit(1);
});
