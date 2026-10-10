import { getIntegral } from '~~/server/domains/tournament/integral-service'
export default defineEventHandler(async function (event) {
  const result = await getIntegral(Number(getRouterParam(event, 'id')))
  // Public tracking needs sporting details only, never payment, notes or licences.
  const registrations = result.registrations.map(function (registration) {
    return {
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      club: registration.club,
      ranking: registration.ranking,
      partnerFirstName: registration.partnerFirstName,
      partnerLastName: registration.partnerLastName,
      partnerClub: registration.partnerClub,
      isForfeit: registration.isForfeit
    }
  })
  const state = result.state
    ? {
        ...result.state,
        entrants: result.state.entrants.map(function (entrant) {
          return { ...entrant, identities: [] }
        })
      }
    : null
  return { ...result, state, registrations }
})
