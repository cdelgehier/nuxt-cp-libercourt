import type { SeriesRegistration, TournamentSeries } from './types'
import type {
  RegistrationOverview,
  RegistrationOverviewPlayer
} from '../../../shared/tournament-registrations'
import { registrationIdentity } from './registration-entrant'

type Series = Pick<
  TournamentSeries,
  'id' | 'name' | 'seriesFormat' | 'seriesDate' | 'startTime'
>
const names = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })

/** Group the existing player identities without merging licensed namesakes. */
export function buildRegistrationOverview(
  series: Series[],
  registrations: SeriesRegistration[]
): RegistrationOverview {
  const columns = new Map(
    series.map(function (entry) {
      return [
        entry.id,
        {
          id: entry.id,
          name: entry.name,
          format: entry.seriesFormat,
          date: entry.seriesDate,
          startTime: entry.startTime,
          registrationCount: 0
        }
      ]
    })
  )
  const players = new Map<string, RegistrationOverviewPlayer>()
  for (const registration of registrations) {
    const column = columns.get(registration.seriesId)
    if (!column) continue
    column.registrationCount++
    const doubles =
      column.format === 'doubles' && Boolean(registration.partnerLastName)
    for (const partner of doubles ? [false, true] : [false]) {
      const identity = registrationIdentity(registration, partner)
      const firstName = partner
        ? (registration.partnerFirstName ?? '')
        : registration.firstName
      const lastName = partner
        ? (registration.partnerLastName ?? '')
        : registration.lastName
      const club = partner ? registration.partnerClub : registration.club
      const licenceNumber = partner
        ? registration.partnerLicenceNumber
        : registration.licenceNumber
      let player = players.get(identity)
      if (!player) {
        player = {
          identity,
          firstName,
          lastName,
          club,
          licenceNumber,
          registrations: {}
        }
        players.set(identity, player)
      }
      player.club ||= club
      player.licenceNumber ||= licenceNumber
      const entries = (player.registrations[column.id] ??= [])
      if (
        entries.some(function (entry) {
          return entry.registrationId === registration.id
        })
      )
        continue
      entries.push({
        registrationId: registration.id,
        attendanceStatus: registration.attendanceStatus,
        paymentStatus: registration.paymentStatus,
        isForfeit: registration.isForfeit,
        partnerName: doubles
          ? partner
            ? `${registration.firstName} ${registration.lastName}`
            : `${registration.partnerFirstName ?? ''} ${registration.partnerLastName}`.trim()
          : null
      })
    }
  }
  return {
    series: [...columns.values()],
    players: [...players.values()].sort(function (a, b) {
      return (
        names.compare(a.lastName, b.lastName) ||
        names.compare(a.firstName, b.firstName) ||
        names.compare(a.identity, b.identity)
      )
    })
  }
}
