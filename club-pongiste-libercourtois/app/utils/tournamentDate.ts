/**
 * Formats a tournament date or date range in French.
 *
 * Same month: "samedi 5 et dimanche 6 avril 2026"
 * Different months (same year): "samedi 5 mars et dimanche 6 avril 2026"
 * Different years: two full dates joined with " et "
 * Single date: "samedi 5 avril 2026"
 */
export function formatDateRange(start: string, end?: string | null): string {
  const parseLocal = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y!, m! - 1, d!);
  };

  const fullFmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const startDate = parseLocal(start);

  if (!end) return fullFmt.format(startDate);

  const endDate = parseLocal(end);

  if (start === end) return fullFmt.format(startDate);

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  if (sameMonth) {
    const weekdayDay = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
    });
    const monthYear = new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return `${weekdayDay.format(startDate)} et ${weekdayDay.format(endDate)} ${monthYear.format(endDate)}`;
  }

  if (sameYear) {
    const weekdayDayMonth = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const fullEnd = fullFmt.format(endDate);
    return `${weekdayDayMonth.format(startDate)} et ${fullEnd}`;
  }

  return `${fullFmt.format(startDate)} et ${fullFmt.format(endDate)}`;
}
