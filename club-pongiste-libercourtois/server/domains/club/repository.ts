/**
 * Repository domaine club — toutes les queries DB passent par ici.
 */

import { asc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import {
  clubAboutSections,
  clubActivities,
  clubConfig,
  clubFaqs,
  clubPricing,
  clubSchedules,
  clubSponsors,
  clubTeamMembers,
} from "./schema";
import type {
  InsertClubConfig,
  InsertFaq,
  InsertPricing,
  InsertSchedule,
  InsertSponsor,
  InsertTeamMember,
} from "./types";

// ---------------------------------------------------------------------------
// Club Config
// ---------------------------------------------------------------------------

export async function getClubConfig() {
  const rows = await db.select().from(clubConfig).limit(1);
  return rows[0] ?? null;
}

export async function upsertClubConfig(data: InsertClubConfig) {
  const existing = await getClubConfig();
  if (existing) {
    const [updated] = await db
      .update(clubConfig)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clubConfig.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(clubConfig).values(data).returning();
  return created;
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export async function getAllFaqs() {
  return db
    .select()
    .from(clubFaqs)
    .orderBy(asc(clubFaqs.sortOrder), asc(clubFaqs.id));
}

export async function getFaqById(id: number) {
  const rows = await db.select().from(clubFaqs).where(eq(clubFaqs.id, id));
  return rows[0] ?? null;
}

export async function insertFaq(data: InsertFaq) {
  const [created] = await db.insert(clubFaqs).values(data).returning();
  return created;
}

export async function updateFaq(id: number, data: Partial<InsertFaq>) {
  const [updated] = await db
    .update(clubFaqs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clubFaqs.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteFaq(id: number) {
  await db.delete(clubFaqs).where(eq(clubFaqs.id, id));
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

export async function getAllSchedules() {
  return db
    .select()
    .from(clubSchedules)
    .where(eq(clubSchedules.active, true))
    .orderBy(asc(clubSchedules.dayOrder), asc(clubSchedules.sortOrder));
}

export async function upsertSchedule(id: number | null, data: InsertSchedule) {
  if (id) {
    const [updated] = await db
      .update(clubSchedules)
      .set(data)
      .where(eq(clubSchedules.id, id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(clubSchedules).values(data).returning();
  return created;
}

export async function deleteSchedule(id: number) {
  await db.delete(clubSchedules).where(eq(clubSchedules.id, id));
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export async function getAllPricing() {
  return db.select().from(clubPricing).orderBy(asc(clubPricing.sortOrder));
}

export async function upsertPricing(id: number | null, data: InsertPricing) {
  if (id) {
    const [updated] = await db
      .update(clubPricing)
      .set(data)
      .where(eq(clubPricing.id, id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(clubPricing).values(data).returning();
  return created;
}

export async function deletePricing(id: number) {
  await db.delete(clubPricing).where(eq(clubPricing.id, id));
}

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------

export async function getAllTeamMembers() {
  return db
    .select()
    .from(clubTeamMembers)
    .where(eq(clubTeamMembers.active, true))
    .orderBy(asc(clubTeamMembers.sortOrder));
}

export async function getTeamMemberById(id: number) {
  const rows = await db
    .select()
    .from(clubTeamMembers)
    .where(eq(clubTeamMembers.id, id));
  return rows[0] ?? null;
}

export async function insertTeamMember(data: InsertTeamMember) {
  const [created] = await db.insert(clubTeamMembers).values(data).returning();
  return created;
}

export async function updateTeamMember(
  id: number,
  data: Partial<InsertTeamMember>,
) {
  const [updated] = await db
    .update(clubTeamMembers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clubTeamMembers.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteTeamMember(id: number) {
  await db
    .update(clubTeamMembers)
    .set({ active: false })
    .where(eq(clubTeamMembers.id, id));
}

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export async function getAllSponsors() {
  return db
    .select()
    .from(clubSponsors)
    .where(eq(clubSponsors.active, true))
    .orderBy(asc(clubSponsors.sortOrder));
}

export async function getSponsorById(id: number) {
  const rows = await db
    .select()
    .from(clubSponsors)
    .where(eq(clubSponsors.id, id));
  return rows[0] ?? null;
}

export async function insertSponsor(data: InsertSponsor) {
  const [created] = await db.insert(clubSponsors).values(data).returning();
  return created;
}

export async function updateSponsor(id: number, data: Partial<InsertSponsor>) {
  const [updated] = await db
    .update(clubSponsors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clubSponsors.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteSponsor(id: number) {
  await db
    .update(clubSponsors)
    .set({ active: false })
    .where(eq(clubSponsors.id, id));
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function getAllActivities() {
  return db
    .select()
    .from(clubActivities)
    .where(eq(clubActivities.active, true))
    .orderBy(asc(clubActivities.sortOrder));
}

// ---------------------------------------------------------------------------
// About Sections
// ---------------------------------------------------------------------------

export async function getAboutSection(slug: string) {
  const rows = await db
    .select()
    .from(clubAboutSections)
    .where(eq(clubAboutSections.slug, slug));
  return rows[0] ?? null;
}

export async function upsertAboutSection(slug: string, content: unknown) {
  const existing = await getAboutSection(slug);
  if (existing) {
    const [updated] = await db
      .update(clubAboutSections)
      .set({ content, updatedAt: new Date() })
      .where(eq(clubAboutSections.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(clubAboutSections)
    .values({ slug, content })
    .returning();
  return created;
}
