import { describe, expect, it } from 'vitest'
import {
  canFillDemoSeries,
  buildDemoRegistrations
} from '../../../server/domains/tournament/demo-series'
import { upsertRegistrationInputSchema } from '../../../server/domains/tournament/types'

const singles = {
  seriesFormat: 'singles',
  seriesType: 'standard',
  femalesOnly: false,
  ageCategories: [],
  pointsLimitMin: null,
  pointsLimitMax: null
} as const

describe('local demonstration registrations', function () {
  it('allows only development with a loopback database', function () {
    expect(
      canFillDemoSeries(
        true,
        'postgresql://postgres:postgres@127.0.0.1:55432/postgres'
      )
    ).toBe(true)
    expect(
      canFillDemoSeries(true, 'postgresql://postgres:postgres@localhost/test')
    ).toBe(true)
    expect(
      canFillDemoSeries(false, 'postgresql://postgres:postgres@localhost/test')
    ).toBe(false)
    expect(
      canFillDemoSeries(
        true,
        'postgresql://postgres:postgres@example.neon.tech/test'
      )
    ).toBe(false)
    expect(canFillDemoSeries(true, undefined)).toBe(false)
    expect(canFillDemoSeries(true, 'invalid')).toBe(false)
  })

  it('creates 24 present players with distinct shared identities and varied payments', function () {
    const players = buildDemoRegistrations(singles, 0, 24)
    expect(players).toHaveLength(24)
    expect(
      new Set(
        players.map(function (player) {
          return player.licenceNumber
        })
      ).size
    ).toBe(24)
    expect(
      players.every(function (player) {
        return player.attendanceStatus === 'present'
      })
    ).toBe(true)
    expect(
      new Set(
        players.map(function (player) {
          return player.paymentStatus
        })
      )
    ).toEqual(new Set(['paid', 'unpaid']))
    expect(
      players.every(function (player) {
        return upsertRegistrationInputSchema.safeParse(player).success
      })
    ).toBe(true)
    expect(buildDemoRegistrations(singles, 24, 2)[0]!.licenceNumber).not.toBe(
      players[0]!.licenceNumber
    )
  })

  it('respects female, age and combined points restrictions in doubles', function () {
    const players = buildDemoRegistrations(
      {
        ...singles,
        seriesFormat: 'doubles',
        seriesType: 'points_limit',
        femalesOnly: true,
        ageCategories: ['juniors'],
        pointsLimitMin: 1100,
        pointsLimitMax: 1400
      },
      0,
      8
    )
    for (const player of players) {
      expect(player.playerGender).toBe('F')
      expect(player.playerCategory).toBe('juniors')
      expect(player.partnerFirstName).toBeTruthy()
      expect(player.partnerLicenceNumber).not.toBe(player.licenceNumber)
      expect(player.ranking! + player.partnerRanking!).toBeGreaterThanOrEqual(
        1100
      )
      expect(player.ranking! + player.partnerRanking!).toBeLessThanOrEqual(1400)
      expect(upsertRegistrationInputSchema.safeParse(player).success).toBe(true)
    }
  })

  it('fills a series with only a low upper points limit', function () {
    const players = buildDemoRegistrations(
      { ...singles, seriesType: 'points_limit', pointsLimitMax: 300 },
      0,
      24
    )
    for (const player of players) {
      expect(player.ranking).toBeGreaterThanOrEqual(0)
      expect(player.ranking).toBeLessThanOrEqual(300)
    }
  })
})
