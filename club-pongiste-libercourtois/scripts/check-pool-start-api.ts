import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../server/domains/tournament/schema'
import type { IntegralState } from '../server/domains/tournament/integral'

const origin = process.env.INTEGRAL_TEST_URL ?? 'http://localhost:3001'
const connection = process.env.DATABASE_URL
if (
  !connection ||
  !['localhost', '127.0.0.1'].includes(new URL(connection).hostname) ||
  !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
)
  throw new Error('This check requires a disposable local database and server.')
const client = new Pool({ connectionString: connection })
const db = drizzle(client)
const slug = `verification-poules-${Date.now()}`
const cookies = new Map<string, string>()
interface Snapshot {
  version: number
  state: IntegralState
}

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
async function command(
  id: number,
  body: object,
  expected = 200
): Promise<Snapshot> {
  const path = `/api/ja/tournois/${slug}/series/${id}/integral`
  const snapshot: Snapshot = await request(path)
  return request(path, { ...body, version: snapshot.version }, expected)
}
async function seedSeries(
  tournamentId: number,
  name: string,
  count: number,
  type: 'standard' | 'speedy' | 'handicap' = 'standard',
  overlap = false,
  prepared = false
) {
  const [series] = await db
    .insert(schema.tournamentSeries)
    .values({
      tournamentId,
      name,
      seriesDate: '2026-10-11',
      startTime: '00:00',
      seriesType: type,
      setsToWin: 1,
      pointsPerSet: type === 'speedy' ? 3 : 11
    })
    .returning()
  await db.insert(schema.seriesRegistrations).values(
    Array.from({ length: count }, function (_, index) {
      return {
        seriesId: series!.id,
        firstName: `Joueur ${index + 1}`,
        lastName: 'VÉRIFICATION',
        ranking: type === 'handicap' && index === 0 ? null : 1500 - index * 100,
        licenceNumber:
          overlap && index === 0
            ? 'pool-check-shared'
            : `${series!.id}-${index}`,
        attendanceStatus: 'present' as const
      }
    })
  )
  await command(series!.id, { action: 'generate' })
  if (!prepared) await command(series!.id, { action: 'advance' })
  return series!.id
}

const [tournament] = await db
  .insert(schema.tournaments)
  .values({
    name: 'Vérification temporaire — lancement des poules',
    slug,
    date: '2026-10-11',
    tableCount: 4,
    isPublished: true
  })
  .returning()
try {
  const [ja] = await db
    .insert(schema.tournamentJaAccess)
    .values({
      tournamentId: tournament!.id,
      name: 'JA vérification',
      pin: await bcrypt.hash('9876', 10)
    })
    .returning()
  await request(`/api/ja/tournois/${slug}`, undefined, 401)
  await request('/api/ja/auth', { jaAccessId: ja!.id, pin: '9876' })
  const prepared = await seedSeries(
    tournament!.id,
    'Poules prêtes — lancement direct',
    7,
    'standard',
    false,
    true
  )
  const preparedPath = `/api/ja/tournois/${slug}/series/${prepared}/integral`
  const beforeFirstLaunch: Snapshot = await request(preparedPath)
  assert.equal(beforeFirstLaunch.state.phase, 'ready')
  const directLaunch = await command(prepared, {
    action: 'start-pool',
    poolId: 1
  })
  assert.equal(directLaunch.version, beforeFirstLaunch.version + 1)
  assert.equal(directLaunch.state.phase, 'pools')
  assert.deepEqual(directLaunch.state.pools, beforeFirstLaunch.state.pools)
  assert.ok(
    directLaunch.state.matches.every(function (match) {
      return (
        match.status === (match.poolId === 1 ? 'in_progress' : 'pending') &&
        match.table === null
      )
    })
  )
  const planningFinal = await seedSeries(
    tournament!.id,
    'Planning — finale indépendante de la poule sans table',
    2
  )
  const schedulePath = `/api/ja/tournois/${slug}/schedule`
  const schedule = await request(schedulePath)
  const plannedStart = new Date(Date.now() + 30000).toISOString()
  await request(schedulePath, {
    versions: schedule.versions,
    startAt: plannedStart,
    duration: 30,
    rest: 10
  })
  const plannedFinal = await request(
    `/api/ja/tournois/${slug}/series/${planningFinal}/integral`
  )
  // The second pending pool has a forecast on the first free table.
  assert.equal(plannedFinal.state.matches[0]!.table, 2)
  assert.equal(plannedFinal.state.matches[0]!.scheduledAt, plannedStart)
  const replannedPool: Snapshot = await request(preparedPath)
  assert.deepEqual(
    replannedPool.state.matches.filter(function (match) {
      return match.poolId === 1
    }),
    directLaunch.state.matches.filter(function (match) {
      return match.poolId === 1
    })
  )
  assert.ok(
    replannedPool.state.matches.every(function (match) {
      return (
        match.table === null &&
        (match.poolId === 1 || match.scheduledAt !== null)
      )
    })
  )
  const reservationSeries = await seedSeries(
    tournament!.id,
    'Réservation des tables — Speedy',
    3,
    'speedy',
    false,
    true
  )
  const reservationPath = `/api/ja/tournois/${slug}/series/${reservationSeries}/integral`
  const reserved = await command(reservationSeries, {
    action: 'reserve-pool-tables',
    poolId: 1,
    tables: [1, 2]
  })
  assert.deepEqual(reserved.state.pools[0]!.tables, [1, 2])
  await command(
    prepared,
    { action: 'reserve-pool-tables', poolId: 2, tables: [2] },
    400
  )
  assert.deepEqual(await request(reservationPath), reserved)
  await request(
    reservationPath,
    {
      action: 'reserve-pool-tables',
      poolId: 1,
      tables: [3],
      version: reserved.version - 1
    },
    409
  )
  await command(
    reservationSeries,
    { action: 'reserve-pool-tables', poolId: 1, tables: [5] },
    400
  )
  await command(
    reservationSeries,
    { action: 'reserve-pool-tables', poolId: 1, tables: [1, 1] },
    400
  )
  await command(
    reservationSeries,
    { action: 'reserve-pool-tables', poolId: 99, tables: [3] },
    400
  )
  await command(
    planningFinal,
    {
      action: 'start',
      matchId: 1,
      table: 2,
      confirmShortRest: true,
      confirmPlayerConflict: true
    },
    400
  )
  const reservedSchedule = await request(schedulePath)
  const reservedSheets = reservedSchedule.matches.filter(function (match: {
    seriesId: number
  }) {
    return match.seriesId === reservationSeries
  })
  assert.equal(reservedSheets.length, 3)
  for (const match of reservedSheets) {
    assert.equal(match.table, null)
    assert.deepEqual(match.tables, [1, 2])
  }
  assert.equal(
    reservedSchedule.pools.find(function (pool: { seriesId: number }) {
      return pool.seriesId === reservationSeries
    }).status,
    'reserved'
  )
  await request(schedulePath, {
    versions: reservedSchedule.versions,
    startAt: plannedStart,
    duration: 30,
    rest: 10
  })
  assert.ok(
    [3, 4].includes(
      (
        await request(
          `/api/ja/tournois/${slug}/series/${planningFinal}/integral`
        )
      ).state.matches[0].table
    )
  )
  const reservedPool = await command(reservationSeries, {
    action: 'start-pool',
    poolId: 1
  })
  await command(
    reservationSeries,
    { action: 'reserve-pool-tables', poolId: 1, tables: [] },
    400
  )
  await command(reservationSeries, {
    action: 'score',
    matchId: reservedPool.state.matches[0]!.id,
    sets: [{ score1: 3, score2: 0 }]
  })
  const partiallyFinished = await request(schedulePath)
  for (const match of partiallyFinished.matches)
    if (match.seriesId === reservationSeries)
      assert.deepEqual(match.tables, [1, 2])
  assert.deepEqual(
    partiallyFinished.pools.find(function (pool: { seriesId: number }) {
      return pool.seriesId === reservationSeries
    }).tables,
    [1, 2]
  )
  for (const match of reservedPool.state.matches.slice(1))
    await command(reservationSeries, {
      action: 'score',
      matchId: match.id,
      sets: [{ score1: 3, score2: 0 }]
    })
  const releasedSchedule = await request(schedulePath)
  for (const match of releasedSchedule.matches)
    if (match.seriesId === reservationSeries)
      assert.deepEqual(match.tables, [1, 2])
  assert.ok(
    !releasedSchedule.pools.some(function (pool: { seriesId: number }) {
      return pool.seriesId === reservationSeries
    })
  )
  const reclaimed = await command(prepared, {
    action: 'reserve-pool-tables',
    poolId: 2,
    tables: [2]
  })
  assert.deepEqual(reclaimed.state.pools[1]!.tables, [2])
  await command(prepared, {
    action: 'reserve-pool-tables',
    poolId: 2,
    tables: []
  })

  const concurrentReservations = [
    await seedSeries(
      tournament!.id,
      'Réservation concurrente A',
      3,
      'standard',
      false,
      true
    ),
    await seedSeries(
      tournament!.id,
      'Réservation concurrente B',
      3,
      'standard',
      false,
      true
    )
  ]
  const reservationAttempts = await Promise.all(
    concurrentReservations.map(async function (id) {
      const path = `/api/ja/tournois/${slug}/series/${id}/integral`
      const snapshot: Snapshot = await request(path)
      const response = await fetch(origin + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: [...cookies.values()].join('; ')
        },
        body: JSON.stringify({
          action: 'reserve-pool-tables',
          poolId: 1,
          tables: [4],
          version: snapshot.version
        })
      })
      return { id, status: response.status }
    })
  )
  assert.deepEqual(
    reservationAttempts
      .map(function (attempt) {
        return attempt.status
      })
      .sort(),
    [200, 400]
  )
  await command(
    reservationAttempts.find(function (attempt) {
      return attempt.status === 200
    })!.id,
    { action: 'reserve-pool-tables', poolId: 1, tables: [] }
  )

  const tableCheck = await seedSeries(
    tournament!.id,
    'Même poule — table explicitement occupée',
    3
  )
  const tableCheckPath = `/api/ja/tournois/${slug}/series/${tableCheck}/integral`
  const tableStarted = await command(tableCheck, {
    action: 'start',
    matchId: 1,
    table: 2
  })
  const samePoolTableWarning = await command(
    tableCheck,
    {
      action: 'start',
      matchId: 2,
      table: 2,
      confirmShortRest: true,
      confirmPlayerConflict: true
    },
    400
  )
  assert.match(
    (samePoolTableWarning as unknown as { message: string }).message,
    /occupée/
  )
  assert.deepEqual(await request(tableCheckPath), tableStarted)
  await command(tableCheck, {
    action: 'score',
    matchId: 1,
    sets: [{ score1: 11, score2: 0 }]
  })
  const simple = await seedSeries(
    tournament!.id,
    'Simple — 3 joueurs',
    3,
    'standard',
    true
  )
  const overlap = await seedSeries(
    tournament!.id,
    'Autre série — joueur commun',
    3,
    'standard',
    true
  )
  const speedy = await seedSeries(
    tournament!.id,
    'Speedy — 4 joueurs',
    4,
    'speedy'
  )
  const handicap = await seedSeries(
    tournament!.id,
    'Handicap — avance manuelle',
    3,
    'handicap'
  )
  await request(`/api/ja/tournois/${slug}/series/18/integral`, undefined, 404)
  await request(
    '/api/ja/tournois/tournoi-test-simple-speedy-et-handicap',
    undefined,
    403
  )

  const first = await command(simple, { action: 'start', matchId: 1 })
  assert.equal(first.state.matches[0]!.table, null)
  const simplePath = `/api/ja/tournois/${slug}/series/${simple}/integral`
  const attempts = await Promise.all(
    [1, 2].map(function () {
      return fetch(origin + simplePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: [...cookies.values()].join('; ')
        },
        body: JSON.stringify({
          action: 'start-pool',
          poolId: 1,
          version: first.version
        })
      })
    })
  )
  assert.deepEqual(
    attempts
      .map(function (response) {
        return response.status
      })
      .sort(),
    [200, 409]
  )
  const launched: Snapshot = await request(simplePath)
  assert.deepEqual(launched.state.matches[0], first.state.matches[0])
  assert.ok(
    launched.state.matches.every(function (match) {
      return match.status === 'in_progress' && match.table === null
    })
  )
  const overlapBefore = await request(
    `/api/ja/tournois/${slug}/series/${overlap}/integral`
  )
  const playerWarning = await command(
    overlap,
    { action: 'start-pool', poolId: 1 },
    400
  )
  assert.equal(
    (playerWarning as unknown as { data: { code: string } }).data.code,
    'PLAYER_CONFLICT_CONFIRMATION_REQUIRED'
  )
  const restOnly = await command(
    overlap,
    { action: 'start-pool', poolId: 1, confirmShortRest: true },
    400
  )
  assert.equal(
    (restOnly as unknown as { data: { code: string } }).data.code,
    'PLAYER_CONFLICT_CONFIRMATION_REQUIRED'
  )
  assert.deepEqual(
    await request(`/api/ja/tournois/${slug}/series/${overlap}/integral`),
    overlapBefore
  )
  const conflictCheck = await seedSeries(
    tournament!.id,
    'Confirmation — joueur commun en handicap',
    3,
    'handicap',
    true
  )
  const conflictPath = `/api/ja/tournois/${slug}/series/${conflictCheck}/integral`
  const beforeConflict = await request(conflictPath)
  const advances: Record<string, [number, number]> = {}
  for (const match of beforeConflict.state.matches)
    advances[String(match.id)] = [0, 2]
  const conflictWarning = await command(
    conflictCheck,
    { action: 'start-pool', poolId: 1, advances },
    400
  )
  assert.equal(
    (conflictWarning as unknown as { data: { code: string } }).data.code,
    'PLAYER_CONFLICT_CONFIRMATION_REQUIRED'
  )
  assert.deepEqual(await request(conflictPath), beforeConflict)
  await command(
    conflictCheck,
    {
      action: 'start-pool',
      poolId: 1,
      advances,
      confirmPlayerConflict: 'true'
    },
    400
  )
  await request(
    conflictPath,
    {
      action: 'start-pool',
      poolId: 1,
      advances,
      confirmPlayerConflict: true,
      version: beforeConflict.version - 1
    },
    409
  )
  const confirmedConflict = await command(conflictCheck, {
    action: 'start-pool',
    poolId: 1,
    advances,
    confirmPlayerConflict: true
  })
  assert.ok(
    confirmedConflict.state.matches.every(function (match) {
      return (
        match.status === 'in_progress' &&
        match.table === null &&
        JSON.stringify(match.rules?.startScores) === '[0,2]'
      )
    })
  )
  assert.equal(confirmedConflict.version, beforeConflict.version + 1)
  assert.deepEqual(await request(simplePath), launched)
  const directFinal = await seedSeries(
    tournament!.id,
    'Finale directe — joueur commun',
    2,
    'standard',
    true
  )
  const finalWarning = await command(
    directFinal,
    { action: 'start', matchId: 1, table: 4 },
    400
  )
  assert.equal(
    (finalWarning as unknown as { data: { code: string } }).data.code,
    'PLAYER_CONFLICT_CONFIRMATION_REQUIRED'
  )
  const startedFinal = await command(directFinal, {
    action: 'start',
    matchId: 1,
    table: 4,
    confirmPlayerConflict: true
  })
  assert.equal(startedFinal.state.matches[0]!.status, 'in_progress')
  assert.equal(startedFinal.state.matches[0]!.table, 4)
  const occupiedFinal = await seedSeries(
    tournament!.id,
    'Finale — table occupée',
    2
  )
  const occupiedWarning = await command(
    occupiedFinal,
    {
      action: 'start',
      matchId: 1,
      table: 4,
      confirmPlayerConflict: true,
      confirmShortRest: true
    },
    400
  )
  assert.match(
    (occupiedWarning as unknown as { message: string }).message,
    /occupée/
  )
  await command(directFinal, {
    action: 'score',
    matchId: 1,
    sets: [{ score1: 11, score2: 0 }]
  })
  for (const match of confirmedConflict.state.matches)
    await command(conflictCheck, {
      action: 'score',
      matchId: match.id,
      sets: [{ score1: 11, score2: 2 }]
    })
  await command(
    simple,
    { action: 'score', matchId: 2, sets: [{ score1: 12, score2: 0 }] },
    400
  )
  assert.deepEqual(await request(simplePath), launched)
  for (const match of launched.state.matches)
    await command(simple, {
      action: 'score',
      matchId: match.id,
      sets: [{ score1: 11, score2: 0 }]
    })
  let snapshot = await command(simple, { action: 'advance' })
  const barrage = snapshot.state.matches.find(function (match) {
    return match.phase === 'playoffs'
  })!
  const missingTable = await command(
    simple,
    { action: 'start', matchId: barrage.id },
    400
  )
  assert.match(
    (missingTable as unknown as { message: string }).message,
    /Table invalide/
  )
  await command(simple, { action: 'start', matchId: barrage.id, table: 5 }, 400)
  const beforeRest = await request(simplePath)
  const restWarning = await command(
    simple,
    { action: 'start', matchId: barrage.id, table: 2 },
    400
  )
  assert.equal(
    (restWarning as unknown as { data: { code: string } }).data.code,
    'REST_CONFIRMATION_REQUIRED'
  )
  assert.deepEqual(await request(simplePath), beforeRest)
  await command(
    simple,
    {
      action: 'start',
      matchId: barrage.id,
      table: 2,
      confirmShortRest: 'true'
    },
    400
  )
  await request(
    simplePath,
    {
      action: 'start',
      matchId: barrage.id,
      table: 2,
      version: beforeRest.version - 1,
      confirmShortRest: true
    },
    409
  )
  await command(simple, {
    action: 'start',
    matchId: barrage.id,
    table: 2,
    confirmShortRest: true
  })
  await command(simple, {
    action: 'score',
    matchId: barrage.id,
    sets: [{ score1: 11, score2: 0 }]
  })
  snapshot = await command(simple, { action: 'advance' })
  const final = snapshot.state.matches.find(function (match) {
    return match.phase === 'placement'
  })!
  await command(simple, { action: 'start', matchId: final.id }, 400)
  await command(simple, { action: 'start', matchId: final.id, table: 3 }, 400)
  await command(simple, {
    action: 'start',
    matchId: final.id,
    table: 3,
    confirmShortRest: true
  })
  snapshot = await command(simple, {
    action: 'score',
    matchId: final.id,
    sets: [{ score1: 11, score2: 0 }]
  })
  assert.deepEqual(Object.values(snapshot.state.placements).sort(), [1, 2, 3])
  const publicView = await request(
    `/api/tournois/${slug}/series/${simple}/integral`
  )
  assert.deepEqual(publicView.state.placements, snapshot.state.placements)
  assert.ok(
    publicView.state.entrants.every(function (entrant: {
      identities: string[]
    }) {
      return entrant.identities.length === 0
    })
  )

  const beforePoolRest = await request(
    `/api/ja/tournois/${slug}/series/${overlap}/integral`
  )
  const poolRestWarning = await command(
    overlap,
    { action: 'start-pool', poolId: 1 },
    400
  )
  assert.equal(
    (poolRestWarning as unknown as { data: { code: string } }).data.code,
    'REST_CONFIRMATION_REQUIRED'
  )
  assert.deepEqual(
    await request(`/api/ja/tournois/${slug}/series/${overlap}/integral`),
    beforePoolRest
  )
  const confirmedPool = await command(overlap, {
    action: 'start-pool',
    poolId: 1,
    confirmShortRest: true
  })
  assert.ok(
    confirmedPool.state.matches.every(function (match) {
      return match.status === 'in_progress'
    })
  )
  assert.deepEqual(confirmedPool.state.planning, beforePoolRest.state.planning)

  const speedyState = await command(speedy, { action: 'start-pool', poolId: 1 })
  assert.equal(speedyState.state.matches.length, 6)
  assert.ok(
    speedyState.state.matches.every(function (match) {
      return (
        match.status === 'in_progress' &&
        match.table === null &&
        match.rules?.pointsPerSet === 3
      )
    })
  )
  await command(speedy, {
    action: 'score',
    matchId: 1,
    sets: [{ score1: 3, score2: 1 }]
  })
  const handicapPath = `/api/ja/tournois/${slug}/series/${handicap}/integral`
  const beforeHandicap = await request(handicapPath)
  await command(handicap, { action: 'start-pool', poolId: 1 }, 400)
  assert.deepEqual(await request(handicapPath), beforeHandicap)
  const manual: Record<string, [number, number]> = {}
  for (const match of beforeHandicap.state.matches)
    manual[String(match.id)] = [0, 0]
  const handicapState = await command(handicap, {
    action: 'start-pool',
    poolId: 1,
    advances: manual
  })
  assert.ok(
    handicapState.state.matches.every(function (match) {
      return (
        match.status === 'in_progress' &&
        match.rules?.startScores.every(function (score) {
          return score === 0
        })
      )
    })
  )

  const uiSimple = await seedSeries(
    tournament!.id,
    'Interface — poule de 3',
    3,
    'standard',
    true
  )
  const uiHandicap = await seedSeries(
    tournament!.id,
    'Interface — handicap',
    4,
    'handicap',
    true
  )
  const uiRest = await seedSeries(
    tournament!.id,
    'Interface — repos à confirmer',
    3
  )
  const uiRestPool = await command(uiRest, { action: 'start-pool', poolId: 1 })
  for (const match of uiRestPool.state.matches)
    await command(uiRest, {
      action: 'score',
      matchId: match.id,
      sets: [{ score1: 11, score2: 0 }]
    })
  await command(uiRest, { action: 'advance' })
  if (process.argv.includes('--keep'))
    writeFileSync(
      '/tmp/pool-start-api-fixture.json',
      JSON.stringify({
        slug,
        tournamentId: tournament!.id,
        uiSimple,
        uiHandicap,
        uiRest
      })
    )
  process.stdout.write(
    'Pool API passed: pool table reservations across series, concurrent reservations, automatic release, table-free planning, same-pool table conflicts, partial launch, concurrency, scope, player conflict confirmation, scores, Speedy, handicap, rest confirmation, barrage and final.\n'
  )
} finally {
  if (!process.argv.includes('--keep'))
    await db.transaction(async function (tx) {
      // Sporting rows reference registrations, so remove snapshots before the roster.
      await tx
        .delete(schema.integralSeries)
        .where(
          inArray(
            schema.integralSeries.seriesId,
            tx
              .select({ id: schema.tournamentSeries.id })
              .from(schema.tournamentSeries)
              .where(eq(schema.tournamentSeries.tournamentId, tournament!.id))
          )
        )
      await tx
        .delete(schema.tournaments)
        .where(eq(schema.tournaments.id, tournament!.id))
    })
  await client.end()
}
