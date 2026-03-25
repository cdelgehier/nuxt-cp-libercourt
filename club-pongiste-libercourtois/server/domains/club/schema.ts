import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const clubConfig = pgTable("club_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clubId: text("club_id").notNull(), // ID FFTT : 07620112
  description: text("description"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  facebookUrl: text("facebook_url"),
  // Localisation
  salle: text("salle"),
  complexe: text("complexe"),
  street: text("street"),
  postalCode: text("postal_code"),
  city: text("city"),
  country: text("country").default("France"),
  lat: text("lat"),
  lng: text("lng"),
  googleMapsUrl: text("google_maps_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubAboutSections = pgTable("club_about_sections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // 'history', 'mission', 'values', 'facilities'
  title: text("title"),
  content: jsonb("content"), // flexible : string, string[], object[]
  sortOrder: integer("sort_order").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubTeamMembers = pgTable("club_team_members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // 'president', 'secretary', 'treasurer', etc.
  fullRole: text("full_role"),
  email: text("email"),
  phone: text("phone"),
  bio: text("bio"),
  responsibilities: jsonb("responsibilities"), // string[]
  image: text("image"),
  joinedDate: text("joined_date"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubSchedules = pgTable("club_schedules", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // 'Lundi', 'Mardi', etc.
  dayOrder: integer("day_order").notNull(), // 1-7 pour le tri
  timeStart: text("time_start").notNull(), // '17:30'
  timeEnd: text("time_end").notNull(), // '20:30'
  category: text("category").notNull(), // 'Jeu libre', 'Entraînement', etc.
  level: text("level"), // 'Tous niveaux', 'Débutants', etc.
  type: text("type").notNull().default("libre"), // 'libre', 'entrainement', 'competition'
  coach: text("coach"),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const clubPricing = pgTable("club_pricing", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'Licence Loisir', 'Licence Compétition'
  ageRange: text("age_range"), // 'Adulte', 'Jeune (-18 ans)'
  price: numeric("price").notNull(),
  includes: jsonb("includes"), // string[]
  isReduction: boolean("is_reduction").default(false),
  reductionLabel: text("reduction_label"),
  reductionAmount: numeric("reduction_amount"),
  details: text("details"),
  sortOrder: integer("sort_order").default(0),
});

export const clubFaqs = pgTable("club_faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(), // 'Inscription', 'Tarifs', 'Horaires', 'Pratique', 'Club'
  isPopular: boolean("is_popular").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubSponsors = pgTable("club_sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // chemin vers l'image ou URL
  website: text("website"),
  category: text("category").notNull().default("bronze"), // 'or', 'argent', 'bronze'
  description: text("description"),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clubActivities = pgTable("club_activities", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  ageGroup: text("age_group"), // 'Tout petits', 'Jusqu\'à Cadet 2', etc.
  icon: text("icon"), // nom d'icône Heroicons
  color: text("color"), // classe Tailwind
  features: jsonb("features"), // string[]
  scheduleInfo: text("schedule_info"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
});
