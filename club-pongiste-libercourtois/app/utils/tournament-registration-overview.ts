import type {
  RegistrationOverviewEntry,
  RegistrationOverviewSeries
} from '../../shared/tournament-registrations'

/** Keep column groups readable on A4 landscape; names and clubs repeat in each group. */
export function registrationPrintGroups(
  series: RegistrationOverviewSeries[]
): RegistrationOverviewSeries[][] {
  const groups: RegistrationOverviewSeries[][] = []
  for (let index = 0; index < series.length; index += 5)
    groups.push(series.slice(index, index + 5))
  return groups
}

export function registrationLabel(entry: RegistrationOverviewEntry): string {
  if (entry.isForfeit) return 'Forfait'
  if (entry.attendanceStatus === 'absent') return 'Absent'
  return 'Inscrit'
}

export function registrationPaymentLabel(
  entry: RegistrationOverviewEntry
): string {
  if (entry.paymentStatus === 'paid') return 'Payé'
  if (entry.paymentStatus === 'refunded') return 'Remboursé'
  return 'Non payé'
}
