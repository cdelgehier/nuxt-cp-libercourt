import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as clubSchema from "../domains/club/schema";
import * as eventsSchema from "../domains/events/schema";

// En local : DATABASE_URL dans .env
// Sur Netlify : NETLIFY_DATABASE_URL injecté automatiquement par @netlify/neon
const databaseUrl =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL manquante. Ajoutez DATABASE_URL dans .env (local) ou utilisez netlify dev (Netlify).",
  );
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, {
  schema: { ...clubSchema, ...eventsSchema },
});

export type Database = typeof db;
