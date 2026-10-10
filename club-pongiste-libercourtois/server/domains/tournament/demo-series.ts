import type { TournamentSeries } from './types'
import { AGE_CATEGORIES } from './types'

type DemoSeries = Pick<
  TournamentSeries,
  | 'seriesFormat'
  | 'seriesType'
  | 'femalesOnly'
  | 'ageCategories'
  | 'pointsLimitMin'
  | 'pointsLimitMax'
>

/** Demo writes are allowed only in development on a local PostgreSQL database. */
export function canFillDemoSeries(
  development: boolean,
  connection?: string
): boolean {
  if (!development || !connection) return false
  try {
    const url = new URL(connection)
    return (
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  } catch {
    return false
  }
}

/** Build fictitious players without an external service or real licence numbers. */
export function buildDemoRegistrations(
  series: DemoSeries,
  offset: number,
  count: number
) {
  const entries = []
  const category = AGE_CATEGORIES.find(function (value) {
    return series.ageCategories.includes(value)
  })
  const limited = series.seriesType === 'points_limit'
  const max = limited
    ? (series.pointsLimitMax ?? Math.max(series.pointsLimitMin ?? 500, 2000))
    : 2000
  const min = limited ? (series.pointsLimitMin ?? Math.min(500, max)) : 500
  for (let index = offset; index < offset + count; index++) {
    const points = min + ((index * 137) % (max - min + 1))
    const doubles = series.seriesFormat === 'doubles'
    entries.push({
      firstName: `Joueur ${index + 1}`,
      lastName: 'DÉMO',
      licenceNumber: `DEMO-${index + 1}`,
      club: ['Libercourt', 'Lille', 'Seclin', 'Lys-lez-Lannoy'][index % 4]!,
      ranking: doubles ? Math.ceil(points / 2) : points,
      playerGender: series.femalesOnly
        ? ('F' as const)
        : index % 2 === 0
          ? ('M' as const)
          : ('F' as const),
      playerCategory: category,
      attendanceStatus: 'present' as const,
      paymentStatus: index % 3 === 0 ? ('unpaid' as const) : ('paid' as const),
      partnerFirstName: doubles ? `Partenaire ${index + 1}` : undefined,
      partnerLastName: doubles ? 'DÉMO' : undefined,
      partnerLicenceNumber: doubles ? `DEMO-P-${index + 1}` : undefined,
      partnerClub: doubles ? 'Libercourt' : undefined,
      partnerRanking: doubles ? Math.floor(points / 2) : undefined
    })
  }
  return entries
}
