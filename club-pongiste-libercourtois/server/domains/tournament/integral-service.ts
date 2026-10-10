import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { tournamentDb } from '../../db/tournament-client'
import { persistIntegralRows } from '../../db/integral-persistence'
import {
  integralSeries,
  seriesRegistrations,
  tournaments,
  tournamentSeries
} from './schema'
import {
  advancePhase,
  createIntegral,
  planSchedule,
  recordResult,
  seriesEarliest,
  startMatch,
  swapPoolPlayers
} from './integral'
import type { IntegralState, Entrant } from './integral'
import type { SeriesRegistration } from './types'

export const integralCommand = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('generate'),
    version: z.number().int().nonnegative()
  }),
  z.object({
    action: z.literal('drop'),
    version: z.number().int().nonnegative()
  }),
  z.object({
    action: z.literal('swap'),
    version: z.number().int().nonnegative(),
    first: z.number().int().positive(),
    second: z.number().int().positive()
  }),
  z.object({
    action: z.literal('advance'),
    version: z.number().int().nonnegative(),
    poolOrders: z
      .record(z.string(), z.array(z.number().int().positive()))
      .optional()
  }),
  z.object({
    action: z.literal('start'),
    version: z.number().int().nonnegative(),
    matchId: z.number().int().positive(),
    table: z.number().int().positive(),
    startScores: z
      .tuple([z.number().int().nonnegative(), z.number().int().nonnegative()])
      .optional()
  }),
  z.object({
    action: z.literal('score'),
    version: z.number().int().nonnegative(),
    matchId: z.number().int().positive(),
    sets: z
      .array(
        z.object({
          score1: z.number().int().nonnegative(),
          score2: z.number().int().nonnegative()
        })
      )
      .min(1)
      .max(7)
  }),
  z.object({
    action: z.literal('forfeit'),
    version: z.number().int().nonnegative(),
    matchId: z.number().int().positive(),
    winnerId: z.number().int().positive()
  }),
  z.object({
    action: z.literal('identity'),
    version: z.number().int().nonnegative(),
    registrationId: z.number().int().positive(),
    partner: z.boolean().default(false),
    identity: z.string().min(1).max(100)
  })
])
function identity(registration: SeriesRegistration, partner = false): string {
  const override = partner
    ? registration.partnerIdentity
    : registration.playerIdentity
  if (override) return override
  const licence = partner
    ? registration.partnerLicenceNumber
    : registration.licenceNumber
  if (licence?.trim()) return `licence:${licence.trim()}`
  const first = partner
      ? registration.partnerFirstName
      : registration.firstName,
    last = partner ? registration.partnerLastName : registration.lastName
  const club = partner ? registration.partnerClub : registration.club
  return `name:${[first, last, club]
    .join(':')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()}`
}
function toEntrant(registration: SeriesRegistration): Entrant {
  const doubles = Boolean(registration.partnerLastName)
  const ranking = doubles
    ? registration.ranking === null || registration.partnerRanking === null
      ? null
      : registration.ranking + registration.partnerRanking
    : registration.ranking
  return {
    id: registration.id,
    ranking,
    club: registration.club,
    partnerClub: registration.partnerClub,
    identities: doubles
      ? [identity(registration), identity(registration, true)]
      : [identity(registration)],
    withdrawn: registration.isForfeit,
    seed: 0
  }
}
/** Read the snapshot and roster together, without exposing JA secrets. */
export async function getIntegral(seriesId: number) {
  const [series] = await tournamentDb
    .select()
    .from(tournamentSeries)
    .where(eq(tournamentSeries.id, seriesId))
  if (!series)
    throw createError({ statusCode: 404, message: 'Série introuvable' })
  const [snapshot] = await tournamentDb
    .select()
    .from(integralSeries)
    .where(eq(integralSeries.seriesId, seriesId))
  const registrations = await tournamentDb
    .select()
    .from(seriesRegistrations)
    .where(eq(seriesRegistrations.seriesId, seriesId))
  return {
    series,
    registrations,
    version: snapshot?.version ?? 0,
    state: snapshot?.state ?? null
  }
}
/** Lock the tournament so competing scores, phase changes and scheduling cannot overlap. */
export async function executeIntegral(seriesId: number, raw: unknown) {
  const parsed = integralCommand.safeParse(raw)
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      message:
        'Commande invalide : ' +
        parsed.error.issues.map(issue => issue.message).join(', ')
    })
  const command = parsed.data
  await tournamentDb.transaction(async function (tx) {
    let [series] = await tx
      .select()
      .from(tournamentSeries)
      .where(eq(tournamentSeries.id, seriesId))
    if (!series)
      throw createError({ statusCode: 404, message: 'Série introuvable' })
    await tx.execute(
      sql`select pg_advisory_xact_lock(84723, ${series.tournamentId})`
    )
    ;[series] = await tx
      .select()
      .from(tournamentSeries)
      .where(eq(tournamentSeries.id, seriesId))
    if (!series)
      throw createError({ statusCode: 404, message: 'Série introuvable' })
    const [snapshot] = await tx
      .select()
      .from(integralSeries)
      .where(eq(integralSeries.seriesId, seriesId))
    if (command.version !== (snapshot?.version ?? 0))
      throw createError({
        statusCode: 409,
        message: 'Les résultats ont changé. Actualisez avant de recommencer.'
      })
    if (command.action === 'generate') {
      if (
        !['draft', 'registration', 'bracket_generated'].includes(
          series.status
        ) ||
        (snapshot?.state && snapshot.state.phase !== 'ready')
      )
        throw createError({
          statusCode: 400,
          message: 'La série a déjà commencé.'
        })
      const registrations = await tx
        .select()
        .from(seriesRegistrations)
        .where(eq(seriesRegistrations.seriesId, seriesId))
      const present = registrations.filter(function (entry) {
        return entry.attendanceStatus === 'present' && !entry.isForfeit
      })
      let state: IntegralState
      try {
        state = createIntegral(present.map(toEntrant), {
          pointsPerSet: series.pointsPerSet,
          setsToWin: series.setsToWin,
          handicap: series.seriesType === 'handicap'
        })
      } catch (error) {
        throw createError({
          statusCode: 400,
          message:
            error instanceof Error
              ? error.message
              : 'Composition des poules invalide.'
        })
      }
      await tx
        .insert(integralSeries)
        .values({ seriesId, state, version: (snapshot?.version ?? 0) + 1 })
        .onConflictDoUpdate({
          target: integralSeries.seriesId,
          set: {
            state,
            version: (snapshot?.version ?? 0) + 1,
            updatedAt: new Date()
          }
        })
      await tx
        .update(tournamentSeries)
        .set({ status: 'bracket_generated' })
        .where(eq(tournamentSeries.id, seriesId))
      await persistIntegralRows(tx, seriesId, state)
      return
    }
    if (!snapshot?.state)
      throw createError({
        statusCode: 400,
        message: 'Générez les poules au préalable.'
      })
    const state = snapshot.state
    if (command.action === 'drop') {
      if (state.phase !== 'ready')
        throw createError({
          statusCode: 400,
          message: 'La série a déjà commencé.'
        })
      await tx
        .update(integralSeries)
        .set({
          state: null,
          version: snapshot.version + 1,
          updatedAt: new Date()
        })
        .where(eq(integralSeries.seriesId, seriesId))
      await tx
        .update(tournamentSeries)
        .set({ status: 'registration' })
        .where(eq(tournamentSeries.id, seriesId))
      await persistIntegralRows(tx, seriesId, null)
      return
    }
    try {
      if (command.action === 'swap')
        swapPoolPlayers(state, command.first, command.second)
      if (command.action === 'advance')
        advancePhase(state, { poolOrders: command.poolOrders })
      if (command.action === 'start') {
        const [tournament] = await tx
          .select()
          .from(tournaments)
          .where(eq(tournaments.id, series.tournamentId))
        if (command.table > tournament!.tableCount)
          throw new Error('Cette table n’existe pas.')
        const others = await tx
          .select()
          .from(integralSeries)
          .innerJoin(
            tournamentSeries,
            eq(integralSeries.seriesId, tournamentSeries.id)
          )
          .where(eq(tournamentSeries.tournamentId, series.tournamentId))
        const match = state.matches.find(function (entry) {
          return entry.id === command.matchId
        })
        const identities = state.entrants
          .filter(function (entry) {
            return entry.id === match?.player1 || entry.id === match?.player2
          })
          .flatMap(function (entry) {
            return entry.identities
          })
        for (const other of others)
          for (const playing of other.integral_series.state?.matches ?? [])
            if (
              playing.status === 'finished' ||
              playing.status === 'in_progress'
            ) {
              const shared = other.integral_series.state!.entrants.some(
                function (entry) {
                  return (
                    (entry.id === playing.player1 ||
                      entry.id === playing.player2) &&
                    entry.identities.some(function (id) {
                      return identities.includes(id)
                    })
                  )
                }
              )
              const rest = state.planning?.rest ?? 10
              if (
                shared &&
                playing.status === 'finished' &&
                playing.finishedAt &&
                Date.now() <
                  new Date(playing.finishedAt).getTime() + rest * 60000
              )
                throw new Error(
                  `Le joueur doit encore se reposer (${rest} minutes entre les matchs).`
                )
              if (playing.status !== 'in_progress') continue
              if (playing.table === command.table)
                throw new Error('La table est déjà occupée.')
              if (
                other.integral_series.state!.entrants.some(function (entry) {
                  return (
                    (entry.id === playing.player1 ||
                      entry.id === playing.player2) &&
                    entry.identities.some(function (id) {
                      return identities.includes(id)
                    })
                  )
                })
              )
                throw new Error('Un joueur dispute déjà un autre match.')
            }
        startMatch(state, command.matchId, {
          table: command.table,
          startScores: command.startScores
        })
      }
      if (command.action === 'score')
        recordResult(state, command.matchId, command.sets)
      if (command.action === 'forfeit')
        recordResult(state, command.matchId, [], command.winnerId)
      if (command.action === 'identity') {
        const all = await tx
          .select()
          .from(integralSeries)
          .innerJoin(
            tournamentSeries,
            eq(integralSeries.seriesId, tournamentSeries.id)
          )
          .where(eq(tournamentSeries.tournamentId, series.tournamentId))
        if (
          all.some(function (row) {
            return row.integral_series.state?.matches.some(function (match) {
              return match.status === 'in_progress'
            })
          })
        )
          throw new Error(
            'Terminez les matchs en cours du tournoi avant de rattacher une identité.'
          )
        const entrant = state.entrants.find(function (entry) {
          return entry.id === command.registrationId
        })
        if (!entrant || (command.partner && entrant.identities.length < 2))
          throw new Error('Participant introuvable.')
        entrant.identities[command.partner ? 1 : 0] = command.identity
        await tx
          .update(seriesRegistrations)
          .set(
            command.partner
              ? { partnerIdentity: command.identity }
              : { playerIdentity: command.identity }
          )
          .where(
            and(
              eq(seriesRegistrations.id, command.registrationId),
              eq(seriesRegistrations.seriesId, seriesId)
            )
          )
      }
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Action invalide'
      })
    }
    await tx
      .update(integralSeries)
      .set({ state, version: snapshot.version + 1, updatedAt: new Date() })
      .where(
        and(
          eq(integralSeries.seriesId, seriesId),
          eq(integralSeries.version, snapshot.version)
        )
      )
    await tx
      .update(tournamentSeries)
      .set({
        status:
          state.phase === 'finished'
            ? 'finished'
            : state.phase === 'ready'
              ? 'bracket_generated'
              : 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(tournamentSeries.id, seriesId))
    await persistIntegralRows(tx, seriesId, state)
    for (const entrant of state.entrants)
      if (entrant.withdrawn)
        await tx
          .update(seriesRegistrations)
          .set({ isForfeit: true })
          .where(eq(seriesRegistrations.id, entrant.id))
  })
  return getIntegral(seriesId)
}
const planningInput = z.object({
  startAt: z.string().datetime({ offset: true }),
  duration: z.number().int().min(1).max(240).default(30),
  rest: z.number().int().min(0).max(120).default(10),
  versions: z.record(z.string(), z.number().int().nonnegative())
})

/** Return a tournament-wide schedule containing sporting and public names only. */
export async function getTournamentSchedule(tournamentId: number) {
  const rows = await tournamentDb
    .select()
    .from(integralSeries)
    .innerJoin(
      tournamentSeries,
      eq(integralSeries.seriesId, tournamentSeries.id)
    )
    .where(eq(tournamentSeries.tournamentId, tournamentId))
  const registrations = await tournamentDb
    .select({ registration: seriesRegistrations })
    .from(seriesRegistrations)
    .innerJoin(
      tournamentSeries,
      eq(seriesRegistrations.seriesId, tournamentSeries.id)
    )
    .where(eq(tournamentSeries.tournamentId, tournamentId))
  const names = new Map<number, string>()
  const clubs = new Map<number, string>()
  for (const { registration } of registrations) {
    clubs.set(
      registration.id,
      [registration.club, registration.partnerClub].filter(Boolean).join(' / ')
    )
    names.set(
      registration.id,
      `${registration.firstName} ${registration.lastName}${registration.partnerLastName ? ` / ${registration.partnerFirstName ?? ''} ${registration.partnerLastName}` : ''}`
    )
  }
  const matches = rows
    .flatMap(function (row) {
      return (row.integral_series.state?.matches ?? []).map(function (match) {
        return {
          seriesId: row.tournament_series.id,
          seriesName: row.tournament_series.name,
          id: match.id,
          phase: match.phase,
          poolId: match.poolId,
          rangeStart: match.rangeStart,
          rangeEnd: match.rangeEnd,
          player1Name: names.get(match.player1 ?? 0) ?? 'À déterminer',
          player2Name: names.get(match.player2 ?? 0) ?? 'À déterminer',
          player1Club: clubs.get(match.player1 ?? 0) ?? '',
          player2Club: clubs.get(match.player2 ?? 0) ?? '',
          table: match.table,
          scheduledAt: match.scheduledAt,
          startedAt: match.startedAt,
          status: match.status
        }
      })
    })
    .sort(function (a, b) {
      return (
        (a.scheduledAt ?? a.startedAt ?? '9999').localeCompare(
          b.scheduledAt ?? b.startedAt ?? '9999'
        ) ||
        a.seriesId - b.seriesId ||
        a.id - b.id
      )
    })
  const versions: Record<string, number> = {}
  for (const row of rows)
    if (row.integral_series.state)
      versions[String(row.integral_series.seriesId)] =
        row.integral_series.version
  return { matches, versions }
}
/** Plan ready matches in all series, keeping started and finished games fixed. */
export async function scheduleTournament(tournamentId: number, raw: unknown) {
  const parsed = planningInput.safeParse(raw)
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      message: 'Paramètres du planning invalides.'
    })
  const input = parsed.data
  await tournamentDb.transaction(async function (tx) {
    await tx.execute(sql`select pg_advisory_xact_lock(84723, ${tournamentId})`)
    const [tournament] = await tx
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
    const rows = await tx
      .select()
      .from(integralSeries)
      .innerJoin(
        tournamentSeries,
        eq(integralSeries.seriesId, tournamentSeries.id)
      )
      .where(eq(tournamentSeries.tournamentId, tournamentId))
    const states: { state: IntegralState; earliest: string }[] = []
    for (const row of rows) {
      if (!row.integral_series.state) continue
      if (
        input.versions[String(row.integral_series.seriesId)] !==
        row.integral_series.version
      )
        throw createError({
          statusCode: 409,
          message: 'Une série a changé. Actualisez le planning.'
        })
      states.push({
        state: row.integral_series.state,
        earliest: seriesEarliest(
          row.tournament_series.seriesDate ?? tournament!.date,
          row.tournament_series.startTime,
          input.startAt
        )
      })
    }
    if (!tournament)
      throw createError({ statusCode: 404, message: 'Tournoi introuvable' })
    try {
      planSchedule(states, tournament.tableCount, input.duration, input.rest)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Planning invalide'
      })
    }
    for (const row of rows) {
      if (!row.integral_series.state) continue
      await tx
        .update(integralSeries)
        .set({
          state: row.integral_series.state,
          version: row.integral_series.version + 1,
          updatedAt: new Date()
        })
        .where(eq(integralSeries.seriesId, row.integral_series.seriesId))
      await persistIntegralRows(
        tx,
        row.integral_series.seriesId,
        row.integral_series.state
      )
    }
  })
  return { success: true }
}
