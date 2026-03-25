/**
 * Seed script : importe les données JSON existantes vers Neon PostgreSQL.
 * Idempotent — peut être relancé sans doublon (upsert via onConflictDoUpdate).
 *
 * Usage : pnpm db:seed
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  clubAboutSections,
  clubActivities,
  clubConfig,
  clubFaqs,
  clubPricing,
  clubSchedules,
  clubSponsors,
  clubTeamMembers,
} from "../domains/club/schema";

// Charger .env automatiquement
config({ path: resolve(process.cwd(), ".env") });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson<T>(relativePath: string): T {
  const abs = resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(abs, "utf-8")) as T;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL manquante");
  const sql = neon(databaseUrl);
  const db = drizzle(sql, {
    schema: {
      clubConfig,
      clubFaqs,
      clubSchedules,
      clubPricing,
      clubTeamMembers,
      clubSponsors,
      clubActivities,
    },
  });

  // Truncate before seeding to ensure idempotency (serial PKs never conflict)
  // events and event_registrations are excluded — managed via admin UI, not fixtures
  await sql`TRUNCATE club_about_sections, club_pricing, club_schedules, club_faqs, club_team_members, club_config, club_sponsors, club_activities RESTART IDENTITY CASCADE`;

  console.log("🌱 Début du seed...");

  // -------------------------------------------------------------------------
  // 1. club_config
  // -------------------------------------------------------------------------
  console.log("→ club_config");
  const config = readJson<Record<string, unknown>>(
    "server/db/fixtures/config.json",
  ) as {
    club: {
      name: string;
      id: string;
      email: string;
      phone: string;
      website: string;
      description: string;
      salle: string;
      complexe: string;
    };
    social: { facebook?: { url: string } };
    location: {
      name: string;
      salle: string;
      complexe: string;
      street: string;
      postalCode: string;
      city: string;
      country: string;
      coordinates: { lat: number; lng: number };
      googleMapsUrl?: string;
    };
  };

  await db
    .insert(clubConfig)
    .values({
      name: config.club.name,
      clubId: config.club.id,
      description: config.club.description,
      email: config.club.email,
      phone: config.club.phone,
      website: config.club.website,
      facebookUrl: config.social.facebook?.url ?? null,
      salle: config.club.salle ?? config.location.salle,
      complexe: config.club.complexe ?? config.location.complexe,
      street: config.location.street,
      postalCode: config.location.postalCode,
      city: config.location.city,
      country: config.location.country ?? "France",
      lat: String(config.location.coordinates.lat),
      lng: String(config.location.coordinates.lng),
      googleMapsUrl: config.location.googleMapsUrl ?? null,
    })
    .onConflictDoNothing();

  // -------------------------------------------------------------------------
  // 2. club_faqs
  // -------------------------------------------------------------------------
  console.log("→ club_faqs");
  const faqData = readJson<{
    categories: Array<{
      id: string;
      name: string;
      questions: Array<{
        id?: string;
        question: string;
        answer: string;
        isPopular?: boolean;
      }>;
    }>;
    popular?: string[];
  }>("server/db/fixtures/faq.json");

  const popularIds = new Set(faqData.popular ?? []);

  let faqOrder = 0;
  for (const cat of faqData.categories) {
    for (const q of cat.questions) {
      const isPopular =
        q.isPopular === true || (q.id != null && popularIds.has(q.id));
      await db
        .insert(clubFaqs)
        .values({
          question: q.question,
          answer: q.answer,
          category: cat.name,
          isPopular,
          sortOrder: faqOrder++,
        })
        .onConflictDoNothing();
    }
  }

  // -------------------------------------------------------------------------
  // 3. club_schedules
  // -------------------------------------------------------------------------
  console.log("→ club_schedules");
  const schedulesData = readJson<{
    schedules: {
      training: Array<{
        day: string;
        sessions: Array<{
          time: string;
          category: string;
          level: string;
          type: string;
          coach: string;
        }>;
      }>;
    };
  }>("server/db/fixtures/schedules.json");

  const dayOrder: Record<string, number> = {
    Lundi: 1,
    Mardi: 2,
    Mercredi: 3,
    Jeudi: 4,
    Vendredi: 5,
    Samedi: 6,
    Dimanche: 7,
  };

  let scheduleOrder = 0;
  for (const dayEntry of schedulesData.schedules.training) {
    for (const session of dayEntry.sessions) {
      const [start, end] = session.time
        .split(" - ")
        .map((t) => t.trim().replace("h", ":").padEnd(5, "0"));
      await db
        .insert(clubSchedules)
        .values({
          day: dayEntry.day,
          dayOrder: dayOrder[dayEntry.day] ?? 9,
          timeStart: start,
          timeEnd: end,
          category: session.category,
          level: session.level,
          type: session.type,
          coach: session.coach,
          sortOrder: scheduleOrder++,
        })
        .onConflictDoNothing();
    }
  }

  // -------------------------------------------------------------------------
  // 4. club_pricing
  // -------------------------------------------------------------------------
  console.log("→ club_pricing");
  const pricingData = readJson<{
    pricing: {
      annual: Array<{
        category: string;
        ageRange: string;
        price: number;
        includes: string[];
        details?: unknown;
      }>;
      reductions: Array<{
        name: string;
        type?: string;
        label?: string;
        amount: number;
        description?: string;
        condition?: string;
      }>;
      additional?: Array<{
        name: string;
        type?: string;
        label?: string;
        amount: number;
        description?: string;
        condition?: string;
      }>;
    };
  }>("server/db/fixtures/pricing.json");

  let pricingOrder = 0;
  for (const item of pricingData.pricing.annual) {
    await db
      .insert(clubPricing)
      .values({
        category: item.category,
        ageRange: item.ageRange,
        price: String(item.price),
        includes: item.includes,
        isReduction: false,
        sortOrder: pricingOrder++,
      })
      .onConflictDoNothing();
  }

  for (const red of pricingData.pricing.reductions ?? []) {
    const label = red.name || red.label || red.type || "Réduction";
    await db
      .insert(clubPricing)
      .values({
        category: label,
        price: "0",
        isReduction: true,
        reductionLabel: label,
        reductionAmount: String(red.amount),
        details: red.description ?? null,
        sortOrder: pricingOrder++,
      })
      .onConflictDoNothing();
  }

  // -------------------------------------------------------------------------
  // 5. club_team_members
  // -------------------------------------------------------------------------
  console.log("→ club_team_members");
  const teamData = readJson<{
    team: Array<{
      firstName: string;
      lastName: string;
      role: string;
      fullRole: string;
      email: string;
      phone: string;
      bio: string;
      responsibilities: string[];
      image?: string;
      joinedDate?: string;
    }>;
  }>("server/db/fixtures/team.json");

  let memberOrder = 0;
  for (const member of teamData.team) {
    await db
      .insert(clubTeamMembers)
      .values({
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        fullRole: member.fullRole,
        email: member.email || null,
        phone: member.phone || null,
        bio: member.bio || null,
        responsibilities: member.responsibilities,
        image: member.image ?? null,
        joinedDate: member.joinedDate ?? null,
        sortOrder: memberOrder++,
        active: true,
      })
      .onConflictDoNothing();
  }

  // events are intentionally excluded from seed — managed via admin UI
  // To bootstrap events on a fresh DB, use the admin panel or restore a dump

  // -------------------------------------------------------------------------
  // 6. club_about_sections
  // -------------------------------------------------------------------------
  console.log("→ club_about_sections");
  const aboutData = readJson<Record<string, unknown>>(
    "server/db/fixtures/about.json",
  );
  await db
    .insert(clubAboutSections)
    .values({ slug: "about", content: aboutData, sortOrder: 0 })
    .onConflictDoNothing();

  // -------------------------------------------------------------------------
  // 8. club_sponsors
  // -------------------------------------------------------------------------
  console.log("→ club_sponsors");
  const sponsorsData = readJson<{
    sponsors: Array<{
      name: string;
      logo: string;
      website?: string;
      description?: string;
      category: string;
    }>;
  }>("server/db/fixtures/sponsors.json");

  let sponsorOrder = 0;
  for (const s of sponsorsData.sponsors) {
    await db
      .insert(clubSponsors)
      .values({
        name: s.name,
        logo: s.logo ?? null,
        website: s.website ?? null,
        description: s.description ?? null,
        category: s.category,
        sortOrder: sponsorOrder++,
        active: true,
      })
      .onConflictDoNothing();
  }

  // -------------------------------------------------------------------------
  // 9. club_activities
  // -------------------------------------------------------------------------
  console.log("→ club_activities");
  const activitiesData = readJson<{
    activities: Array<{
      title: string;
      description: string;
      icon: string;
      ageGroup: string;
    }>;
  }>("server/db/fixtures/activities.json");

  let activityOrder = 0;
  for (const a of activitiesData.activities) {
    const slug = a.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    await db
      .insert(clubActivities)
      .values({
        slug,
        title: a.title,
        description: a.description,
        ageGroup: a.ageGroup,
        icon: a.icon,
        sortOrder: activityOrder++,
        active: true,
      })
      .onConflictDoNothing();
  }

  console.log("✅ Seed terminé avec succès !");
}

seed().catch((err) => {
  console.error("❌ Erreur lors du seed :", err);
  process.exit(1);
});
