import type { TeamDataEnriched } from '~/types'

/**
 * Composable for team data management
 */
export const useTeams = () => {
  /**
   * Group teams by phase
   * @param teams - Array of enriched teams
   * @returns Object with phase as key and teams as value
   */
  const groupByPhase = (
    teams: TeamDataEnriched[],
  ): Record<number, TeamDataEnriched[]> => {
    return teams.reduce(
      (acc, team) => {
        const phase = team.phase
        if (!acc[phase]) {
          acc[phase] = []
        }
        acc[phase].push(team)
        return acc
      },
      {} as Record<number, TeamDataEnriched[]>,
    )
  }

  /**
   * Get sorted phase numbers from teams
   * @param teams - Array of enriched teams
   * @returns Sorted array of phase numbers
   */
  const getPhases = (teams: TeamDataEnriched[]): number[] => {
    const phases = [...new Set(teams.map(t => t.phase))]
    return phases.sort((a, b) => a - b)
  }

  /**
   * Filter teams by phase
   * @param teams - Array of enriched teams
   * @param phase - Phase number to filter by
   * @returns Filtered teams
   */
  const filterByPhase = (
    teams: TeamDataEnriched[],
    phase: number,
  ): TeamDataEnriched[] => {
    return teams.filter(t => t.phase === phase)
  }

  /**
   * Get phase label for display
   * @param phase - Phase number
   * @returns Phase label
   */
  const getPhaseLabel = (phase: number): string => {
    return `Phase ${phase}`
  }

  /**
   * Get phase description
   * @param phase - Phase number
   * @returns Phase description
   */
  const getPhaseDescription = (phase: number): string => {
    switch (phase) {
      case 1:
        return 'Première partie de saison'
      case 2:
        return 'Deuxième partie de saison'
      default:
        return `Phase ${phase}`
    }
  }

  /**
   * Check if team is junior category
   * @param team - Team data
   * @returns True if junior team
   */
  const isJuniorTeam = (team: TeamDataEnriched): boolean => {
    return team.libepr === 'FED_Championnat par Equipes Jeunes'
  }

  /**
   * Check if team is senior category
   * @param team - Team data
   * @returns True if senior team
   */
  const isSeniorTeam = (team: TeamDataEnriched): boolean => {
    return team.libepr === 'FED_Championnat de France par Equipes Masculin'
  }

  return {
    groupByPhase,
    getPhases,
    filterByPhase,
    getPhaseLabel,
    getPhaseDescription,
    isJuniorTeam,
    isSeniorTeam,
  }
}
