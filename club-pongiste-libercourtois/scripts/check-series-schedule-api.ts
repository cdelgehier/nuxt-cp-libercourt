import assert from 'node:assert/strict'
import type { IntegralState } from '../server/domains/tournament/integral'

const origin = process.env.INTEGRAL_TEST_URL ?? 'http://localhost:3001'
const connection = process.env.DATABASE_URL
if (
  !connection ||
  !['localhost', '127.0.0.1'].includes(new URL(connection).hostname) ||
  !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
)
  throw new Error('This check requires a disposable local database and server.')
const password = process.env.E2E_ADMIN_PASSWORD
if (!password) throw new Error('Set E2E_ADMIN_PASSWORD for the local fixture.')
const authorization = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`

/** Check required series times and shared pool forecasts through the real HTTP handlers. */
async function request(
  path: string,
  method = 'GET',
  body?: object,
  expected = 200,
  publicView = false
) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(publicView ? {} : { Authorization: authorization })
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const payload = await response.json()
  assert.equal(response.status, expected, JSON.stringify(payload))
  return payload
}
interface Snapshot {
  version: number
  state: IntegralState
}

const tournament = await request('/api/admin/tournois', 'POST', {
  name: `Vérification horaires ${Date.now()}`,
  date: '2026-10-14',
  tableCount: 1,
  isDemo: true,
  isPublished: true
})
const base = `/api/admin/tournois/${tournament.slug}`
try {
  for (const input of [
    { name: 'Sans horaire', seriesDate: tournament.date },
    { name: 'Sans date', startTime: '09:00' },
    { name: 'Vide', seriesDate: '', startTime: '' },
    { name: 'Heure invalide', seriesDate: tournament.date, startTime: '24:00' }
  ])
    await request(`${base}/series`, 'POST', input, 400)
  assert.equal((await request(base)).series.length, 0)
  const series = await request(`${base}/series`, 'POST', {
    name: 'Six joueurs',
    seriesDate: tournament.date,
    startTime: '09:00',
    setsToWin: 1
  })
  const path = `${base}/series/${series.id}`
  await request(path, 'PATCH', { name: 'Six joueurs — horaires requis' })
  const renamed = await request(path)
  assert.equal(renamed.seriesDate, tournament.date)
  assert.equal(renamed.startTime, '09:00')
  await request(path, 'PATCH', { startTime: '' }, 400)
  await request(path, 'PATCH', { seriesDate: null }, 400)
  await request(`${path}/demo`, 'POST', { count: 6 })
  const generated: Snapshot = await request(`${path}/integral`, 'POST', {
    action: 'generate',
    version: 0
  })
  assert.deepEqual(
    generated.state.matches.map(function (match) {
      return [match.poolId, match.table, match.scheduledAt]
    }),
    [
      ...Array(3).fill([1, null, '2026-10-14T07:00:00.000Z']),
      ...Array(3).fill([2, null, '2026-10-14T08:30:00.000Z'])
    ]
  )
  const publicSchedule = await request(
    `/api/tournois/${tournament.slug}/schedule`,
    'GET',
    undefined,
    200,
    true
  )
  assert.equal(
    publicSchedule.matches[0].scheduledAt,
    '2026-10-14T07:00:00.000Z'
  )
  const launched: Snapshot = await request(`${path}/integral`, 'POST', {
    action: 'start-pool',
    poolId: 1,
    version: generated.version
  })
  assert.equal(
    launched.state.matches[0]!.scheduledAt,
    '2026-10-14T07:00:00.000Z'
  )
  assert.ok(launched.state.matches[0]!.startedAt)
  const first = launched.state.matches[0]!
  const scored: Snapshot = await request(`${path}/integral`, 'POST', {
    action: 'score',
    matchId: first.id,
    sets: [{ score1: 11, score2: 0 }],
    version: launched.version
  })
  const schedule = await request(`${base}/schedule`)
  const planning = {
    versions: schedule.versions,
    startAt: '2026-10-14T07:00:00Z',
    duration: 5,
    rest: 10
  }
  await request(`${base}/schedule`, 'POST', planning)
  const replanned: Snapshot = await request(`${path}/integral`)
  assert.deepEqual(
    replanned.state.matches.filter(function (match) {
      return match.poolId === 1
    }),
    scored.state.matches.filter(function (match) {
      return match.poolId === 1
    })
  )
  assert.ok(
    replanned.state.matches
      .filter(function (match) {
        return match.poolId === 2
      })
      .every(function (match) {
        return (
          match.table === null &&
          match.scheduledAt === '2026-10-14T07:00:00.000Z'
        )
      })
  )
  await request(`${base}/schedule`, 'POST', planning, 409)
  assert.deepEqual((await request(`${path}/integral`)).state, replanned.state)
  process.stdout.write(
    'Series schedule API passed: required dates/times, invalid updates, automatic grouped pool forecasts, public read, preserved launches/results, replanning and stale versions.\n'
  )
} finally {
  await request(base, 'DELETE')
}
