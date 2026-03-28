/**
 * Returns the display name for a bracket registration.
 * For doubles: "LAST / PARTNER_LAST"
 * For singles: "First LAST"
 * Never includes club name — use clubBgColor() for club identity.
 */
export function playerDisplayName(
  reg: {
    firstName: string;
    lastName: string;
    partnerLastName?: string | null;
  } | null,
): string {
  if (!reg) return "";
  if (reg.partnerLastName) return `${reg.lastName} / ${reg.partnerLastName}`;
  return `${reg.firstName} ${reg.lastName}`;
}
