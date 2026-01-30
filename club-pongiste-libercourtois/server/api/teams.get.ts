import { fetchTeamsWithSmartPing } from '~/server/utils/smartping'
import {
  extractPhaseFromTeamName,
  extractPouleId,
  extractDivisionId,
  extractTeamNumber,
  getUniqueTeamKey,
} from '~/server/utils/teams'
import clubConfig from '~/content/club/config.json'
import type { TeamDataEnriched } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const clubId = clubConfig.club.id // "07620112"

    console.log('Fetching teams for club:', clubId)

    const result = await fetchTeamsWithSmartPing(clubId)

    if (result.success && result.data) {
      // Enrich teams with phase, unique key, and other extracted data
      const enrichedTeams: TeamDataEnriched[] = result.data.map(team => ({
        ...team,
        phase: extractPhaseFromTeamName(team.libequipe),
        uniqueKey: getUniqueTeamKey(team.idequipe, team.liendivision),
        pouleId: extractPouleId(team.liendivision),
        divisionId: extractDivisionId(team.liendivision),
        teamNumber: extractTeamNumber(team.libequipe),
      }))

      console.log('Teams fetched and enriched successfully:', {
        count: enrichedTeams.length,
        source: result.source,
        phases: [...new Set(enrichedTeams.map(t => t.phase))].sort(),
      })

      return {
        success: true,
        data: enrichedTeams,
        source: result.source,
      }
    }
    else {
      console.error('Failed to fetch teams:', result.error)

      return {
        success: false,
        error: result.error,
        source: result.source,
      }
    }
  }
  catch (error) {
    console.error('Teams API error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'api_error',
    }
  }
})
