import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  clubActivities,
  clubConfig,
  clubFaqs,
  clubPricing,
  clubSchedules,
  clubSponsors,
  clubTeamMembers,
} from "./schema";

// ---------------------------------------------------------------------------
// Schémas Zod générés depuis les tables Drizzle (runtime validation)
// ---------------------------------------------------------------------------

export const insertClubConfigSchema = createInsertSchema(clubConfig);
export const selectClubConfigSchema = createSelectSchema(clubConfig);

export const insertFaqSchema = createInsertSchema(clubFaqs);
export const selectFaqSchema = createSelectSchema(clubFaqs);

export const insertScheduleSchema = createInsertSchema(clubSchedules);
export const selectScheduleSchema = createSelectSchema(clubSchedules);

export const insertPricingSchema = createInsertSchema(clubPricing);
export const selectPricingSchema = createSelectSchema(clubPricing);

export const insertTeamMemberSchema = createInsertSchema(clubTeamMembers);
export const selectTeamMemberSchema = createSelectSchema(clubTeamMembers);

export const insertSponsorSchema = createInsertSchema(clubSponsors);
export const selectSponsorSchema = createSelectSchema(clubSponsors);

export const insertActivitySchema = createInsertSchema(clubActivities);
export const selectActivitySchema = createSelectSchema(clubActivities);

// ---------------------------------------------------------------------------
// Types TypeScript via Drizzle InferSelectModel/InferInsertModel
// (évite la contrainte z.infer<BuildSchema> non satisfaite en drizzle-zod 0.8)
// ---------------------------------------------------------------------------

export type ClubConfig = InferSelectModel<typeof clubConfig>;
export type InsertClubConfig = InferInsertModel<typeof clubConfig>;

export type Faq = InferSelectModel<typeof clubFaqs>;
export type InsertFaq = InferInsertModel<typeof clubFaqs>;

export type Schedule = InferSelectModel<typeof clubSchedules>;
export type InsertSchedule = InferInsertModel<typeof clubSchedules>;

export type Pricing = InferSelectModel<typeof clubPricing>;
export type InsertPricing = InferInsertModel<typeof clubPricing>;

export type TeamMember = InferSelectModel<typeof clubTeamMembers>;
export type InsertTeamMember = InferInsertModel<typeof clubTeamMembers>;

export type Sponsor = InferSelectModel<typeof clubSponsors>;
export type InsertSponsor = InferInsertModel<typeof clubSponsors>;

export type Activity = InferSelectModel<typeof clubActivities>;
export type InsertActivity = InferInsertModel<typeof clubActivities>;

// ---------------------------------------------------------------------------
// Schémas de validation API (input utilisateur)
// ---------------------------------------------------------------------------

export const createFaqSchema = z.object({
  question: z.string().min(5, "Question trop courte").max(500),
  answer: z.string().min(10, "Réponse trop courte").max(5000),
  category: z.string().min(1, "Catégorie requise"),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateFaqSchema = createFaqSchema.partial();

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug invalide (lettres minuscules, chiffres, tirets)",
    ),
  type: z.enum(["tournament", "training", "social", "other"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  maxParticipants: z.number().int().positive().optional(),
  isRegistrationOpen: z.boolean().optional(),
  price: z.number().int().min(0).optional(), // en centimes
  contact: z.string().max(200).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const createRegistrationSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  licenceNumber: z.string().max(20).optional(),
  level: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
