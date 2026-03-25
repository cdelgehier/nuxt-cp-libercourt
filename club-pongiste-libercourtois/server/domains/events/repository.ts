import { asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db/client";
import { eventRegistrations, events } from "./schema";
import type { InsertEvent, InsertRegistration } from "./types";

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function getAllEvents() {
  return db.select().from(events).orderBy(asc(events.startDate));
}

export async function getUpcomingEvents(limit?: number) {
  const now = new Date();
  const query = db
    .select()
    .from(events)
    .where(gte(events.startDate, now))
    .orderBy(asc(events.startDate));
  if (limit) return query.limit(limit);
  return query;
}

export async function getPastEvents(limit?: number) {
  const now = new Date();
  const query = db
    .select()
    .from(events)
    .where(lte(events.startDate, now))
    .orderBy(desc(events.startDate));
  if (limit) return query.limit(limit);
  return query;
}

export async function getEventBySlug(slug: string) {
  const rows = await db.select().from(events).where(eq(events.slug, slug));
  return rows[0] ?? null;
}

export async function getEventById(id: number) {
  const rows = await db.select().from(events).where(eq(events.id, id));
  return rows[0] ?? null;
}

export async function insertEvent(data: InsertEvent) {
  const [created] = await db.insert(events).values(data).returning();
  return created;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const [updated] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteEvent(id: number) {
  await db.delete(events).where(eq(events.id, id));
}

export async function toggleRegistration(id: number, isOpen: boolean) {
  const [updated] = await db
    .update(events)
    .set({ isRegistrationOpen: isOpen, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return updated ?? null;
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export async function getEventRegistrations(eventId: number) {
  return db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId))
    .orderBy(asc(eventRegistrations.registeredAt));
}

export async function countEventRegistrations(
  eventId: number,
): Promise<number> {
  const rows = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));
  return rows.length;
}

export async function insertRegistration(data: InsertRegistration) {
  const [created] = await db
    .insert(eventRegistrations)
    .values(data)
    .returning();
  return created;
}
