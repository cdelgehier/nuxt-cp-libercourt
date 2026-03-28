/**
 * Deterministic pastel background color derived from a club name.
 * Uses djb2 hash → HSL with fixed saturation/lightness so text stays readable.
 */
export function clubBgColor(club: string | null | undefined): string {
  if (!club) return "";
  let h = 0;
  for (let i = 0; i < club.length; i++) {
    h = club.charCodeAt(i) + ((h << 5) - h);
    h |= 0;
  }
  // Golden angle multiplier (~137°) spreads hues evenly around the color wheel
  // instead of clustering near similar values from raw modulo
  const hue = Math.round((Math.abs(h) * 137) % 360);
  return `hsl(${hue}, 60%, 88%)`;
}
