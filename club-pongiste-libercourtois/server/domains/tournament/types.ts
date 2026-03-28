import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  bracketMatches,
  matchSets,
  seriesRegistrations,
  tournamentJaAccess,
  tournamentSeries,
  tournaments,
} from "./schema";

// ---------------------------------------------------------------------------
// Schémas Zod générés depuis Drizzle
// ---------------------------------------------------------------------------

export const insertTournamentSchema = createInsertSchema(tournaments);
export const selectTournamentSchema = createSelectSchema(tournaments);

export const insertJaAccessSchema = createInsertSchema(tournamentJaAccess);
export const selectJaAccessSchema = createSelectSchema(tournamentJaAccess);

export const insertSeriesSchema = createInsertSchema(tournamentSeries);
export const selectSeriesSchema = createSelectSchema(tournamentSeries);

export const insertRegistrationSchema = createInsertSchema(seriesRegistrations);
export const selectRegistrationSchema = createSelectSchema(seriesRegistrations);

export const insertBracketMatchSchema = createInsertSchema(bracketMatches);
export const selectBracketMatchSchema = createSelectSchema(bracketMatches);

export const insertMatchSetSchema = createInsertSchema(matchSets);
export const selectMatchSetSchema = createSelectSchema(matchSets);

// ---------------------------------------------------------------------------
// Types TypeScript inférés
// ---------------------------------------------------------------------------

export type Tournament = InferSelectModel<typeof tournaments>;
export type InsertTournament = InferInsertModel<typeof tournaments>;

export type TournamentJaAccess = InferSelectModel<typeof tournamentJaAccess>;
export type InsertJaAccess = InferInsertModel<typeof tournamentJaAccess>;

export type TournamentSeries = InferSelectModel<typeof tournamentSeries>;
export type InsertTournamentSeries = InferInsertModel<typeof tournamentSeries>;

export type SeriesRegistration = InferSelectModel<typeof seriesRegistrations>;
export type InsertSeriesRegistration = InferInsertModel<
  typeof seriesRegistrations
>;

export type BracketMatch = InferSelectModel<typeof bracketMatches>;
export type InsertBracketMatch = InferInsertModel<typeof bracketMatches>;

export type MatchSet = InferSelectModel<typeof matchSets>;
export type InsertMatchSet = InferInsertModel<typeof matchSets>;

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Age categories (stored as text[], independent of seriesType)
// ---------------------------------------------------------------------------

export const AGE_CATEGORIES = [
  "poussin",
  "benjamin",
  "minimes",
  "cadets",
  "juniors",
  "veterans",
  "super_veterans",
] as const;

export type AgeCategory = (typeof AGE_CATEGORIES)[number];

export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  poussin: "Poussin",
  benjamin: "Benjamin",
  minimes: "Minimes",
  cadets: "Cadets",
  juniors: "Juniors",
  veterans: "Vétérans",
  super_veterans: "Super Vétérans",
};

// ---------------------------------------------------------------------------
// Types dérivés des enums Drizzle
// ---------------------------------------------------------------------------

export type SeriesStatus = TournamentSeries["status"];
export type SeriesFormat = TournamentSeries["seriesFormat"];
export type SeriesType = TournamentSeries["seriesType"];
export type PaymentStatus = SeriesRegistration["paymentStatus"];
export type AttendanceStatus = SeriesRegistration["attendanceStatus"];
export type MatchStatus = BracketMatch["status"];

// ---------------------------------------------------------------------------
// Types enrichis (computed)
// ---------------------------------------------------------------------------

export interface EnrichedTournament extends Tournament {
  seriesCount: number;
  totalRegistrants: number;
}

export interface BracketMatchWithPlayers extends BracketMatch {
  player1: SeriesRegistration | null;
  player2: SeriesRegistration | null;
  winner: SeriesRegistration | null;
  sets: MatchSet[];
}

export interface BracketRound {
  round: number;
  label: string; // "1er tour", "Quarts", "Demies", "Finale"
  matches: BracketMatchWithPlayers[];
}

export interface SeriesWithBracket extends TournamentSeries {
  registrations: SeriesRegistration[];
  rounds: BracketRound[];
}

export interface TournamentWithSeries extends Tournament {
  series: Array<TournamentSeries & { registrationCount: number }>;
}

// ---------------------------------------------------------------------------
// Schémas de validation API
// ---------------------------------------------------------------------------

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : YYYY-MM-DD");
const isoDateOptional = z.preprocess((v) => v || undefined, isoDate.optional());

export const createTournamentInputSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  date: isoDate,
  dateEnd: isoDateOptional,
  location: z
    .string()
    .max(200, "Le lieu ne peut pas dépasser 200 caractères")
    .optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional(),
  tableCount: z
    .number()
    .int()
    .min(1, "Minimum 1 table")
    .max(100, "Maximum 100 tables")
    .default(1),
  isPublished: z.boolean().default(false),
});

export const updateTournamentInputSchema =
  createTournamentInputSchema.partial();

const SERIES_TYPE_ENUM = [
  "standard",
  "speedy",
  "handicap",
  "points_limit",
  "mixed_doubles",
  "coupe_davis",
] as const;

export const createSeriesInputSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères"),
    seriesFormat: z.enum(["singles", "doubles"]).default("singles"),
    seriesType: z.enum(SERIES_TYPE_ENUM).default("standard"),
    ageCategories: z.array(z.enum(AGE_CATEGORIES)).default([]),
    femalesOnly: z.boolean().default(false),
    pointsLimitMin: z.number().int().nonnegative().optional(),
    pointsLimitMax: z.number().int().nonnegative().optional(),
    maxPlayers: z.number().int().positive().optional(),
    setsToWin: z.number().int().min(1).max(4).default(3),
    pointsPerSet: z.number().int().min(3).max(21).default(11),
    sortOrder: z.number().int().default(0),
    seriesDate: isoDateOptional,
    startTime: z.preprocess(
      (v) => v || undefined,
      z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Format attendu : HH:MM")
        .optional(),
    ),
  })
  .refine(
    (d) =>
      d.seriesType !== "points_limit" ||
      d.pointsLimitMin !== undefined ||
      d.pointsLimitMax !== undefined,
    {
      message:
        "Une série 'points_limit' doit avoir au moins une borne de points",
    },
  )
  .transform((d) => {
    if (d.seriesType === "speedy") {
      return { ...d, setsToWin: 1 as const, pointsPerSet: 3 as const };
    }
    if (d.seriesType === "mixed_doubles") {
      return { ...d, seriesFormat: "doubles" as const };
    }
    return d;
  });

export const updateSeriesInputSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    seriesFormat: z.enum(["singles", "doubles"]).optional(),
    seriesType: z.enum(SERIES_TYPE_ENUM).optional(),
    ageCategories: z.array(z.enum(AGE_CATEGORIES)).optional(),
    femalesOnly: z.boolean().optional(),
    pointsLimitMin: z.number().int().nonnegative().optional(),
    pointsLimitMax: z.number().int().nonnegative().optional(),
    maxPlayers: z.number().int().positive().optional(),
    setsToWin: z.number().int().min(1).max(4).optional(),
    pointsPerSet: z.number().int().min(3).max(21).optional(),
    sortOrder: z.number().int().optional(),
    seriesDate: isoDateOptional,
    startTime: z.preprocess(
      (v) => v || undefined,
      z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Format attendu : HH:MM")
        .optional(),
    ),
  })
  .transform((d) => {
    if (d.seriesType === "speedy") {
      return { ...d, setsToWin: 1 as const, pointsPerSet: 3 as const };
    }
    if (d.seriesType === "mixed_doubles") {
      return { ...d, seriesFormat: "doubles" as const };
    }
    return d;
  });

export const patchRegistrationInputSchema = z.object({
  licenceNumber: z.string().max(20).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  club: z.string().max(100).optional(),
  ranking: z.number().int().nonnegative().optional(),
  handicapPoints: z.number().int().optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  attendanceStatus: z.enum(["unknown", "present", "absent"]).optional(),
  isForfeit: z.boolean().optional(),
  notes: z.string().max(500).optional(),
  partnerLicenceNumber: z.string().max(20).optional(),
  partnerFirstName: z.string().max(100).optional(),
  partnerLastName: z.string().max(100).optional(),
  partnerClub: z.string().max(100).optional(),
  partnerRanking: z.number().int().nonnegative().optional(),
});

export const upsertRegistrationInputSchema = z.object({
  licenceNumber: z.string().max(20).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  club: z.string().max(100).optional(),
  ranking: z.number().int().nonnegative().optional(),
  playerCategory: z.enum(AGE_CATEGORIES).optional(),
  playerGender: z.enum(["M", "F"]).optional(),
  handicapPoints: z.number().int().default(0),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).default("unpaid"),
  attendanceStatus: z.enum(["unknown", "present", "absent"]).default("unknown"),
  isForfeit: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  // Partenaire (doubles)
  partnerLicenceNumber: z.string().max(20).optional(),
  partnerFirstName: z.string().max(100).optional(),
  partnerLastName: z.string().max(100).optional(),
  partnerClub: z.string().max(100).optional(),
  partnerRanking: z.number().int().nonnegative().optional(),
});

export const enterScoreInputSchema = z.object({
  sets: z
    .array(
      z.object({
        score1: z.number().int().nonnegative(),
        score2: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(7),
});

export const swapPlayersInputSchema = z.object({
  registrationId1: z.number().int().positive(),
  registrationId2: z.number().int().positive(),
});

export const createJaAccessInputSchema = z.object({
  name: z.string().min(2).max(100),
  pin: z.string().regex(/^\d{4,6}$/, "Le code doit contenir 4 à 6 chiffres"),
});

export const jaPinAuthInputSchema = z.object({
  jaAccessId: z.number().int().positive(),
  pin: z.string(),
});

export const forfeitInputSchema = z.object({
  winnerId: z.number().int().positive(),
});
