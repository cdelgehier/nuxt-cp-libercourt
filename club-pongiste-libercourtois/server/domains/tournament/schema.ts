import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const seriesStatusEnum = pgEnum("series_status", [
  "draft",
  "registration",
  "bracket_generated",
  "in_progress",
  "finished",
]);

export const seriesFormatEnum = pgEnum("series_format", ["singles", "doubles"]);

// Series type = format/rules only. Age restrictions are handled via ageCategories[].
export const seriesTypeEnum = pgEnum("series_type", [
  "standard",
  "speedy",
  "handicap",
  "points_limit",
  "mixed_doubles",
  "coupe_davis",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "unknown",
  "present",
  "absent",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "in_progress",
  "finished",
  "forfeit",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  date: text("date").notNull(), // ISO date string "2025-06-15"
  location: text("location"),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  dateEnd: text("date_end"), // ISO date string, null = single day
  description: text("description"),
  tableCount: integer("table_count").notNull().default(1),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tournamentJaAccess = pgTable("tournament_ja_access", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pin: text("pin").notNull(), // bcrypt hash
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournamentSeries = pgTable("tournament_series", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  seriesFormat: seriesFormatEnum("series_format").notNull().default("singles"),
  seriesType: seriesTypeEnum("series_type").notNull().default("standard"),
  ageCategories: text("age_categories").array().notNull().default([]),
  femalesOnly: boolean("females_only").notNull().default(false),
  pointsLimitMin: integer("points_limit_min"), // pour series_type = 'points_limit'
  pointsLimitMax: integer("points_limit_max"),
  status: seriesStatusEnum("status").notNull().default("draft"),
  maxPlayers: integer("max_players"), // null = illimité
  setsToWin: integer("sets_to_win").notNull().default(3), // speedy → 1
  pointsPerSet: integer("points_per_set").notNull().default(11), // speedy → 3
  sortOrder: integer("sort_order").notNull().default(0),
  seriesDate: text("series_date"), // YYYY-MM-DD, null = uses tournament date
  startTime: text("start_time"), // HH:MM, null = no specific time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seriesRegistrations = pgTable("series_registrations", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id")
    .notNull()
    .references(() => tournamentSeries.id, { onDelete: "cascade" }),
  licenceNumber: text("licence_number"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  club: text("club"),
  ranking: integer("ranking"), // points fédéraux FFTT
  playerCategory: text("player_category"), // FFTT age category (poussin, benjamin, etc.)
  playerGender: text("player_gender"), // "M" | "F" | null (unknown)
  handicapPoints: integer("handicap_points").notNull().default(0),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("unpaid"),
  attendanceStatus: attendanceStatusEnum("attendance_status")
    .notNull()
    .default("unknown"),
  isForfeit: boolean("is_forfeit").notNull().default(false),
  seedPosition: integer("seed_position"), // calculé à la génération du bracket
  // Partenaire (doubles uniquement)
  partnerLicenceNumber: text("partner_licence_number"),
  partnerFirstName: text("partner_first_name"),
  partnerLastName: text("partner_last_name"),
  partnerClub: text("partner_club"),
  partnerRanking: integer("partner_ranking"),
  notes: text("notes"),
  registeredAt: timestamp("registered_at").defaultNow(),
});

// Self-referential FK (next_match_id) : déclarée après la table via relation
// pour éviter le problème de référence circulaire Drizzle.
export const bracketMatches = pgTable(
  "bracket_matches",
  {
    id: serial("id").primaryKey(),
    seriesId: integer("series_id")
      .notNull()
      .references(() => tournamentSeries.id, { onDelete: "cascade" }),
    round: integer("round").notNull(), // 1 = finale, N = 1er tour
    matchNumber: integer("match_number").notNull(), // position dans le tour (1-based)
    tableNumber: integer("table_number"), // table de jeu assignée
    player1Id: integer("player1_id").references(() => seriesRegistrations.id, {
      onDelete: "set null",
    }), // null = BYE
    player2Id: integer("player2_id").references(() => seriesRegistrations.id, {
      onDelete: "set null",
    }), // null = BYE
    winnerId: integer("winner_id").references(() => seriesRegistrations.id, {
      onDelete: "set null",
    }),
    status: matchStatusEnum("status").notNull().default("pending"),
    // Self-ref : next_match_id ne peut pas référencer bracketMatches ici
    // car la table n'est pas encore définie. On utilise integer simple,
    // la contrainte FK est ajoutée manuellement dans la migration si besoin.
    nextMatchId: integer("next_match_id"),
    nextMatchSlot: integer("next_match_slot"), // 1 ou 2
    enteredByJaId: integer("entered_by_ja_id").references(
      () => tournamentJaAccess.id,
      { onDelete: "set null" },
    ),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.seriesId, table.round, table.matchNumber)],
);

export const matchSets = pgTable("match_sets", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => bracketMatches.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(), // 1-based
  score1: integer("score1").notNull(),
  score2: integer("score2").notNull(),
});
