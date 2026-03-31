import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("other"), // 'tournament' | 'training' | 'social' | 'other'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  description: text("description"),
  maxParticipants: integer("max_participants"),
  isRegistrationOpen: boolean("is_registration_open").default(false),
  price: numeric("price"), // en euros, null = gratuit
  contact: text("contact"), // email ou nom
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  licenceNumber: text("licence_number"),
  level: text("level"), // 'loisir', 'competition', etc.
  notes: text("notes"), // private — admin only
  companions: integer("companions").notNull().default(0),
  isPaid: boolean("is_paid").notNull().default(false),
  registeredAt: timestamp("registered_at").defaultNow(),
});
