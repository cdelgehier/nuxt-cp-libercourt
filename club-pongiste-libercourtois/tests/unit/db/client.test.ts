import { afterEach, describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { Pool } from 'pg'

afterEach(function () {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('club database connection', function () {
  it('reads and updates club configuration on local PostgreSQL', async function () {
    const database = await PGlite.create()
    await database.exec(`CREATE TABLE club_config (
      id serial PRIMARY KEY, name text NOT NULL, club_id text NOT NULL,
      description text, email text, phone text, website text, facebook_url text,
      salle text, complexe text, street text, postal_code text, city text,
      country text DEFAULT 'France', lat text, lng text, google_maps_url text,
      updated_at timestamp DEFAULT now()
    )`)
    const server = new PGLiteSocketServer({ db: database, port: 0 })
    await server.start()
    vi.stubEnv(
      'DATABASE_URL',
      `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`
    )
    vi.resetModules()
    const { db } = await import('../../../server/db/client')
    try {
      const { upsertClubConfig, getClubConfig } = await import(
        '../../../server/domains/club/repository'
      )
      await upsertClubConfig({ name: 'Club local', clubId: '07620112' })
      expect(await getClubConfig()).toMatchObject({
        name: 'Club local',
        clubId: '07620112',
        updatedAt: expect.any(Date)
      })
      await upsertClubConfig({ name: 'Club corrigé', clubId: '07620112' })
      expect(await getClubConfig()).toMatchObject({ name: 'Club corrigé' })
    } finally {
      if (db.$client instanceof Pool) await db.$client.end()
      await server.stop()
      await database.close()
    }
  }, 15000)

  it('keeps reading Neon through HTTPS with the Netlify URL', async function () {
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv(
      'NETLIFY_DATABASE_URL',
      'postgresql://demo:demo@ep-demo.eu-west-2.aws.neon.tech/neondb?sslmode=require'
    )
    const fetchStub = vi.fn(async function () {
      return new Response(
        JSON.stringify({
          fields: [{ name: 'name', dataTypeID: 25 }],
          rows: [['Club Neon']],
          rowCount: 1,
          command: 'SELECT'
        }),
        { status: 200 }
      )
    })
    vi.stubGlobal('fetch', fetchStub)
    const { db } = await import('../../../server/db/client')
    const { clubConfig } = await import('../../../server/domains/club/schema')
    expect(await db.select({ name: clubConfig.name }).from(clubConfig)).toEqual(
      [{ name: 'Club Neon' }]
    )
    expect(fetchStub.mock.calls).toHaveLength(1)
  })

  it('reports a missing connection without exposing credentials', async function () {
    vi.stubEnv('DATABASE_URL', '')
    vi.stubEnv('NETLIFY_DATABASE_URL', '')
    await expect(import('../../../server/db/client')).rejects.toThrow(
      'DATABASE_URL manquante'
    )
  })
})
