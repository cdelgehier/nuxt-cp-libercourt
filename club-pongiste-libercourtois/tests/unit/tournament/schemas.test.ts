import { describe, it, expect } from 'vitest'
import {
  createJaAccessInputSchema,
  jaPinAuthInputSchema,
  createTournamentInputSchema,
  updateTournamentInputSchema,
  createSeriesInputSchema,
  updateSeriesInputSchema,
  upsertRegistrationInputSchema,
  patchRegistrationInputSchema,
  enterScoreInputSchema,
  swapPlayersInputSchema,
  forfeitInputSchema
} from '../../../server/domains/tournament/types'

// ---------------------------------------------------------------------------
// createJaAccessInputSchema
// ---------------------------------------------------------------------------

describe('createJaAccessInputSchema', () => {
  it('accepte un code valide à 4 chiffres', () => {
    const result = createJaAccessInputSchema.parse({
      name: 'Marc Dupont',
      pin: '1234'
    })
    expect(result.name).toBe('Marc Dupont')
    expect(result.pin).toBe('1234')
  })

  it('accepte un code valide à 6 chiffres', () => {
    const result = createJaAccessInputSchema.parse({
      name: 'JA Fédération',
      pin: '987654'
    })
    expect(result.pin).toBe('987654')
  })

  it('rejette un nom trop court (< 2 chars)', () => {
    expect(() =>
      createJaAccessInputSchema.parse({ name: 'J', pin: '1234' })
    ).toThrow()
  })

  it('rejette un code à 3 chiffres (trop court)', () => {
    expect(() =>
      createJaAccessInputSchema.parse({ name: 'Marc', pin: '123' })
    ).toThrow()
  })

  it('rejette un code à 7 chiffres (trop long)', () => {
    expect(() =>
      createJaAccessInputSchema.parse({ name: 'Marc', pin: '1234567' })
    ).toThrow()
  })

  it('rejette un code avec des lettres', () => {
    expect(() =>
      createJaAccessInputSchema.parse({ name: 'Marc', pin: 'ab12' })
    ).toThrow()
  })

  it('rejette un nom manquant', () => {
    expect(() => createJaAccessInputSchema.parse({ pin: '1234' })).toThrow()
  })

  it('rejette un pin manquant', () => {
    expect(() => createJaAccessInputSchema.parse({ name: 'Marc' })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// jaPinAuthInputSchema
// ---------------------------------------------------------------------------

describe('jaPinAuthInputSchema', () => {
  it('accepte un identifiant et un pin valides', () => {
    const result = jaPinAuthInputSchema.parse({ jaAccessId: 1, pin: '1234' })
    expect(result.jaAccessId).toBe(1)
    expect(result.pin).toBe('1234')
  })

  it('rejette un jaAccessId négatif', () => {
    expect(() =>
      jaPinAuthInputSchema.parse({ jaAccessId: -1, pin: '1234' })
    ).toThrow()
  })

  it('rejette un jaAccessId à zéro', () => {
    expect(() =>
      jaPinAuthInputSchema.parse({ jaAccessId: 0, pin: '1234' })
    ).toThrow()
  })

  it('rejette jaAccessId manquant', () => {
    expect(() => jaPinAuthInputSchema.parse({ pin: '1234' })).toThrow()
  })

  it('rejette pin manquant', () => {
    expect(() => jaPinAuthInputSchema.parse({ jaAccessId: 1 })).toThrow()
  })

  it('accepte un pin vide (vérification bcrypt laissée au service)', () => {
    // Le schema ne valide pas le format du pin lors du login (seul le service vérifie via bcrypt)
    expect(() =>
      jaPinAuthInputSchema.parse({ jaAccessId: 1, pin: '' })
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// createTournamentInputSchema
// ---------------------------------------------------------------------------

describe('createTournamentInputSchema', () => {
  const validTournament = {
    name: 'Open Libercourtois 2025',
    date: '2025-06-15'
  }

  it('accepte un tournoi minimal valide', () => {
    const result = createTournamentInputSchema.parse(validTournament)
    expect(result.name).toBe('Open Libercourtois 2025')
    expect(result.tableCount).toBe(1) // default
    expect(result.isPublished).toBe(false) // default
    expect(result.isDemo).toBe(false)
  })

  it('accepts demo tournaments and rejects non-boolean flags', function () {
    expect(
      createTournamentInputSchema.parse({ ...validTournament, isDemo: true })
        .isDemo
    ).toBe(true)
    expect(function () {
      createTournamentInputSchema.parse({ ...validTournament, isDemo: 'true' })
    }).toThrow()
    expect(
      updateTournamentInputSchema.parse({ name: 'Nouveau nom' })
    ).not.toHaveProperty('isDemo')
  })

  it('accepte tous les champs optionnels', () => {
    const result = createTournamentInputSchema.parse({
      ...validTournament,
      location: 'Salle des fêtes',
      description: 'Premier tournoi de la saison',
      tableCount: 8,
      isPublished: true
    })
    expect(result.tableCount).toBe(8)
    expect(result.isPublished).toBe(true)
  })

  it('accepte des coordonnées GPS valides', () => {
    const result = createTournamentInputSchema.parse({
      ...validTournament,
      location: 'Salle Deladerriere, Complexe Sportif Leo Lagrange',
      locationLat: 50.48185408012125,
      locationLng: 3.017099247377654
    })
    expect(result.locationLat).toBe(50.48185408012125)
    expect(result.locationLng).toBe(3.017099247377654)
  })

  it('accepte un tournoi sans coordonnées GPS (champs optionnels)', () => {
    const result = createTournamentInputSchema.parse(validTournament)
    expect(result.locationLat).toBeUndefined()
    expect(result.locationLng).toBeUndefined()
  })

  it('rejette un nom trop court (< 3 chars)', () => {
    expect(() =>
      createTournamentInputSchema.parse({ ...validTournament, name: 'AB' })
    ).toThrow()
  })

  it('rejette une date mal formatée', () => {
    expect(() =>
      createTournamentInputSchema.parse({
        ...validTournament,
        date: '15/06/2025'
      })
    ).toThrow()
  })

  it('rejette tableCount = 0', () => {
    expect(() =>
      createTournamentInputSchema.parse({ ...validTournament, tableCount: 0 })
    ).toThrow()
  })

  it('rejette tableCount > 100', () => {
    expect(() =>
      createTournamentInputSchema.parse({
        ...validTournament,
        tableCount: 101
      })
    ).toThrow()
  })

  it('accepte une dateEnd valide pour un tournoi multi-jours', () => {
    const result = createTournamentInputSchema.parse({
      ...validTournament,
      dateEnd: '2025-06-16'
    })
    expect(result.dateEnd).toBe('2025-06-16')
  })

  it('accepte une dateEnd vide (chaîne vide → undefined)', () => {
    const result = createTournamentInputSchema.parse({
      ...validTournament,
      dateEnd: ''
    })
    expect(result.dateEnd).toBeUndefined()
  })

  it('rejette une dateEnd mal formatée', () => {
    expect(() =>
      createTournamentInputSchema.parse({
        ...validTournament,
        dateEnd: '16/06/2025'
      })
    ).toThrow()
  })
})

describe('updateTournamentInputSchema', () => {
  it('accepte un objet vide (toutes les clés optionnelles)', () => {
    expect(() => updateTournamentInputSchema.parse({})).not.toThrow()
  })

  it('accepte une mise à jour partielle', () => {
    const result = updateTournamentInputSchema.parse({ isPublished: true })
    expect(result.isPublished).toBe(true)
  })

  it('accepte une mise à jour des coordonnées GPS seules', () => {
    const result = updateTournamentInputSchema.parse({
      locationLat: 50.48185408012125,
      locationLng: 3.017099247377654
    })
    expect(result.locationLat).toBe(50.48185408012125)
    expect(result.locationLng).toBe(3.017099247377654)
  })

  it('accepte une mise à jour de dateEnd', () => {
    const result = updateTournamentInputSchema.parse({ dateEnd: '2025-06-16' })
    expect(result.dateEnd).toBe('2025-06-16')
  })

  it("accepte dateEnd vide → undefined lors d'une mise à jour", () => {
    const result = updateTournamentInputSchema.parse({ dateEnd: '' })
    expect(result.dateEnd).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// createSeriesInputSchema
// ---------------------------------------------------------------------------

describe('createSeriesInputSchema', () => {
  const validSeries = {
    name: 'Simple Hommes A',
    seriesDate: '2025-06-15',
    startTime: '09:00'
  }

  it.each([undefined, null, '', '24:00', '12:60', '9:00'])(
    'requires a real start time: %s',
    function (startTime) {
      expect(function () {
        createSeriesInputSchema.parse({ ...validSeries, startTime })
      }).toThrow()
    }
  )

  it.each([undefined, null, '', '2026-02-30'])(
    'requires a real series date: %s',
    function (seriesDate) {
      expect(function () {
        createSeriesInputSchema.parse({ ...validSeries, seriesDate })
      }).toThrow()
    }
  )

  it('accepte une série standard minimale', () => {
    const result = createSeriesInputSchema.parse(validSeries)
    expect(result.seriesFormat).toBe('singles')
    expect(result.seriesType).toBe('standard')
    expect(result.setsToWin).toBe(3)
    expect(result.pointsPerSet).toBe(11)
  })

  it('conserve les réglages personnalisés de speedy', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Série Speedy',
      seriesType: 'speedy',
      setsToWin: 3,
      pointsPerSet: 11
    })
    expect(result.setsToWin).toBe(3)
    expect(result.pointsPerSet).toBe(11)
  })

  it('accepte points_limit avec borne min', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Moins de 500 pts',
      seriesType: 'points_limit',
      pointsLimitMax: 500
    })
    expect(result.pointsLimitMax).toBe(500)
  })

  it('accepte points_limit avec borne max', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: '500-1000 pts',
      seriesType: 'points_limit',
      pointsLimitMin: 500,
      pointsLimitMax: 1000
    })
    expect(result.pointsLimitMin).toBe(500)
  })

  it('rejette points_limit sans aucune borne', () => {
    expect(() =>
      createSeriesInputSchema.parse({
        ...validSeries,
        name: 'Série pts',
        seriesType: 'points_limit'
      })
    ).toThrow()
  })

  it('rejette setsToWin > 4', () => {
    expect(() =>
      createSeriesInputSchema.parse({ ...validSeries, name: 'A', setsToWin: 5 })
    ).toThrow()
  })

  it('rejette pointsPerSet < 3', () => {
    expect(() =>
      createSeriesInputSchema.parse({
        ...validSeries,
        name: 'A',
        pointsPerSet: 2
      })
    ).toThrow()
  })

  it.each(['standard', 'speedy', 'handicap', 'points_limit', 'mixed_doubles'])(
    "accepte le type de format '%s'",
    seriesType => {
      const input =
        seriesType === 'points_limit'
          ? {
              ...validSeries,
              name: 'Série test',
              seriesType,
              pointsLimitMax: 500
            }
          : { ...validSeries, name: 'Série test', seriesType }
      const result = createSeriesInputSchema.parse(input)
      expect(result.seriesType).toBe(seriesType)
    }
  )

  it.each([
    'age_junior',
    'age_veteran',
    'poussin_benjamin',
    'minimes',
    'juniors',
    'invalid_type'
  ])(
    "rejette le type obsolète/inconnu '%s' (les catégories d'âge passent par ageCategories[])",
    seriesType => {
      expect(() =>
        createSeriesInputSchema.parse({
          ...validSeries,
          name: 'Série test',
          seriesType
        })
      ).toThrow()
    }
  )

  it('accepte ageCategories avec des catégories valides', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Poussin / Minimes',
      ageCategories: ['poussin', 'benjamin', 'minimes']
    })
    expect(result.ageCategories).toEqual(['poussin', 'benjamin', 'minimes'])
  })

  it('ageCategories vide par défaut', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Open'
    })
    expect(result.ageCategories).toEqual([])
  })

  it('rejette une ageCategory invalide', () => {
    expect(() =>
      createSeriesInputSchema.parse({
        ...validSeries,
        name: 'Série test',
        ageCategories: ['poussin', 'invalid_cat']
      })
    ).toThrow()
  })

  it('rejette Coupe Davis pour les nouvelles séries', () => {
    expect(() =>
      createSeriesInputSchema.parse({
        ...validSeries,
        name: 'Coupe Davis',
        seriesType: 'coupe_davis'
      })
    ).toThrow()
  })

  it("force seriesFormat='doubles' pour mixed_doubles", () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Double Mixte',
      seriesType: 'mixed_doubles'
    })
    expect(result.seriesFormat).toBe('doubles')
  })

  it("force seriesFormat='doubles' même si singles fourni pour mixed_doubles", () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Double Mixte',
      seriesType: 'mixed_doubles',
      seriesFormat: 'singles' // overridden by transform
    })
    expect(result.seriesFormat).toBe('doubles')
  })

  it('accepte une seriesDate valide au format YYYY-MM-DD', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Simple Hommes',
      seriesDate: '2025-06-15'
    })
    expect(result.seriesDate).toBe('2025-06-15')
  })

  it('rejette une seriesDate mal formatée', () => {
    expect(() =>
      createSeriesInputSchema.parse({
        ...validSeries,
        name: 'Simple Hommes',
        seriesDate: '15/06/2025'
      })
    ).toThrow()
  })

  it('accepte un startTime valide au format HH:MM', () => {
    const result = createSeriesInputSchema.parse({
      ...validSeries,
      name: 'Simple Hommes',
      startTime: '09:30'
    })
    expect(result.startTime).toBe('09:30')
  })

  it('rejette un startTime mal formaté', () => {
    expect(() =>
      createSeriesInputSchema.parse({
        ...validSeries,
        name: 'Simple Hommes',
        startTime: '9h30'
      })
    ).toThrow()
  })
})

describe('updateSeriesInputSchema', () => {
  it("ne remplace pas les réglages lors d'une mise à jour speedy", () => {
    const result = updateSeriesInputSchema.parse({ seriesType: 'speedy' })
    expect(result.setsToWin).toBeUndefined()
    expect(result.pointsPerSet).toBeUndefined()
  })

  it("force seriesFormat='doubles' pour mixed_doubles lors d'une mise à jour", () => {
    const result = updateSeriesInputSchema.parse({
      seriesType: 'mixed_doubles'
    })
    expect(result.seriesFormat).toBe('doubles')
  })

  it('accepte un objet vide', () => {
    expect(() => updateSeriesInputSchema.parse({})).not.toThrow()
  })

  it("accepte une seriesDate et startTime lors d'une mise à jour", () => {
    const result = updateSeriesInputSchema.parse({
      seriesDate: '2025-06-15',
      startTime: '14:00'
    })
    expect(result.seriesDate).toBe('2025-06-15')
    expect(result.startTime).toBe('14:00')
  })

  it.each([
    { seriesDate: '' },
    { seriesDate: null },
    { seriesDate: '2026-02-30' },
    { startTime: '' },
    { startTime: null },
    { startTime: '24:00' },
    { startTime: '12:60' }
  ])(
    'rejects erasing or invalidating the series schedule: %s',
    function (input) {
      expect(function () {
        updateSeriesInputSchema.parse(input)
      }).toThrow()
    }
  )
})

// ---------------------------------------------------------------------------
// upsertRegistrationInputSchema
// ---------------------------------------------------------------------------

describe('upsertRegistrationInputSchema', () => {
  const validPlayer = { firstName: 'Jean', lastName: 'Dupont' }

  it('accepte un joueur minimal', () => {
    const result = upsertRegistrationInputSchema.parse(validPlayer)
    expect(result.firstName).toBe('Jean')
    expect(result.paymentStatus).toBe('unpaid') // default
    expect(result.attendanceStatus).toBe('unknown') // default
    expect(result.handicapPoints).toBe(0) // default
  })

  it('rejette prénom vide', () => {
    expect(() =>
      upsertRegistrationInputSchema.parse({
        firstName: '',
        lastName: 'Dupont'
      })
    ).toThrow()
  })

  it('rejette nom vide', () => {
    expect(() =>
      upsertRegistrationInputSchema.parse({ firstName: 'Jean', lastName: '' })
    ).toThrow()
  })

  it('rejette un paymentStatus invalide', () => {
    expect(() =>
      upsertRegistrationInputSchema.parse({
        ...validPlayer,
        paymentStatus: 'pending'
      })
    ).toThrow()
  })

  it('accepte des infos de partenaire pour les doubles', () => {
    const result = upsertRegistrationInputSchema.parse({
      ...validPlayer,
      partnerFirstName: 'Pierre',
      partnerLastName: 'Martin',
      partnerClub: 'Arras TT'
    })
    expect(result.partnerFirstName).toBe('Pierre')
  })
})

// ---------------------------------------------------------------------------
// patchRegistrationInputSchema
// ---------------------------------------------------------------------------

describe('patchRegistrationInputSchema', () => {
  it('accepte un objet vide (toutes les clés optionnelles)', () => {
    expect(() => patchRegistrationInputSchema.parse({})).not.toThrow()
  })

  it("n'injecte PAS attendanceStatus par défaut quand seul paymentStatus est fourni", () => {
    // Régression : upsertRegistrationInputSchema.partial() appliquait default("unknown")
    // même pour les champs absents, réinitialisant la présence lors d'un PATCH paiement
    const result = patchRegistrationInputSchema.parse({
      paymentStatus: 'paid'
    })
    expect(result.attendanceStatus).toBeUndefined()
    expect(result.isForfeit).toBeUndefined()
    expect(result.paymentStatus).toBe('paid')
  })

  it("n'injecte PAS paymentStatus par défaut quand seul attendanceStatus est fourni", () => {
    const result = patchRegistrationInputSchema.parse({
      attendanceStatus: 'present'
    })
    expect(result.paymentStatus).toBeUndefined()
    expect(result.attendanceStatus).toBe('present')
  })

  it("n'injecte PAS isForfeit par défaut quand aucun champ n'est fourni", () => {
    const result = patchRegistrationInputSchema.parse({})
    expect(result.isForfeit).toBeUndefined()
    expect(result.paymentStatus).toBeUndefined()
    expect(result.attendanceStatus).toBeUndefined()
  })

  it('accepte une mise à jour combinée présence + paiement', () => {
    const result = patchRegistrationInputSchema.parse({
      attendanceStatus: 'present',
      paymentStatus: 'paid'
    })
    expect(result.attendanceStatus).toBe('present')
    expect(result.paymentStatus).toBe('paid')
    expect(result.isForfeit).toBeUndefined()
  })

  it('rejette un attendanceStatus invalide', () => {
    expect(() =>
      patchRegistrationInputSchema.parse({ attendanceStatus: 'maybe' })
    ).toThrow()
  })

  it('rejette un paymentStatus invalide', () => {
    expect(() =>
      patchRegistrationInputSchema.parse({ paymentStatus: 'pending' })
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// enterScoreInputSchema
// ---------------------------------------------------------------------------

describe('enterScoreInputSchema', () => {
  it('accepte un score 3-0 valide', () => {
    const result = enterScoreInputSchema.parse({
      sets: [
        { score1: 11, score2: 4 },
        { score1: 11, score2: 6 },
        { score1: 11, score2: 8 }
      ]
    })
    expect(result.sets).toHaveLength(3)
  })

  it('rejette une liste de sets vide', () => {
    expect(() => enterScoreInputSchema.parse({ sets: [] })).toThrow()
  })

  it('rejette plus de 7 sets', () => {
    expect(() =>
      enterScoreInputSchema.parse({
        sets: Array(8).fill({ score1: 11, score2: 0 })
      })
    ).toThrow()
  })

  it('rejette un score négatif', () => {
    expect(() =>
      enterScoreInputSchema.parse({
        sets: [{ score1: -1, score2: 11 }]
      })
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// swapPlayersInputSchema
// ---------------------------------------------------------------------------

describe('swapPlayersInputSchema', () => {
  it('accepte deux IDs valides', () => {
    const result = swapPlayersInputSchema.parse({
      registrationId1: 1,
      registrationId2: 2
    })
    expect(result.registrationId1).toBe(1)
  })

  it('rejette un ID à zéro', () => {
    expect(() =>
      swapPlayersInputSchema.parse({ registrationId1: 0, registrationId2: 1 })
    ).toThrow()
  })

  it('rejette un ID manquant', () => {
    expect(() => swapPlayersInputSchema.parse({ registrationId1: 1 })).toThrow()
  })
})

// ---------------------------------------------------------------------------
// forfeitInputSchema
// ---------------------------------------------------------------------------

describe('forfeitInputSchema', () => {
  it('accepte un winnerId valide', () => {
    const result = forfeitInputSchema.parse({ winnerId: 42 })
    expect(result.winnerId).toBe(42)
  })

  it('rejette winnerId à zéro', () => {
    expect(() => forfeitInputSchema.parse({ winnerId: 0 })).toThrow()
  })

  it('rejette winnerId négatif', () => {
    expect(() => forfeitInputSchema.parse({ winnerId: -1 })).toThrow()
  })

  it('rejette winnerId manquant', () => {
    expect(() => forfeitInputSchema.parse({})).toThrow()
  })
})
