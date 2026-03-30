import { z } from "zod";

export interface LicenseeModalData {
  licence: string;
  firstName: string;
  lastName: string;
  sexe: string;
  cat: string;
  clast: string;
  points?: number;
  pointm?: string;
}

/** Fields consumed from /api/club/licensee/[licence] in the bracket context */
export const licenseeDetailsSchema = z.object({
  sexe: z.string().optional(),
  cat: z.string().optional(),
  clast: z.string().optional(),
  points: z.number().optional(),
  pointm: z.string().optional(),
});

export type LicenseeDetails = z.infer<typeof licenseeDetailsSchema>;

/**
 * Builds LicenseeModalData from a bracket registration (DB),
 * enriched with fresh Smartping details when available.
 * Smartping fields take precedence over DB fields.
 */
export function buildLicenseeFromRegistration(
  reg: {
    licenceNumber: string | null;
    firstName: string;
    lastName: string;
    playerGender?: string | null;
    playerCategory?: string | null;
    ranking?: number | null;
  },
  fetched?: LicenseeDetails | null,
): LicenseeModalData {
  const base: LicenseeModalData = {
    licence: reg.licenceNumber ?? "",
    firstName: reg.firstName,
    lastName: reg.lastName,
    sexe: reg.playerGender ?? "M",
    cat: reg.playerCategory ?? "",
    clast: reg.ranking ? String(reg.ranking) : "NC",
    points: reg.ranking ?? undefined,
  };

  if (!fetched) return base;

  return {
    ...base,
    sexe: fetched.sexe ?? base.sexe,
    cat: fetched.cat ?? base.cat,
    clast: fetched.clast ?? base.clast,
    points: fetched.points ?? base.points,
    pointm: fetched.pointm,
  };
}

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
