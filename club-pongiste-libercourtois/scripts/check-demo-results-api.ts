import assert from 'node:assert/strict'
import type { IntegralState } from '../server/domains/tournament/integral'

const origin = process.env.INTEGRAL_TEST_URL ?? 'http://localhost:3001'
const connection = process.env.DATABASE_URL
if (
  !connection ||
  !['localhost', '127.0.0.1'].includes(new URL(connection).hostname) ||
  !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
)
  throw new Error('Use the disposable local database and server only.')
const password = process.env.E2E_ADMIN_PASSWORD
if (!password) throw new Error('Set E2E_ADMIN_PASSWORD for the local fixture.')
const authorization = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`
const cookies = new Map<string, string>()
interface Snapshot {
  version: number
  isDemo: boolean
  state: IntegralState
}

/** Check public, admin and JA HTTP boundaries against real local transactions. */
async function request(
  path: string,
  method = 'GET',
  body?: object,
  expected = 200,
  role: 'admin' | 'ja' | 'public' = 'admin'
) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(role === 'admin'
        ? { Authorization: authorization }
        : role === 'ja'
          ? { Cookie: [...cookies.values()].join('; ') }
          : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const payload = await response.json()
  assert.equal(response.status, expected, JSON.stringify(payload))
  if (role === 'ja')
    for (const header of response.headers.getSetCookie()) {
      const value = header.split(';')[0]!
      cookies.set(value.split('=')[0]!, value)
    }
  return payload
}

const name = `Vérification démo ${Date.now()}`
const demo = await request('/api/admin/tournois', 'POST', {
  name,
  date: '2026-10-12',
  isDemo: true,
  isPublished: true,
  tableCount: 4
})
const normal = await request('/api/admin/tournois', 'POST', {
  name: `Tournoi normal ${Date.now()}`,
  date: '2026-10-12'
})
const base = `/api/admin/tournois/${demo.slug}`
const normalBase = `/api/admin/tournois/${normal.slug}`
try {
  assert.equal(demo.isDemo, true)
  assert.equal(normal.isDemo, false)
  await request(base, 'PATCH', {
    description: 'Le marqueur doit être conservé.'
  })
  assert.equal((await request(base)).isDemo, true)
  const ordinary = await request(`${normalBase}/series`, 'POST', {
    name: 'Série réelle',
    seriesDate: normal.date,
    startTime: '09:00'
  })
  const ordinaryPath = `${normalBase}/series/${ordinary.id}`
  await request(`${ordinaryPath}/demo`, 'POST', { count: 3, isDemo: true }, 403)
  assert.equal((await request(`${ordinaryPath}/registrations`)).length, 0)
  await request(
    `${ordinaryPath}/integral`,
    'POST',
    { action: 'demo-pool', poolId: 1, version: 0, isDemo: true },
    403
  )

  const access = await request(`${base}/ja-access`, 'POST', {
    name: 'JA démo temporaire',
    pin: '9876'
  })
  await request(
    '/api/ja/auth',
    'POST',
    { jaAccessId: access.id, pin: '9876' },
    200,
    'ja'
  )
  await request(base, 'PATCH', { isDemo: false }, 401, 'ja')
  for (const input of [
    {
      name: 'Simple simulé',
      count: 10,
      seriesType: 'standard',
      pointsPerSet: 11,
      setsToWin: 3
    },
    {
      name: 'Speedy simulé',
      count: 7,
      seriesType: 'speedy',
      pointsPerSet: 5,
      setsToWin: 2
    },
    {
      name: 'Double handicap simulé',
      count: 5,
      seriesType: 'handicap',
      seriesFormat: 'doubles',
      pointsPerSet: 3,
      setsToWin: 2
    }
  ]) {
    const series = await request(`${base}/series`, 'POST', {
      ...input,
      seriesDate: demo.date,
      startTime: '09:00'
    })
    const path = `/api/ja/tournois/${demo.slug}/series/${series.id}`
    await request(`${path}/demo`, 'POST', { count: input.count }, 401, 'public')
    await request(`${path}/demo`, 'POST', { count: input.count }, 200, 'ja')
    await request(
      `${normalBase}/series/${series.id}/demo`,
      'POST',
      { count: 3 },
      404
    )
    let snapshot: Snapshot = await request(
      `${path}/integral`,
      'GET',
      undefined,
      200,
      'ja'
    )
    snapshot = await request(
      `${path}/integral`,
      'POST',
      { action: 'generate', version: snapshot.version },
      200,
      'ja'
    )
    assert.equal(snapshot.isDemo, true)
    const before = structuredClone(snapshot)
    await request(base, 'PATCH', { isDemo: false })
    await request(
      `${path}/integral`,
      'POST',
      { action: 'demo-pool', poolId: 1, version: snapshot.version },
      403,
      'ja'
    )
    assert.deepEqual(
      (await request(`${path}/integral`, 'GET', undefined, 200, 'ja')).state,
      before.state
    )
    await request(base, 'PATCH', {
      isDemo: true,
      isPublished: true,
      tableCount: 4
    })
    await request(
      `${path}/integral`,
      'POST',
      { action: 'demo-pool', poolId: 1, version: snapshot.version },
      401,
      'public'
    )

    // Two simultaneous simulations with one version can commit only once.
    const races = await Promise.all(
      [1, 2].map(async function () {
        const response = await fetch(origin + `${path}/integral`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: [...cookies.values()].join('; ')
          },
          body: JSON.stringify({
            action: 'demo-match',
            matchId: 1,
            version: snapshot.version
          })
        })
        await response.json()
        return response.status
      })
    )
    assert.deepEqual(races.sort(), [200, 409])
    snapshot = await request(`${path}/integral`, 'GET', undefined, 200, 'ja')
    const recorded = structuredClone(snapshot.state.matches[0])
    await request(
      `${path}/integral`,
      'POST',
      { action: 'demo-match', matchId: 1, version: snapshot.version },
      400,
      'ja'
    )
    await request(
      `${path}/integral`,
      'POST',
      { action: 'demo-pool', poolId: 99, version: snapshot.version },
      400,
      'ja'
    )
    for (const pool of snapshot.state.pools) {
      if (
        snapshot.state.matches.some(function (match) {
          return match.poolId === pool.id && match.status === 'pending'
        })
      )
        snapshot = await request(
          `${path}/integral`,
          'POST',
          { action: 'demo-pool', poolId: pool.id, version: snapshot.version },
          200,
          'ja'
        )
    }
    assert.deepEqual(snapshot.state.matches[0], recorded)
    assert.equal(snapshot.state.phase, 'pools')
    snapshot = await request(
      `${path}/integral`,
      'POST',
      { action: 'advance', version: snapshot.version },
      200,
      'ja'
    )
    while (snapshot.state.phase !== 'finished') {
      const match = snapshot.state.matches.find(function (entry) {
        return (
          entry.phase === snapshot.state.phase && entry.status === 'pending'
        )
      })
      snapshot = await request(
        `${path}/integral`,
        'POST',
        match
          ? {
              action: 'demo-match',
              matchId: match.id,
              version: snapshot.version
            }
          : { action: 'advance', version: snapshot.version },
        200,
        'ja'
      )
    }
    assert.equal(Object.keys(snapshot.state.placements).length, input.count)
    assert.equal(
      new Set(Object.values(snapshot.state.placements)).size,
      input.count
    )
    const publicPath = `/api/tournois/${demo.slug}/series/${series.id}/integral`
    const publicSnapshot = await request(
      publicPath,
      'GET',
      undefined,
      200,
      'public'
    )
    assert.equal(publicSnapshot.isDemo, true)
    assert.deepEqual(publicSnapshot.state.placements, snapshot.state.placements)
    await request(
      publicPath,
      'POST',
      { action: 'demo-match', matchId: 1, version: snapshot.version },
      404,
      'public'
    )
    await request(
      `/api/ja/tournois/${normal.slug}/series/${ordinary.id}/demo`,
      'POST',
      { count: 3 },
      403,
      'ja'
    )
  }
  process.stdout.write(
    'Demo results API: stored flag, auth, JA scope, public read-only, preserved scores, races, complete standard/Speedy/doubles-handicap tournaments passed.\n'
  )
} finally {
  await request(base, 'DELETE')
  await request(normalBase, 'DELETE')
}
