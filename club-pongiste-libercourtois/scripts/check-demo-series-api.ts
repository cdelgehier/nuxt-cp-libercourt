import assert from 'node:assert/strict'

const origin = process.env.INTEGRAL_TEST_URL ?? 'http://localhost:3001'
const connection = process.env.DATABASE_URL
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname) ||
  !connection ||
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(connection).hostname)
)
  throw new Error('Use the disposable local database only.')
const password = process.env.E2E_ADMIN_PASSWORD
if (!password) throw new Error('Set E2E_ADMIN_PASSWORD for the local fixture.')
const authorization = `Basic ${Buffer.from(`${process.env.E2E_ADMIN_USER ?? 'admin'}:${password}`).toString('base64')}`

/** Exercise real HTTP handlers and transactions on the disposable fixture. */
async function request(
  path: string,
  method = 'GET',
  body?: object,
  expected = 200,
  authenticated = true
) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated ? { Authorization: authorization } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const payload = await response.json()
  assert.equal(response.status, expected, JSON.stringify(payload))
  return payload
}

const tournament = await request('/api/admin/tournois', 'POST', {
  name: `Contrôle démo ${Date.now()}`,
  date: '2026-10-11',
  isPublished: false,
  isDemo: true
})
const base = `/api/admin/tournois/${tournament.slug}`
try {
  const singles = await request(`${base}/series`, 'POST', {
    name: 'Simple local',
    seriesDate: tournament.date,
    startTime: '09:00',
    maxPlayers: 24
  })
  const path = `${base}/series/${singles.id}`
  await request(`${path}/demo`, 'POST', { count: 24 }, 401, false)
  await request(`${path}/demo`, 'POST', { count: 33 }, 400)
  await request(`${path}/demo`, 'POST', { count: 24 })
  const registrations = await request(`${path}/registrations`)
  assert.equal(registrations.length, 24)
  assert.equal(
    new Set(
      registrations.map(
        (entry: { licenceNumber: string }) => entry.licenceNumber
      )
    ).size,
    24
  )

  await request(
    `/api/admin/tournois/demo-private/series/${singles.id}/demo`,
    'POST',
    { count: 2 },
    404
  )
  const capacity = await request(`${base}/series`, 'POST', {
    name: 'Capacité limitée',
    seriesDate: tournament.date,
    startTime: '09:00',
    maxPlayers: 3
  })
  const capacityPath = `${base}/series/${capacity.id}`
  await request(`${capacityPath}/demo`, 'POST', { count: 2 })
  await request(`${capacityPath}/demo`, 'POST', { count: 2 }, 400)
  assert.equal((await request(`${capacityPath}/registrations`)).length, 2)

  const doubles = await request(`${base}/series`, 'POST', {
    name: 'Doubles limités',
    seriesDate: tournament.date,
    startTime: '11:00',
    seriesType: 'points_limit',
    seriesFormat: 'doubles',
    pointsLimitMin: 1100,
    pointsLimitMax: 1400,
    femalesOnly: true,
    ageCategories: ['juniors']
  })
  const doublePath = `${base}/series/${doubles.id}`
  await request(`${doublePath}/demo`, 'POST', { count: 8 })
  for (const entry of await request(`${doublePath}/registrations`)) {
    assert.ok(entry.partnerFirstName)
    assert.ok(entry.ranking + entry.partnerRanking >= 1100)
    assert.ok(entry.ranking + entry.partnerRanking <= 1400)
    assert.equal(entry.playerGender, 'F')
    assert.equal(entry.playerCategory, 'juniors')
  }

  // A shared licence updates attendance and payment across a simple and a double.
  await request(`${path}/registrations/${registrations[0].id}`, 'PATCH', {
    attendanceStatus: 'absent',
    paymentStatus: 'paid'
  })
  const sibling = (await request(`${doublePath}/registrations`)).find(
    (entry: { licenceNumber: string }) =>
      entry.licenceNumber === registrations[0].licenceNumber
  )
  assert.equal(sibling.attendanceStatus, 'absent')
  assert.equal(sibling.paymentStatus, 'paid')

  const snapshot = await request(`${path}/integral`)
  await request(`${path}/integral`, 'POST', {
    action: 'generate',
    version: snapshot.version
  })
  await request(`${path}/demo`, 'POST', { count: 2 }, 409)
  assert.equal((await request(`${path}/registrations`)).length, 24)
  await request(path, 'DELETE', undefined, 400)
  const generated = await request(`${path}/integral`)
  await request(`${path}/integral`, 'POST', {
    action: 'drop',
    version: generated.version
  })
  await request(path, 'DELETE')
  await request(path, 'GET', undefined, 404)
  const doubleSnapshot = await request(`${doublePath}/integral`)
  await request(`${doublePath}/integral`, 'POST', {
    action: 'generate',
    version: doubleSnapshot.version
  })
  process.stdout.write(
    'Demo API: auth, scope, validation, capacity rollback, doubles, shared statuses and locked roster passed.\n'
  )
} finally {
  await request(base, 'DELETE')
}
