import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import {
  clubConfig,
  clubPricing,
  clubSchedules
} from '../server/domains/club/schema'
import config from '../server/db/fixtures/config.json'
import schedules from '../server/db/fixtures/schedules.json'
import pricing from '../server/db/fixtures/pricing.json'

/** Seed the public layout data in a disposable local database. */
export async function seedLocalClub<
  T extends PgQueryResultHKT,
  S extends Record<string, unknown>
>(db: PgDatabase<T, S>) {
  const existing = await db
    .select({ id: clubConfig.id })
    .from(clubConfig)
    .limit(1)
  if (existing.length) return
  await db.insert(clubConfig).values({
    name: config.club.name,
    clubId: config.club.id,
    description: config.club.description,
    email: config.club.email,
    phone: config.club.phone,
    website: config.club.website,
    facebookUrl: config.social.facebook.url,
    salle: config.location.salle,
    complexe: config.location.complexe,
    street: config.location.street,
    postalCode: config.location.postalCode,
    city: config.location.city,
    country: config.location.country,
    lat: String(config.location.coordinates.lat),
    lng: String(config.location.coordinates.lng),
    googleMapsUrl: config.location.googleMapsUrl
  })
  await db.insert(clubSchedules).values(
    schedules.schedules.training.flatMap(function (day, index) {
      return day.sessions.map(function (session, order) {
        const [timeStart, timeEnd] = session.time.split(' - ')
        return {
          day: day.day,
          dayOrder: index + 1,
          timeStart: timeStart!,
          timeEnd: timeEnd!,
          category: session.category,
          level: session.level,
          type: session.type,
          coach: session.coach,
          sortOrder: order
        }
      })
    })
  )
  await db.insert(clubPricing).values(
    pricing.pricing.annual.map(function (rate, index) {
      return {
        category: rate.category,
        ageRange: rate.ageRange,
        price: String(rate.price),
        includes: rate.includes,
        sortOrder: index
      }
    })
  )
}
