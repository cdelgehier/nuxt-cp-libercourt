import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http'
import { drizzle as postgresDrizzle } from 'drizzle-orm/node-postgres'
import { neon } from '@neondatabase/serverless'
import { Pool } from 'pg'
import * as clubSchema from '../domains/club/schema'
import * as eventsSchema from '../domains/events/schema'
import * as tournamentSchema from '../domains/tournament/schema'

// En local : DATABASE_URL dans .env
// Sur Netlify : NETLIFY_DATABASE_URL injecté automatiquement par @netlify/neon
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL manquante. Ajoutez DATABASE_URL dans .env (local) ou utilisez netlify dev (Netlify).'
  )
}

const schema = { ...clubSchema, ...eventsSchema, ...tournamentSchema }
// Neon HTTP only supports Neon hosts. Local PostgreSQL needs a TCP connection.
export const db = new URL(databaseUrl).hostname.endsWith('.neon.tech')
  ? neonDrizzle(neon(databaseUrl), { schema })
  : postgresDrizzle(new Pool({ connectionString: databaseUrl, max: 3 }), {
      schema
    })

export type Database = typeof db
