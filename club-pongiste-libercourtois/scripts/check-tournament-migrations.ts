import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

/** Check both a clean install and the verified Neon schema drift. */
async function check(): Promise<void> {
  const fresh = new PGlite()

  const drifted = new PGlite()
  const existing = new PGlite()
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
  const current = { ...journal, entries: journal.entries.slice(0, -1) }
  writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(current))
  await migrate(drizzle(existing), { migrationsFolder: directory })
  await existing.exec(`
    INSERT INTO tournaments (id, name, slug, date, date_end) VALUES (100, 'Migration test', 'migration-test', '2026-10-14', '2026-10-15');
    INSERT INTO tournament_series (id, tournament_id, name, series_date, start_time) VALUES
      (100, 100, 'Legacy', NULL, NULL),
      (101, 100, 'Blank', '', ''),
      (102, 100, 'Explicit', '2026-10-15', '14:30');
    INSERT INTO integral_series (series_id, version, state) VALUES (102, 12, '{"phase":"finished","placements":{"17":1}}');
    INSERT INTO series_registrations (series_id, first_name, last_name) VALUES (102, 'Existing', 'Player');
  `)
  writeFileSync(join(directory, 'meta/_journal.json'), JSON.stringify(journal))
  await migrate(drizzle(existing), { migrationsFolder: directory })
  const filled = await existing.query(
    'SELECT id, series_date, start_time FROM tournament_series ORDER BY id'
  )
  assert.deepEqual(filled.rows, [
    { id: 100, series_date: '2026-10-14', start_time: '09:00' },
    { id: 101, series_date: '2026-10-14', start_time: '09:00' },
    { id: 102, series_date: '2026-10-15', start_time: '14:30' }
  ])
  assert.deepEqual(
    (await existing.query('SELECT version, state FROM integral_series')).rows,
    [{ version: 12, state: { phase: 'finished', placements: { '17': 1 } } }]
  )
  assert.equal(
    (
      await existing.query(
        'SELECT count(*)::int AS count FROM series_registrations'
      )
    ).rows[0]!.count,
    1
  )
  for (const values of [
    "NULL, '09:00'",
    "'2026-10-14', NULL",
    "'2026-10-14', '24:00'",
    "'2026-10-14', '12:60'",
    "'2026-02-30', '09:00'"
  ])
    await assert.rejects(
      existing.exec(
        `INSERT INTO tournament_series (tournament_id, name, series_date, start_time) VALUES (100, 'Invalid', ${values})`
      )
    )
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
  await existing.close()
  rmSync(directory, { recursive: true })
  process.stdout.write(
    'Drizzle migrations pass on fresh, drifted and existing schemas; required series schedules preserve dates, times, rosters and results.\n'
  )
}
await check()
