import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const fixture = vi.hoisted(function () {
  return { database: null as unknown as PGlite }
})
vi.mock('../../../server/db/tournament-client', async function () {
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { AsyncLocalStorage } = await import('node:async_hooks')
  const database = new PGlite()
  fixture.database = database
  const db = drizzle(database)
  type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
  const transactions = new AsyncLocalStorage<Transaction>()
  return {
    tournamentDb: db,
    tournamentStore: new Proxy(db, {
      get(target, property) {
        const connection = transactions.getStore() ?? target
        const value = Reflect.get(connection, property)
        return typeof value === 'function' ? value.bind(connection) : value
      }
    }),
    withTournamentWrite: async function (
      _id: number,
      write: () => Promise<unknown>
    ) {
      return db.transaction(async function (tx) {
        return transactions.run(tx, write)
      })
    }
  }
})
vi.stubGlobal(
  'createError',
  function (input: { statusCode: number; message: string }) {
    return Object.assign(new Error(input.message), {
      statusCode: input.statusCode
    })
  }
)
const { getForecast, runForecast, saveForecast } = await import(
  '../../../server/domains/tournament/forecast-service'
)

beforeAll(async function () {
  const journal = JSON.parse(
    readFileSync('drizzle/migrations/meta/_journal.json', 'utf8')
  )
  for (const entry of journal.entries)
    await fixture.database.exec(
      readFileSync(`drizzle/migrations/${entry.tag}.sql`, 'utf8')
    )
}, 30_000)
beforeEach(async function () {
  await fixture.database.exec(`TRUNCATE tournaments CASCADE;
    INSERT INTO tournaments (id, name, slug, date, table_count) VALUES (1, 'One', 'one', '2026-10-14', 4), (2, 'Two', 'two', '2026-10-15', 4);
    INSERT INTO tournament_series (id, tournament_id, name, series_date, start_time) VALUES (1, 1, 'Simple', '2026-10-14', '09:00'), (2, 2, 'Foreign', '2026-10-15', '09:00');
    INSERT INTO series_registrations (series_id, first_name, last_name, attendance_status) VALUES (1, 'A', 'One', 'unknown'), (1, 'B', 'Two', 'present');`)
})
afterAll(async function () {
  await fixture.database.close()
})

describe('forecast persistence and ownership', function () {
  it('initializes and restores one independent forecast without changing sporting rows', async function () {
    const initial = await getForecast(1)
    expect(initial.version).toBe(0)
    expect(initial.config.series[0]!.mode).toBe('registrations')
    initial.config.tableCount = 2
    initial.config.series[0]!.startTime = '12:00'
    const before = await fixture.database.query(
      'SELECT * FROM tournament_series;'
    )
    await runForecast(1, initial.config)
    const saved = await saveForecast(1, { config: initial.config, version: 0 })
    expect(saved.version).toBe(1)
    const restored = await getForecast(1)
    expect(restored.config).toEqual(initial.config)
    expect(
      (await fixture.database.query('SELECT * FROM tournament_series;')).rows
    ).toEqual(before.rows)
    expect(
      (
        await fixture.database.query(
          'SELECT count(*)::int AS count FROM integral_matches'
        )
      ).rows[0]!.count
    ).toBe(0)
    expect(
      JSON.stringify(
        (
          await fixture.database.query(
            'SELECT config FROM tournament_forecasts'
          )
        ).rows
      )
    ).not.toContain('identities')
  })

  it('rejects a foreign series for both saving and simulation', async function () {
    const initial = await getForecast(1)
    initial.config.series[0]!.seriesId = 2
    await expect(runForecast(1, initial.config)).rejects.toMatchObject({
      statusCode: 400
    })
    await expect(
      saveForecast(1, { config: initial.config, version: 0 })
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 409 for a concurrent stale save', async function () {
    const initial = await getForecast(1)
    const attempts = await Promise.allSettled([
      saveForecast(1, { config: initial.config, version: 0 }),
      saveForecast(1, { config: initial.config, version: 0 })
    ])
    expect(
      attempts.filter(function (attempt) {
        return attempt.status === 'fulfilled'
      })
    ).toHaveLength(1)
    const failed = attempts.find(function (attempt) {
      return attempt.status === 'rejected'
    }) as PromiseRejectedResult
    expect(failed.reason.statusCode).toBe(409)
    expect((await getForecast(1)).version).toBe(1)
  })

  it('rejects extra fields, excessive projected counts and unavailable tournaments', async function () {
    const initial = await getForecast(1)
    await expect(runForecast(999, initial.config)).rejects.toMatchObject({
      statusCode: 404
    })
    await expect(
      saveForecast(1, { config: initial.config, version: 0, results: [] })
    ).rejects.toMatchObject({ statusCode: 400 })
    initial.config.series[0]!.mode = 'estimated'
    initial.config.series[0]!.estimatedEntrants = 512
    await expect(
      saveForecast(1, { config: initial.config, version: 0 })
    ).rejects.toMatchObject({ statusCode: 400 })
    expect((await getForecast(1)).version).toBe(0)
  })
})
