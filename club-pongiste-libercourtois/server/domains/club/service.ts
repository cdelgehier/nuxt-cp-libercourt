/**
 * Service domaine club — logique métier, validation, enrichissement.
 */

import * as repo from "./repository";
import type { InsertFaq, InsertSponsor, InsertTeamMember } from "./types";
import {
  createFaqSchema,
  insertSponsorSchema,
  insertTeamMemberSchema,
  updateFaqSchema,
} from "./types";

// ---------------------------------------------------------------------------
// Config club
// ---------------------------------------------------------------------------

export async function getConfig() {
  const config = await repo.getClubConfig();
  if (!config)
    throw new Error("Configuration du club introuvable. Lancez le seed.");
  return config;
}

export async function updateConfig(input: unknown) {
  const { insertClubConfigSchema } = await import("./types");
  const data = insertClubConfigSchema.partial().parse(input);
  return repo.upsertClubConfig(data as import("./types").InsertClubConfig);
}

// ---------------------------------------------------------------------------
// FAQs — avec enrichissement (stats par catégorie)
// ---------------------------------------------------------------------------

// Correspondance catégorie → id slug + icône
const CATEGORY_META: Record<string, { id: string; icon: string }> = {
  "Inscription & Adhésion": {
    id: "inscription",
    icon: "i-heroicons-user-plus",
  },
  "Tarifs & Licences": { id: "tarifs", icon: "i-heroicons-currency-euro" },
  "Horaires & Planning": { id: "horaires", icon: "i-heroicons-clock" },
  "Pratique & Matériel": { id: "pratique", icon: "i-heroicons-play" },
  "Le Club": { id: "club", icon: "i-heroicons-building-storefront" },
};

export async function getFaqs() {
  const faqs = await repo.getAllFaqs();

  // Grouper par catégorie
  const grouped = new Map<string, typeof faqs>();
  for (const f of faqs) {
    if (!grouped.has(f.category)) grouped.set(f.category, []);
    grouped.get(f.category)!.push(f);
  }

  const categories = Array.from(grouped.entries()).map(([name, questions]) => {
    const meta = CATEGORY_META[name] ?? {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      icon: "i-heroicons-question-mark-circle",
    };
    return {
      id: meta.id,
      name,
      icon: meta.icon,
      questions: questions.map((q) => ({
        id: String(q.id),
        question: q.question,
        answer: q.answer,
        tags: [],
      })),
    };
  });

  const popularIds = faqs.filter((f) => f.isPopular).map((f) => String(f.id));

  return {
    categories,
    popular: popularIds,
    stats: {
      totalQuestions: faqs.length,
      totalCategories: categories.length,
      lastUpdated: new Date().toISOString(),
    },
    // Compatibilité admin (liste plate)
    faqs,
  };
}

export async function createFaq(input: unknown) {
  const data = createFaqSchema.parse(input);
  return repo.insertFaq(data as InsertFaq);
}

export async function updateFaq(id: number, input: unknown) {
  const data = updateFaqSchema.parse(input);
  const updated = await repo.updateFaq(id, data as Partial<InsertFaq>);
  if (!updated)
    throw createError({ statusCode: 404, message: "FAQ introuvable" });
  return updated;
}

export async function deleteFaq(id: number) {
  const existing = await repo.getFaqById(id);
  if (!existing)
    throw createError({ statusCode: 404, message: "FAQ introuvable" });
  await repo.deleteFaq(id);
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

export async function getSchedules() {
  const schedules = await repo.getAllSchedules();

  // Grouper par jour pour l'affichage
  const byDay = schedules.reduce<Record<string, typeof schedules>>((acc, s) => {
    if (!acc[s.day]) acc[s.day] = [];
    acc[s.day]!.push(s);
    return acc;
  }, {});

  return { schedules, byDay };
}

export async function createSchedule(input: unknown) {
  const { insertScheduleSchema } = await import("./types");
  const data = insertScheduleSchema.parse(input);
  return repo.upsertSchedule(null, data as import("./types").InsertSchedule);
}

export async function updateSchedule(id: number, input: unknown) {
  const { insertScheduleSchema } = await import("./types");
  const data = insertScheduleSchema.partial().parse(input);
  return repo.upsertSchedule(id, data as import("./types").InsertSchedule);
}

export async function deleteSchedule(id: number) {
  await repo.deleteSchedule(id);
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export async function getPricing() {
  const all = await repo.getAllPricing();
  return {
    annual: all.filter((p) => !p.isReduction),
    reductions: all.filter((p) => p.isReduction),
  };
}

export async function createPricing(input: unknown) {
  const { insertPricingSchema } = await import("./types");
  const data = insertPricingSchema.parse(input);
  return repo.upsertPricing(null, data as import("./types").InsertPricing);
}

export async function updatePricing(id: number, input: unknown) {
  const { insertPricingSchema } = await import("./types");
  const data = insertPricingSchema.partial().parse(input);
  return repo.upsertPricing(id, data as import("./types").InsertPricing);
}

export async function deletePricing(id: number) {
  await repo.deletePricing(id);
}

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------

export async function getTeamMembers() {
  return repo.getAllTeamMembers();
}

export async function createTeamMember(input: unknown) {
  const data = insertTeamMemberSchema.parse(input);
  return repo.insertTeamMember(data as InsertTeamMember);
}

export async function updateTeamMember(id: number, input: unknown) {
  const data = insertTeamMemberSchema.partial().parse(input);
  const updated = await repo.updateTeamMember(
    id,
    data as Partial<InsertTeamMember>,
  );
  if (!updated)
    throw createError({ statusCode: 404, message: "Membre introuvable" });
  return updated;
}

export async function deleteTeamMember(id: number) {
  const existing = await repo.getTeamMemberById(id);
  if (!existing)
    throw createError({ statusCode: 404, message: "Membre introuvable" });
  await repo.deleteTeamMember(id);
}

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export async function getSponsors() {
  return repo.getAllSponsors();
}

export async function createSponsor(input: unknown) {
  const data = insertSponsorSchema.parse(input);
  return repo.insertSponsor(data as InsertSponsor);
}

export async function updateSponsor(id: number, input: unknown) {
  const data = insertSponsorSchema.partial().parse(input);
  const updated = await repo.updateSponsor(id, data as Partial<InsertSponsor>);
  if (!updated)
    throw createError({ statusCode: 404, message: "Sponsor introuvable" });
  return updated;
}

export async function deleteSponsor(id: number) {
  const existing = await repo.getSponsorById(id);
  if (!existing)
    throw createError({ statusCode: 404, message: "Sponsor introuvable" });
  await repo.deleteSponsor(id);
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function getActivities() {
  return repo.getAllActivities();
}
