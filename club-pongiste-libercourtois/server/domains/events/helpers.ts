/**
 * Pure helper functions for the events domain — no DB or Nitro dependencies.
 * Extracted here to be unit-testable.
 */

import type { EnrichedEvent, Event } from "./types";

export type EventStatus = "upcoming" | "ongoing" | "past";

export function computeStatus(event: {
  startDate: Date | string;
  endDate: Date | string | null;
}): EventStatus {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  if (end && now >= start && now <= end) return "ongoing";
  if (start > now) return "upcoming";
  return "past";
}

export function formatPrice(price: string | null): string | null {
  if (price === null) return null;
  const n = Number(price);
  if (n === 0) return "Gratuit";
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function enrichEvent(
  event: Event,
  registrationCount: number,
): EnrichedEvent {
  const status = computeStatus(event);
  const spotsLeft =
    event.maxParticipants != null
      ? Math.max(0, event.maxParticipants - registrationCount)
      : null;

  return {
    ...event,
    status,
    isRegistrationAvailable:
      event.isRegistrationOpen === true &&
      status !== "past" &&
      (spotsLeft === null || spotsLeft > 0),
    formattedPrice: formatPrice(event.price ?? null),
    spotsLeft,
    date:
      event.startDate instanceof Date
        ? event.startDate.toISOString()
        : String(event.startDate),
    registrationOpen: event.isRegistrationOpen ?? false,
    currentParticipants: registrationCount,
    registrationDeadline:
      event.endDate instanceof Date
        ? event.endDate.toISOString()
        : (event.endDate ?? undefined),
  };
}
