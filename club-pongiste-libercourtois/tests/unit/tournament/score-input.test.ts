import { expect, it } from 'vitest'
import { scoreInput } from '../../../app/utils/tournament-score'

it('ignores cleared trailing score fields while preserving zero', function () {
  expect(
    scoreInput([
      { score1: 11, score2: 0 },
      { score1: '', score2: null }
    ])
  ).toEqual([{ score1: 11, score2: 0 }])
})
it('rejects an incomplete set or a gap between played sets', function () {
  expect(function () {
    scoreInput([{ score1: 11, score2: '' }])
  }).toThrow('deux scores')
  expect(function () {
    scoreInput([
      { score1: null, score2: null },
      { score1: 11, score2: 0 }
    ])
  }).toThrow('ordre')
})
