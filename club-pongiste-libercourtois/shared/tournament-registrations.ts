export interface RegistrationOverviewSeries {
  id: number
  name: string
  format: 'singles' | 'doubles'
  date: string
  startTime: string
  registrationCount: number
}

export interface RegistrationOverviewEntry {
  registrationId: number
  attendanceStatus: 'unknown' | 'present' | 'absent'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  isForfeit: boolean
  partnerName: string | null
}

export interface RegistrationOverviewPlayer {
  identity: string
  firstName: string
  lastName: string
  club: string | null
  licenceNumber: string | null
  registrations: Record<number, RegistrationOverviewEntry[]>
}

/** Private tournament roster: one row per person, including doubles partners. */
export interface RegistrationOverview {
  series: RegistrationOverviewSeries[]
  players: RegistrationOverviewPlayer[]
}
