import { describe, expect, it } from 'vitest'
import type { SeriesRegistration } from '../../../server/domains/tournament/types'
import { buildRegistrationOverview } from '../../../server/domains/tournament/registration-overview'
import { registrationPrintGroups } from '../../../app/utils/tournament-registration-overview'

const series = [
  {
    id: 1,
    name: 'Simple',
    seriesFormat: 'singles' as const,
    seriesDate: '2026-08-29',
    startTime: '08:30'
  },
  {
    id: 2,
    name: 'Speedy',
    seriesFormat: 'singles' as const,
    seriesDate: '2026-08-29',
    startTime: '09:30'
  },
  {
    id: 3,
    name: 'Doubles',
    seriesFormat: 'doubles' as const,
    seriesDate: '2026-08-30',
    startTime: '10:30'
  }
]

function registration(
  id: number,
  seriesId: number,
  changes: Partial<SeriesRegistration> = {}
): SeriesRegistration {
  return {
    id,
    seriesId,
    firstName: 'Alice',
    lastName: 'Martin',
    club: 'Libercourt',
    licenceNumber: '123',
    playerIdentity: null,
    partnerIdentity: null,
    ranking: 700,
    playerCategory: null,
    playerGender: null,
    handicapPoints: 0,
    paymentStatus: 'unpaid',
    attendanceStatus: 'unknown',
    isForfeit: false,
    seedPosition: null,
    partnerLicenceNumber: null,
    partnerFirstName: null,
    partnerLastName: null,
    partnerClub: null,
    partnerRanking: null,
    notes: null,
    registeredAt: null,
    ...changes
  }
}

describe('tournament registration overview', function () {
  it('groups one licensed player across series, with the status of each registration', function () {
    const rows = [
      registration(10, 1),
      registration(11, 2, {
        isForfeit: true,
        paymentStatus: 'paid',
        attendanceStatus: 'absent'
      })
    ]
    const before = structuredClone(rows)
    const result = buildRegistrationOverview(series, rows)
    expect(result.players).toHaveLength(1)
    expect(result.players[0]!.registrations[1]).toMatchObject([
      { registrationId: 10, paymentStatus: 'unpaid' }
    ])
    expect(result.players[0]!.registrations[2]).toMatchObject([
      {
        registrationId: 11,
        isForfeit: true,
        paymentStatus: 'paid',
        attendanceStatus: 'absent'
      }
    ])
    expect(
      result.series.map(function (entry) {
        return entry.registrationCount
      })
    ).toEqual([1, 1, 0])
    expect(rows).toEqual(before)
  })

  it('shows both partners separately and joins a partner to their singles registrations', function () {
    const result = buildRegistrationOverview(series, [
      registration(10, 1, {
        licenceNumber: '456',
        firstName: 'Bob',
        lastName: 'Dupont',
        club: 'Carvin'
      }),
      registration(11, 3, {
        partnerLicenceNumber: '456',
        partnerFirstName: 'Bob',
        partnerLastName: 'Dupont',
        partnerClub: 'Carvin'
      })
    ])
    expect(result.players).toHaveLength(2)
    const bob = result.players.find(function (player) {
      return player.licenceNumber === '456'
    })!
    expect(bob.club).toBe('Carvin')
    expect(bob.registrations[1]).toHaveLength(1)
    expect(bob.registrations[3]![0]!.partnerName).toBe('Alice Martin')
    const alice = result.players.find(function (player) {
      return player.licenceNumber === '123'
    })!
    expect(alice.registrations[3]![0]!.partnerName).toBe('Bob Dupont')
    expect(result.series[2]!.registrationCount).toBe(1)
  })

  it('uses manual identity links and the existing fallback for unlicensed players', function () {
    const result = buildRegistrationOverview(series, [
      registration(10, 1, {
        licenceNumber: null,
        playerIdentity: 'shared-player'
      }),
      registration(11, 2, {
        licenceNumber: null,
        playerIdentity: 'shared-player',
        club: null
      }),
      registration(12, 1, {
        licenceNumber: null,
        firstName: 'Élodie',
        lastName: 'Durand'
      }),
      registration(13, 2, {
        licenceNumber: null,
        firstName: 'ELODIE',
        lastName: 'DURAND'
      })
    ])
    expect(result.players).toHaveLength(2)
    expect(
      result.players.every(function (player) {
        return Object.keys(player.registrations).length === 2
      })
    ).toBe(true)
  })

  it('keeps licensed namesakes distinct and preserves multiple pairs in the same series', function () {
    const result = buildRegistrationOverview(series, [
      registration(10, 1),
      registration(11, 1, { licenceNumber: '999' }),
      registration(12, 3, {
        partnerLicenceNumber: '456',
        partnerFirstName: 'Bob',
        partnerLastName: 'Dupont'
      }),
      registration(13, 3, {
        partnerLicenceNumber: '789',
        partnerFirstName: 'Chloé',
        partnerLastName: 'Durand'
      })
    ])
    expect(result.players).toHaveLength(4)
    const alice = result.players.find(function (player) {
      return player.licenceNumber === '123'
    })!
    expect(alice.registrations[3]).toHaveLength(2)
  })

  it('lists empty series and ignores registrations outside the supplied tournament', function () {
    const result = buildRegistrationOverview(series, [registration(10, 99)])
    expect(result.players).toEqual([])
    expect(
      result.series.map(function (entry) {
        return entry.registrationCount
      })
    ).toEqual([0, 0, 0])
    expect(buildRegistrationOverview([], [])).toEqual({
      series: [],
      players: []
    })
  })

  it('prints every series once in groups of five without changing the overview', function () {
    const columns = Array.from({ length: 12 }, function (_, index) {
      return { ...series[0]!, id: index + 1 }
    })
    const overview = buildRegistrationOverview(columns, [registration(1, 1)])
    const before = structuredClone(overview)
    const groups = registrationPrintGroups(overview.series)
    expect(
      groups.map(function (group) {
        return group.length
      })
    ).toEqual([5, 5, 2])
    expect(
      groups.flat().map(function (entry) {
        return entry.id
      })
    ).toEqual(
      columns.map(function (entry) {
        return entry.id
      })
    )
    expect(overview).toEqual(before)
    expect(registrationPrintGroups([])).toEqual([])
  })
})
