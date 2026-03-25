import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { eventRegistrations, events } from "./schema";

// ---------------------------------------------------------------------------
// Schémas Zod générés depuis Drizzle (runtime validation)
// ---------------------------------------------------------------------------

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);

export const insertRegistrationSchema = createInsertSchema(eventRegistrations);

export const selectRegistrationSchema = createSelectSchema(eventRegistrations);

// ---------------------------------------------------------------------------
// Types TypeScript via Drizzle InferSelectModel/InferInsertModel
// ---------------------------------------------------------------------------

export type Event = InferSelectModel<typeof events>;
export type InsertEvent = InferInsertModel<typeof events>;
export type EventRegistration = InferSelectModel<typeof eventRegistrations>;
export type InsertRegistration = InferInsertModel<typeof eventRegistrations>;

// ---------------------------------------------------------------------------
// Statuts calculés
// ---------------------------------------------------------------------------

export type EventStatus = "upcoming" | "ongoing" | "past";

export interface EnrichedEvent extends Event {
  status: EventStatus;
  isRegistrationAvailable: boolean;
  formattedPrice: string | null;
  spotsLeft: number | null;
  // CalendarEvent compatibility aliases
  date: string;
  registrationOpen: boolean;
  currentParticipants: number;
  registrationDeadline?: string;
}

// ---------------------------------------------------------------------------
// Schémas de validation API
// ---------------------------------------------------------------------------

export const createEventInputSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug invalide"),
  type: z.enum(["tournament", "training", "social", "other"]),
  startDate: z.string().min(1, "Date requise"),
  endDate: z.string().optional(),
  location: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  maxParticipants: z.number().int().positive().optional(),
  isRegistrationOpen: z.boolean().optional(),
  price: z.number().min(0).optional(),
  contact: z.string().max(200).optional(),
});

export const updateEventInputSchema = createEventInputSchema.partial();

export const registerForEventSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  licenceNumber: z.string().max(20).optional(),
  level: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});
