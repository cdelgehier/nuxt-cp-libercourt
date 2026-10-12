import type { IntegralState } from './integral'
import { sql } from 'drizzle-orm'
import {
  jsonb,
  boolean,
  doublePrecision,
  integer,
  check,
  primaryKey,
  foreignKey,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const seriesStatusEnum = pgEnum('series_status', [
  'draft',
  'registration',
  'bracket_generated',
  'in_progress',
  'finished'
])

export const seriesFormatEnum = pgEnum('series_format', ['singles', 'doubles'])

// Series type = format/rules only. Age restrictions are handled via ageCategories[].
export const seriesTypeEnum = pgEnum('series_type', [
  'standard',
  'speedy',
  'handicap',
  'points_limit',
  'mixed_doubles',
  'coupe_davis'
])

export const bracketModeEnum = pgEnum('bracket_mode', ['single', 'double'])
export const bracketSideEnum = pgEnum('bracket_side', [
  'winners',
  'losers',
  'grand_final'
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'paid',
  'refunded'
])

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'unknown',
  'present',
  'absent'
])

export const matchStatusEnum = pgEnum('match_status', [
  'pending',
  'in_progress',
  'finished',
  'forfeit'
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  date: text('date').notNull(), // ISO date string "2025-06-15"
  location: text('location'),
  locationLat: doublePrecision('location_lat'),
  locationLng: doublePrecision('location_lng'),
  dateEnd: text('date_end'), // ISO date string, null = single day
  description: text('description'),
  tableCount: integer('table_count').notNull().default(1),
  isPublished: boolean('is_published').notNull().default(false),
  /** Demo tools are enabled per tournament, including on the production site. */
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const tournamentJaAccess = pgTable('tournament_ja_access', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id')
    .notNull()
    .references(() => tournaments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pin: text('pin').notNull(), // bcrypt hash
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow()
})

export const tournamentSeries = pgTable(
  'tournament_series',
  {
    id: serial('id').primaryKey(),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    seriesFormat: seriesFormatEnum('series_format')
      .notNull()
      .default('singles'),
    seriesType: seriesTypeEnum('series_type').notNull().default('standard'),
    ageCategories: text('age_categories').array().notNull().default([]),
    femalesOnly: boolean('females_only').notNull().default(false),
    pointsLimitMin: integer('points_limit_min'), // pour series_type = 'points_limit'
    pointsLimitMax: integer('points_limit_max'),
    status: seriesStatusEnum('status').notNull().default('draft'),
    maxPlayers: integer('max_players'), // null = illimité
    bracketMode: bracketModeEnum('bracket_mode').notNull().default('single'),
    setsToWin: integer('sets_to_win').notNull().default(3), // speedy → 1
    pointsPerSet: integer('points_per_set').notNull().default(11), // speedy → 3
    sortOrder: integer('sort_order').notNull().default(0),
    seriesDate: text('series_date').notNull(), // YYYY-MM-DD in Europe/Paris
    startTime: text('start_time').notNull(), // HH:MM in Europe/Paris
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  function (table) {
    return [
      check(
        'tournament_series_date_valid',
        sql`${table.seriesDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND ${table.seriesDate}::date IS NOT NULL`
      ),
      check(
        'tournament_series_start_time_valid',
        sql`${table.startTime} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`
      )
    ]
  }
)

export const seriesRegistrations = pgTable('series_registrations', {
  id: serial('id').primaryKey(),
  seriesId: integer('series_id')
    .notNull()
    .references(() => tournamentSeries.id, { onDelete: 'cascade' }),
  licenceNumber: text('licence_number'),
  playerIdentity: text('player_identity'),
  partnerIdentity: text('partner_identity'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  club: text('club'),
  ranking: integer('ranking'), // points fédéraux FFTT
  playerCategory: text('player_category'), // FFTT age category (poussin, benjamin, etc.)
  playerGender: text('player_gender'), // "M" | "F" | null (unknown)
  handicapPoints: integer('handicap_points').notNull().default(0),
  paymentStatus: paymentStatusEnum('payment_status')
    .notNull()
    .default('unpaid'),
  attendanceStatus: attendanceStatusEnum('attendance_status')
    .notNull()
    .default('unknown'),
  isForfeit: boolean('is_forfeit').notNull().default(false),
  seedPosition: integer('seed_position'), // calculé à la génération du bracket
  // Partenaire (doubles uniquement)
  partnerLicenceNumber: text('partner_licence_number'),
  partnerFirstName: text('partner_first_name'),
  partnerLastName: text('partner_last_name'),
  partnerClub: text('partner_club'),
  partnerRanking: integer('partner_ranking'),
  notes: text('notes'),
  registeredAt: timestamp('registered_at').defaultNow()
})

// Self-referential FK (next_match_id) : déclarée après la table via relation
// pour éviter le problème de référence circulaire Drizzle.
export const bracketMatches = pgTable(
  'bracket_matches',
  {
    id: serial('id').primaryKey(),
    seriesId: integer('series_id')
      .notNull()
      .references(() => tournamentSeries.id, { onDelete: 'cascade' }),
    bracketSide: bracketSideEnum('bracket_side').notNull().default('winners'),
    loserNextMatchId: integer('loser_next_match_id'),
    loserNextMatchSlot: integer('loser_next_match_slot'),
    round: integer('round').notNull(), // 1 = finale, N = 1er tour
    matchNumber: integer('match_number').notNull(), // position dans le tour (1-based)
    tableNumber: integer('table_number'), // table de jeu assignée
    player1Id: integer('player1_id').references(() => seriesRegistrations.id, {
      onDelete: 'set null'
    }), // null = BYE
    player2Id: integer('player2_id').references(() => seriesRegistrations.id, {
      onDelete: 'set null'
    }), // null = BYE
    winnerId: integer('winner_id').references(() => seriesRegistrations.id, {
      onDelete: 'set null'
    }),
    status: matchStatusEnum('status').notNull().default('pending'),
    // Self-ref : next_match_id ne peut pas référencer bracketMatches ici
    // car la table n'est pas encore définie. On utilise integer simple,
    // la contrainte FK est ajoutée manuellement dans la migration si besoin.
    nextMatchId: integer('next_match_id'),
    nextMatchSlot: integer('next_match_slot'), // 1 ou 2
    enteredByJaId: integer('entered_by_ja_id').references(
      () => tournamentJaAccess.id,
      { onDelete: 'set null' }
    ),
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').defaultNow()
  },
  table => [
    unique().on(
      table.seriesId,
      table.bracketSide,
      table.round,
      table.matchNumber
    )
  ]
)

export const matchSets = pgTable('match_sets', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .notNull()
    .references(() => bracketMatches.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(), // 1-based
  score1: integer('score1').notNull(),
  score2: integer('score2').notNull()
})

/** One versioned sporting snapshot makes phase and score writes atomic. */
export const integralSeries = pgTable('integral_series', {
  seriesId: integer('series_id')
    .primaryKey()
    .references(() => tournamentSeries.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(0),
  state: jsonb('state').$type<IntegralState>(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const integralPools = pgTable(
  'integral_pools',
  {
    seriesId: integer('series_id')
      .notNull()
      .references(() => integralSeries.seriesId, { onDelete: 'cascade' }),
    id: integer('id').notNull()
  },
  table => [primaryKey({ columns: [table.seriesId, table.id] })]
)

export const integralPoolMembers = pgTable(
  'integral_pool_members',
  {
    seriesId: integer('series_id').notNull(),
    poolId: integer('pool_id').notNull(),
    registrationId: integer('registration_id')
      .notNull()
      .references(() => seriesRegistrations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    rank: integer('rank')
  },
  table => [
    primaryKey({ columns: [table.seriesId, table.registrationId] }),
    foreignKey({
      columns: [table.seriesId, table.poolId],
      foreignColumns: [integralPools.seriesId, integralPools.id]
    }).onDelete('cascade'),
    unique().on(table.seriesId, table.poolId, table.position)
  ]
)

export const integralPhases = pgTable(
  'integral_phases',
  {
    seriesId: integer('series_id')
      .notNull()
      .references(() => integralSeries.seriesId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    current: boolean('current').notNull()
  },
  table => [primaryKey({ columns: [table.seriesId, table.name] })]
)

export const integralRanges = pgTable(
  'integral_ranges',
  {
    seriesId: integer('series_id')
      .notNull()
      .references(() => integralSeries.seriesId, { onDelete: 'cascade' }),
    start: integer('start').notNull(),
    end: integer('end').notNull(),
    generated: boolean('generated').notNull(),
    sources: jsonb('sources')
      .$type<IntegralState['nodes'][number]['sources']>()
      .notNull()
  },
  table => [primaryKey({ columns: [table.seriesId, table.start, table.end] })]
)

/** Match ids are local to a series; every destination is a range of final places. */
export const integralMatches = pgTable(
  'integral_matches',
  {
    seriesId: integer('series_id')
      .notNull()
      .references(() => integralSeries.seriesId, { onDelete: 'cascade' }),
    id: integer('id').notNull(),
    key: text('key').notNull(),
    phase: text('phase').notNull(),
    poolId: integer('pool_id'),
    rangeStart: integer('range_start'),
    rangeEnd: integer('range_end'),
    player1: integer('player1').references(() => seriesRegistrations.id),
    player2: integer('player2').references(() => seriesRegistrations.id),
    winner: integer('winner').references(() => seriesRegistrations.id),
    loser: integer('loser').references(() => seriesRegistrations.id),
    winnerRangeStart: integer('winner_range_start'),
    winnerRangeEnd: integer('winner_range_end'),
    loserRangeStart: integer('loser_range_start'),
    loserRangeEnd: integer('loser_range_end'),
    status: text('status').notNull(),
    rules: jsonb('rules').$type<IntegralState['matches'][number]['rules']>(),
    sources: jsonb('sources')
      .$type<IntegralState['matches'][number]['sources']>()
      .notNull(),
    forfeitPlayers: jsonb('forfeit_players').$type<number[]>().notNull(),
    table: integer('table'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true })
  },
  table => [
    primaryKey({ columns: [table.seriesId, table.id] }),
    unique().on(table.seriesId, table.key),
    foreignKey({
      columns: [table.seriesId, table.phase],
      foreignColumns: [integralPhases.seriesId, integralPhases.name]
    }),
    foreignKey({
      columns: [table.seriesId, table.poolId],
      foreignColumns: [integralPools.seriesId, integralPools.id]
    }),
    foreignKey({
      columns: [table.seriesId, table.rangeStart, table.rangeEnd],
      foreignColumns: [
        integralRanges.seriesId,
        integralRanges.start,
        integralRanges.end
      ]
    }),
    foreignKey({
      columns: [table.seriesId, table.winnerRangeStart, table.winnerRangeEnd],
      foreignColumns: [
        integralRanges.seriesId,
        integralRanges.start,
        integralRanges.end
      ]
    }),
    foreignKey({
      columns: [table.seriesId, table.loserRangeStart, table.loserRangeEnd],
      foreignColumns: [
        integralRanges.seriesId,
        integralRanges.start,
        integralRanges.end
      ]
    })
  ]
)

export const integralSets = pgTable(
  'integral_sets',
  {
    seriesId: integer('series_id').notNull(),
    matchId: integer('match_id').notNull(),
    number: integer('number').notNull(),
    score1: integer('score1').notNull(),
    score2: integer('score2').notNull()
  },
  table => [
    primaryKey({ columns: [table.seriesId, table.matchId, table.number] }),
    foreignKey({
      columns: [table.seriesId, table.matchId],
      foreignColumns: [integralMatches.seriesId, integralMatches.id]
    }).onDelete('cascade')
  ]
)

export const integralPlacements = pgTable(
  'integral_placements',
  {
    seriesId: integer('series_id')
      .notNull()
      .references(() => integralSeries.seriesId, { onDelete: 'cascade' }),
    registrationId: integer('registration_id')
      .notNull()
      .references(() => seriesRegistrations.id),
    place: integer('place').notNull()
  },
  table => [
    primaryKey({ columns: [table.seriesId, table.registrationId] }),
    unique().on(table.seriesId, table.place)
  ]
)
