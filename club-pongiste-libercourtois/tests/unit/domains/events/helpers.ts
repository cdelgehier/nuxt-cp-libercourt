/**
 * Fonctions pures extraites du service events — testables sans contexte Nitro.
 */

export type EventStatus = "upcoming" | "ongoing" | "past";

export function computeStatus(event: {
  startDate: Date;
  endDate: Date | null;
}): EventStatus {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  if (end && now >= start && now <= end) return "ongoing";
  if (start > now) return "upcoming";
  return "past";
}

export function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  if (price === 0) return "Gratuit";
  return `${(price / 100).toFixed(2).replace(".", ",")} €`;
}
