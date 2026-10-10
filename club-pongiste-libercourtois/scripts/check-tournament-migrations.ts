import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { readFileSync } from 'node:fs'

/** Check both a clean install and the verified Neon schema drift. */
async function check(): Promise<void> {
  const fresh = new PGlite()

  const drifted = new PGlite()
  // Reproduce Neon by migrating the recorded history, then introducing the
  // unrecorded changes. Do not edit the migration ledger.
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import(
    'node:fs'
  )
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const directory = mkdtempSync(join(tmpdir(), 'tournament-migrations-'))
  mkdirSync(join(directory, 'meta'))
  const journal = JSON.parse(
    readFileSync('drizzle/migrations/meta/_journal.json', 'utf8')
  )
  // PGlite prepared queries require one statement. Normalize copies only;
  // recorded migration files and hashes are preserved in the repository.
  for (const entry of journal.entries) {
    const content = readFileSync(`drizzle/migrations/${entry.tag}.sql`, 'utf8')
    const normalized =
      entry.idx === 5 || entry.idx === 6 || entry.idx === 8
        ? content.replaceAll(';\nALTER', ';--> statement-breakpoint\nALTER')
        : content
    writeFileSync(join(directory, `${entry.tag}.sql`), normalized)
  }
  writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(journal))
  await migrate(drizzle(fresh), { migrationsFolder: directory })
  const old = { ...journal, entries: journal.entries.slice(0, 9) }
  writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(old))

  await migrate(drizzle(drifted), { migrationsFolder: directory })
  for (const tag of ['0009_next_ma_gnuci', '0010_double_elimination'])
    await drifted.exec(readFileSync(`drizzle/migrations/${tag}.sql`, 'utf8'))
  writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(journal))
  await migrate(drizzle(drifted), { migrationsFolder: directory })
  const expected = await fresh.query(
    "select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,column_name"
  )
  const actual = await drifted.query(
    "select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,column_name"
  )
  if (JSON.stringify(expected.rows) !== JSON.stringify(actual.rows))
    throw new Error('Fresh and drifted schemas differ')
  await fresh.close()
  await drifted.close()
  rmSync(directory, { recursive: true })
  process.stdout.write(
    'Drizzle migrations pass on fresh and drifted PostgreSQL schemas.\n'
  )
}
await check()
