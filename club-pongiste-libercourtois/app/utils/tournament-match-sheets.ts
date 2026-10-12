import type { IntegralMatch } from '../../server/domains/tournament/integral'

/** Pool match numbers follow their original order within that pool. */
export function matchSheetTitle(
  match: IntegralMatch,
  matches: IntegralMatch[]
): string {
  if (match.phase === 'playoffs') return 'Barrage'
  if (match.phase === 'placement') return 'Classement'
  const poolMatches = matches.filter(function (entry) {
    return entry.phase === 'pools' && entry.poolId === match.poolId
  })
  return `Poule ${match.poolId} - Match ${
    poolMatches.findIndex(function (entry) {
      return entry.id === match.id
    }) + 1
  }`
}

/** Print only selected matches with two known opponents, including completed matches. */
export function selectMatchSheets(
  matches: IntegralMatch[],
  ids: number[] | null = null
): IntegralMatch[] {
  return matches.filter(function (match) {
    return (
      match.player1 !== null &&
      match.player2 !== null &&
      (ids === null || ids.includes(match.id))
    )
  })
}

/** Keep match order and place up to four sheets on each A4 page. */
export function paginateMatchSheets(
  matches: IntegralMatch[]
): IntegralMatch[][] {
  const pages: IntegralMatch[][] = []
  for (let index = 0; index < matches.length; index += 4) {
    pages.push(matches.slice(index, index + 4))
  }
  return pages
}
