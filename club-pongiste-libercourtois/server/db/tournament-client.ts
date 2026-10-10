import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { sql } from 'drizzle-orm'
import * as schema from '../domains/tournament/schema'

const connectionString =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL
if (!connectionString)
  throw new Error('Connexion PostgreSQL manquante pour les tournois.')
const pool = new Pool({
  connectionString: connectionString.replace(
    'sslmode=require',
    'sslmode=verify-full'
  ),
  max: 3
})
/** Tournament writes need interactive transactions, which neon-http cannot provide. */
export const tournamentDb = drizzle(pool, { schema })
type Transaction = Parameters<Parameters<typeof tournamentDb.transaction>[0]>[0]
const transactions = new AsyncLocalStorage<Transaction>()
/** Existing repositories participate in the transaction opened by their API handler. */
export const tournamentStore = new Proxy(tournamentDb, {
  get(target, property) {
    const connection = transactions.getStore() ?? target
    const value = Reflect.get(connection, property)
    return typeof value === 'function' ? value.bind(connection) : value
  }
})
export async function withTournamentWrite<T>(
  tournamentId: number,
  write: () => Promise<T>
): Promise<T> {
  return tournamentDb.transaction(async function (tx) {
    await tx.execute(sql`select pg_advisory_xact_lock(84723, ${tournamentId})`)
    return transactions.run(tx, write)
  })
}
