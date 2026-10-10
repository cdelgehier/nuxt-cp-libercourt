import assert from 'node:assert/strict'
import { Client } from 'pg'
import type { IntegralState } from '../server/domains/tournament/integral'

const origin = process.env.INTEGRAL_TEST_URL ?? 'http://localhost:3001'
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw new Error('Use the disposable local fixture only.')
const cookies = new Map<string, string>()
async function request(path: string, body?: unknown, expected = 200) {
  const response = await fetch(origin + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: [...cookies.values()].join('; ')
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const payload = await response.json()
  assert.equal(response.status, expected, JSON.stringify(payload))
  for (const session of response.headers.getSetCookie()) {
    const value = session.split(';')[0]!
    cookies.set(value.split('=')[0]!, value)
  }
  return payload
}
interface Snapshot {
  state: IntegralState
  version: number
  registrations: { id: number }[]
}
// The tournament page also loads club data through its public layout.
const club = await request('/api/club/config')
assert.equal(club.name, 'Club Pongiste Libercourtois')
const clubDetails = await request('/api/club/schedules-pricing')
assert.ok(clubDetails.schedules.length > 0)
assert.ok(clubDetails.pricing.length > 0)
await request(
  '/api/ja/tournois/demo-integral/series/1/integral',
  undefined,
  401
)
await request('/api/tournois/demo-private', undefined, 404)
await request('/api/ja/auth', { jaAccessId: 1, pin: '1234' })
await request('/api/ja/tournois/demo-private', undefined, 403)
await request(
  '/api/ja/tournois/demo-integral/series/3/integral',
  undefined,
  404
)
await request('/api/tournois/demo-integral/series/3/integral', undefined, 404)
const path = '/api/ja/tournois/demo-integral/series/1/integral'
let snapshot: Snapshot = await request(path)
async function command(body: object): Promise<Snapshot> {
  snapshot = await request(path, { ...body, version: snapshot.version })
  return snapshot
}
const beforeGeneration = snapshot.version
await command({ action: 'generate' })
assert.equal(snapshot.version, beforeGeneration + 1)
await request(
  path,
  { action: 'swap', version: beforeGeneration, first: 1, second: 2 },
  409
)
assert.equal(snapshot.state.pools.length, 8)
await command({
  action: 'identity',
  registrationId: 1,
  identity: 'manual:test-person'
})
await command({ action: 'drop' })
assert.equal(snapshot.state, null)
await command({ action: 'generate' })
assert.equal(
  snapshot.state.entrants.find(entry => entry.id === 1)!.identities[0],
  'manual:test-person'
)
// Two competing pool edits with the same version must commit exactly one mutation.
const concurrentVersion = snapshot.version
const competing = await Promise.all(
  [1, 2].map(function () {
    return fetch(origin + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: [...cookies.values()].join('; ')
      },
      body: JSON.stringify({
        action: 'swap',
        version: concurrentVersion,
        first: 3,
        second: 4
      })
    })
  })
)
assert.deepEqual(competing.map(response => response.status).sort(), [200, 409])
snapshot = await request(path)
const patchResponse = await fetch(
  origin + '/api/ja/tournois/demo-integral/series/1/registrations/1',
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: [...cookies.values()].join('; ')
    },
    body: JSON.stringify({ ranking: 500 })
  }
)
assert.equal(patchResponse.status, 409)
const oldVersion = snapshot.version
await command({ action: 'swap', first: 1, second: 2 })
await request(
  path,
  { action: 'swap', version: oldVersion, first: 1, second: 2 },
  409
)
const doubles = await request(
  '/api/ja/tournois/demo-integral/series/2/integral',
  { action: 'generate', version: 0 }
)
const plan = await request('/api/ja/tournois/demo-integral/schedule')
assert.equal(
  plan.matches.length,
  snapshot.state.matches.length + doubles.state.matches.length
)
await request('/api/ja/tournois/demo-integral/schedule', {
  versions: plan.versions,
  startAt: new Date().toISOString(),
  rest: 0
})
snapshot = await request(path)
await command({ action: 'advance' })
const first = snapshot.state.matches[0]!
await command({ action: 'start', matchId: first.id, table: 1 })
await request(
  path,
  {
    action: 'score',
    version: snapshot.version,
    matchId: first.id,
    sets: [{ score1: 12, score2: 0 }]
  },
  400
)
assert.deepEqual((await request(path)).state, snapshot.state)
await command({
  action: 'score',
  matchId: first.id,
  sets: [{ score1: 11, score2: 0 }]
})
// This checks the actual pg transaction service, phases and public serialization.
while (snapshot.state.phase !== 'finished') {
  const match = snapshot.state.matches.find(entry => entry.status === 'pending')
  if (!match) {
    await command({ action: 'advance' })
    continue
  }
  await command({ action: 'start', matchId: match.id, table: 1 })
  await command({
    action: 'score',
    matchId: match.id,
    sets: [{ score1: 11, score2: 0 }]
  })
}
assert.deepEqual(
  Object.values(snapshot.state.placements).sort((a, b) => a - b),
  Array.from({ length: 24 }, (_, i) => i + 1)
)
const visible = await request('/api/tournois/demo-integral/series/1/integral')
assert.deepEqual(visible.state.placements, snapshot.state.placements)
assert.ok(
  visible.state.entrants.every(
    (entry: { identities: string[] }) => entry.identities.length === 0
  )
)
assert.equal(visible.registrations[0].licenceNumber, undefined)
const publicPlan = await request('/api/tournois/demo-integral/schedule')
assert.ok(
  publicPlan.matches.some((match: { seriesId: number }) => match.seriesId === 2)
)
assert.equal(publicPlan.matches[0].identities, undefined)
const database = new Client({
  connectionString:
    'postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable'
})
await database.connect()
try {
  const stored = await database.query(
    'select (select count(*) from integral_matches where series_id=1)::int as matches,(select count(*) from integral_placements where series_id=1)::int as places,(select count(*) from integral_pool_members where series_id=1)::int as members'
  )
  assert.deepEqual(stored.rows[0], {
    matches: snapshot.state.matches.length,
    places: 24,
    members: 24
  })
  const destinations = await database.query(
    "select count(*)::int as missing from integral_matches where series_id=1 and phase='placement' and (winner_range_start is null or loser_range_start is null)"
  )
  assert.equal(destinations.rows[0].missing, 0)
} finally {
  await database.end()
}
process.stdout.write(
  `Local pg API checks pass: ${snapshot.state.matches.length} matches; unique places 1–24; score rollback, stale versions, public filtering.\n`
)
