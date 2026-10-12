import type { SeriesRegistration } from './types'
import type { Entrant } from './integral'

/** Use the same identity in singles, doubles and forecasts. */
export function registrationIdentity(
  registration: SeriesRegistration,
  partner = false
): string {
  const override = partner
    ? registration.partnerIdentity
    : registration.playerIdentity
  if (override) return override
  const licence = partner
    ? registration.partnerLicenceNumber
    : registration.licenceNumber
  if (licence?.trim()) return `licence:${licence.trim()}`
  const first = partner
      ? registration.partnerFirstName
      : registration.firstName,
    last = partner ? registration.partnerLastName : registration.lastName
  const club = partner ? registration.partnerClub : registration.club
  return `name:${[first, last, club]
    .join(':')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()}`
}
/** Convert one registration row to one player or pair. */
export function registrationEntrant(registration: SeriesRegistration): Entrant {
  const doubles = Boolean(registration.partnerLastName)
  const ranking = doubles
    ? registration.ranking === null || registration.partnerRanking === null
      ? null
      : registration.ranking + registration.partnerRanking
    : registration.ranking
  return {
    id: registration.id,
    ranking,
    club: registration.club,
    partnerClub: registration.partnerClub,
    identities: doubles
      ? [
          registrationIdentity(registration),
          registrationIdentity(registration, true)
        ]
      : [registrationIdentity(registration)],
    withdrawn: registration.isForfeit,
    seed: 0
  }
}
