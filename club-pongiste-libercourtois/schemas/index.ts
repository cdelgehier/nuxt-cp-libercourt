// Zod schemas for data validation
// Using Zod to ensure data integrity and type safety
import { z } from "zod";

// Partner/Sponsor schema
export const PartnerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, "Name is required"),
  logo: z.string().min(1, "Logo is required"),
  website: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(["sponsor", "partenaire", "institutionnel"], {
    errorMap: () => ({
      message: "Category must be sponsor, partenaire, or institutionnel",
    }),
  }),
  since: z.number().int().min(1970).max(new Date().getFullYear()).optional(),
});

// Type inferred from Zod schema (replaces TypeScript interface)
export type Partner = z.infer<typeof PartnerSchema>;

// Activity schema
export const ActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().startsWith("i-", "Icon must be a valid icon name"),
  ageGroup: z.string().min(1, "Age group is required"),
});

export type Activity = z.infer<typeof ActivitySchema>;

// Calendar event schema
export const CalendarEventSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  date: z.string(),
  endDate: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  type: z.enum([
    "tournament",
    "stage",
    "competition",
    "meeting",
    "training",
    "other",
  ]),
  status: z.enum(["upcoming", "ongoing", "past", "cancelled"]),
  maxParticipants: z.number().int().positive().nullable().optional(),
  currentParticipants: z.number().int().min(0).default(0),
  registrationOpen: z.boolean().default(false),
  registrationDeadline: z.string().nullable().optional(),
  price: z
    .union([z.number(), z.string().transform(Number)])
    .nullable()
    .optional(),
  multiDay: z.boolean().optional(),
  contact: z
    .union([
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
      }),
      z.string(),
    ])
    .nullable()
    .optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// News article schema
export const NewsArticleSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  link: z.string().url("Link must be a valid URL"),
  publishedAt: z.coerce.date(),
  author: z.string().optional(),
  categories: z.array(z.string()).default([]),
  image: z.string().url().optional(),
  source: z.enum(["comite", "ligue", "facebook"]),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

// API response schemas
export const SponsorsResponseSchema = z.object({
  sponsors: z.array(PartnerSchema),
});

export const ActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema),
});

export const EventsResponseSchema = z.object({
  events: z.array(CalendarEventSchema),
  totalEvents: z.number().int().min(0).optional(),
  upcomingEvents: z.number().int().min(0).optional(),
  lastUpdated: z.string().datetime().optional(),
});

export const NewsResponseSchema = z.object({
  articles: z.array(NewsArticleSchema),
  total: z.number().int().min(0),
  source: z.string().optional(),
  lastUpdated: z.string().datetime(),
});
