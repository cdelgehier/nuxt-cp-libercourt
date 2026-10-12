import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import * as schema from '../server/domains/tournament/schema'
import { seedLocalClub } from './local-club'

// Disposable PostgreSQL fixture: no connection to Neon and no persistent data.
const database = await PGlite.create()
const directory = mkdtempSync(join(tmpdir(), 'integral-local-'))
mkdirSync(join(directory, 'meta'))
const journal = JSON.parse(
  readFileSync('drizzle/migrations/meta/_journal.json', 'utf8')
)
for (const entry of journal.entries) {
  const content = readFileSync(`drizzle/migrations/${entry.tag}.sql`, 'utf8')
  writeFileSync(
    join(directory, `${entry.tag}.sql`),
    [5, 6, 8].includes(entry.idx)
      ? content.replaceAll(';\nALTER', ';--> statement-breakpoint\nALTER')
      : content
  )
}
writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(journal))
const db = drizzle(database, { schema })
await migrate(db, { migrationsFolder: directory })
rmSync(directory, { recursive: true })
await seedLocalClub(db)
// PGlite is single-connection; its socket server serializes transactions.
await database.exec(
  'CREATE FUNCTION pg_advisory_xact_lock(integer, integer) RETURNS void LANGUAGE SQL AS $$ SELECT $$;'
)
const [tournament] = await db
  .insert(schema.tournaments)
  .values({
    name: 'Tournoi intégral de démonstration',
    slug: 'demo-integral',
    isDemo: true,
    date: '2026-10-10',
    tableCount: 8,
    isPublished: true
  })
  .returning()
const [series] = await db
  .insert(schema.tournamentSeries)
  .values({
    tournamentId: tournament!.id,
    name: 'Intégral — 24 joueurs',
    seriesDate: tournament!.date,
    startTime: '09:00',
    status: 'registration',
    setsToWin: 1
  })
  .returning()
await db.insert(schema.seriesRegistrations).values(
  Array.from({ length: 24 }, function (_, i) {
    return {
      seriesId: series!.id,
      firstName: `Joueur ${i + 1}`,
      lastName: ['Martin', 'Dupont', 'Lefebvre', 'Bernard'][i % 4]!,
      club: ['Libercourt', 'Lys-lez-Lannoy', 'Lille', 'Seclin'][i % 4]!,
      ranking: 1900 - i * 50,
      licenceNumber: String(10000 + i),
      attendanceStatus: 'present' as const
    }
  })
)
const [doubles] = await db
  .insert(schema.tournamentSeries)
  .values({
    tournamentId: tournament!.id,
    name: 'Doubles avec handicap',
    seriesDate: tournament!.date,
    startTime: '11:00',
    seriesFormat: 'doubles',
    seriesType: 'handicap',
    status: 'registration',
    setsToWin: 1
  })
  .returning()
await db.insert(schema.seriesRegistrations).values(
  Array.from({ length: 4 }, function (_, i) {
    return {
      seriesId: doubles!.id,
      firstName: `Joueur ${i + 1}`,
      lastName: ['Martin', 'Dupont', 'Lefebvre', 'Bernard'][i]!,
      club: 'Libercourt',
      ranking: 1900 - i * 50,
      licenceNumber: String(10000 + i),
      partnerFirstName: `Partenaire ${i + 1}`,
      partnerLastName: 'Durand',
      partnerRanking: 500 + i * 200,
      partnerLicenceNumber: String(20000 + i),
      attendanceStatus: 'present' as const
    }
  })
)
await db.insert(schema.tournamentJaAccess).values({
  tournamentId: tournament!.id,
  name: 'JA démonstration',
  pin: await bcrypt.hash('1234', 10)
})
const [privateTournament] = await db
  .insert(schema.tournaments)
  .values({
    name: 'Tournoi privé',
    slug: 'demo-private',
    date: '2026-10-10',
    tableCount: 2
  })
  .returning()
await db.insert(schema.tournamentSeries).values({
  tournamentId: privateTournament!.id,
  name: 'Série privée',
  seriesDate: privateTournament!.date,
  startTime: '09:00'
})
const server = new PGLiteSocketServer({
  db: database,
  maxConnections: 10,
  port: 55432,
  host: '127.0.0.1'
})
await server.start()
process.stdout.write(
  'Disposable tournament DB: port 55432; slug demo-integral; JA pin 1234.\n'
)
process.on('SIGINT', async function () {
  await server.stop()
  await database.close()
  process.exit(0)
})
