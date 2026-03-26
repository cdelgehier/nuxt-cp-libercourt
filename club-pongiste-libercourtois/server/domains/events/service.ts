/**
 * Service domaine events — enrichissement (statut, places restantes, prix formaté).
 */

import * as repo from "./repository";
import { enrichEvent } from "./helpers";
import type { InsertEvent } from "./types";
import {
  createEventInputSchema,
  registerForEventSchema,
  updateEventInputSchema,
} from "./types";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export async function getAllEvents() {
  const evts = await repo.getAllEvents();
  const enriched = await Promise.all(
    evts.map(async (e) => {
      const count = await repo.countEventRegistrations(e.id);
      return enrichEvent(e, count);
    }),
  );
  return {
    events: enriched,
    stats: {
      total: enriched.length,
      upcoming: enriched.filter((e) => e.status === "upcoming").length,
      past: enriched.filter((e) => e.status === "past").length,
      openForRegistration: enriched.filter((e) => e.isRegistrationAvailable)
        .length,
    },
  };
}

export async function getUpcomingEvents(limit?: number) {
  const evts = await repo.getUpcomingEvents(limit);
  return Promise.all(
    evts.map(async (e) => {
      const count = await repo.countEventRegistrations(e.id);
      return enrichEvent(e, count);
    }),
  );
}

export async function getEventBySlug(slug: string) {
  const event = await repo.getEventBySlug(slug);
  if (!event) return null;
  const count = await repo.countEventRegistrations(event.id);
  return enrichEvent(event, count);
}

export async function createEvent(input: unknown) {
  const data = createEventInputSchema.parse(input);
  const eventData: InsertEvent = {
    ...data,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    price: data.price != null ? String(data.price) : undefined,
  };
  return repo.insertEvent(eventData);
}

export async function updateEvent(id: number, input: unknown) {
  const data = updateEventInputSchema.parse(input);
  const updateData = {
    ...data,
    ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
    ...(data.endDate && data.endDate !== ""
      ? { endDate: new Date(data.endDate) }
      : { endDate: null }),
  } as Partial<InsertEvent>;
  const updated = await repo.updateEvent(id, updateData);
  if (!updated)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  return updated;
}

export async function deleteEvent(id: number) {
  const existing = await repo.getEventById(id);
  if (!existing)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  await repo.deleteEvent(id);
}

export async function toggleRegistration(id: number, isOpen: boolean) {
  const updated = await repo.toggleRegistration(id, isOpen);
  if (!updated)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  return updated;
}

export async function registerForEvent(eventId: number, input: unknown) {
  const event = await repo.getEventById(eventId);
  if (!event)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  if (!event.isRegistrationOpen)
    throw createError({
      statusCode: 400,
      message: "Les inscriptions sont fermées",
    });

  if (event.maxParticipants != null) {
    const count = await repo.countEventRegistrations(eventId);
    if (count >= event.maxParticipants)
      throw createError({ statusCode: 400, message: "Événement complet" });
  }

  const data = registerForEventSchema.parse(input);
  return repo.insertRegistration({ ...data, eventId });
}

export async function getEventRegistrations(eventId: number) {
  const event = await repo.getEventById(eventId);
  if (!event)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  const registrations = await repo.getEventRegistrations(eventId);
  return { event, registrations, count: registrations.length };
}
