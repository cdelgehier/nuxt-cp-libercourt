/**
 * Service domaine events — enrichissement (statut, places restantes, prix formaté).
 */

import * as repo from "./repository";
import { enrichEvent } from "./helpers";
import type { InsertEvent } from "./types";
import {
  createEventInputSchema,
  patchRegistrationPaymentSchema,
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

  const data = registerForEventSchema.parse(input);

  const duplicate = await repo.findRegistrationByName(
    eventId,
    data.firstName,
    data.lastName,
  );
  if (duplicate)
    throw createError({
      statusCode: 409,
      message: "Cette personne est déjà inscrite à cet événement",
    });

  if (event.maxParticipants != null) {
    const count = await repo.countEventRegistrations(eventId);
    const totalIncoming = 1 + (data.companions ?? 0);
    if (count + totalIncoming > event.maxParticipants)
      throw createError({ statusCode: 400, message: "Événement complet" });
  }

  return repo.insertRegistration({ ...data, eventId });
}

export async function deleteRegistration(id: number) {
  const existing = await repo.getRegistrationById(id);
  if (!existing)
    throw createError({ statusCode: 404, message: "Inscription introuvable" });
  await repo.deleteRegistration(id);
}

export async function patchRegistrationPayment(id: number, input: unknown) {
  const { isPaid } = patchRegistrationPaymentSchema.parse(input);
  const updated = await repo.patchRegistrationPayment(id, isPaid);
  if (!updated)
    throw createError({ statusCode: 404, message: "Inscription introuvable" });
  return updated;
}

export async function getAdminEventRegistrations(
  eventId: number,
  paid?: boolean,
) {
  const event = await repo.getEventById(eventId);
  if (!event)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  const registrations = await repo.getEventRegistrationsByPaid(eventId, paid);
  return { event, registrations, count: registrations.length };
}

export async function getEventRegistrations(eventId: number) {
  const event = await repo.getEventById(eventId);
  if (!event)
    throw createError({ statusCode: 404, message: "Événement introuvable" });
  const registrations = await repo.getEventRegistrations(eventId);
  return { event, registrations, count: registrations.length };
}
