import { describe, expect, it } from 'vitest'
import { checkTournamentScope } from '../../../server/domains/tournament/access'
describe('tournament ownership', function () {
  it('blocks a JA from another tournament', function () {
    expect(function () {
      checkTournamentScope(1, 1, 2, false, false, false)
    }).toThrow()
  })
  it('blocks a series nested below the wrong slug even for admin', function () {
    expect(function () {
      checkTournamentScope(1, 2, null, true, true, false)
    }).toThrow()
  })
  it('hides unpublished tournaments on public endpoints', function () {
    expect(function () {
      checkTournamentScope(1, 1, null, false, false, true)
    }).toThrow()
  })
  it('accepts a scoped JA and published public reads', function () {
    expect(function () {
      checkTournamentScope(1, 1, 1, false, false, false)
    }).not.toThrow()
    expect(function () {
      checkTournamentScope(1, 1, null, false, true, true)
    }).not.toThrow()
  })
})
