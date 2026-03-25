/**
 * Utilities for team data processing and enrichment
 */

/**
 * Extract phase number from team name
 * @param libequipe - Team name (e.g., "LIBERCOURT CP (1) - Phase 1")
 * @returns Phase number (1, 2, etc.)
 */
export function extractPhaseFromTeamName(libequipe: string): number {
  const phaseMatch = libequipe.match(/Phase (\d+)/i);
  return phaseMatch ? parseInt(phaseMatch[1], 10) : 1;
}

/**
 * Extract poule ID (cx_poule) from liendivision
 * @param liendivision - Division link (e.g., "cx_poule=1164490&D1=206205&organisme_pere=67")
 * @returns Poule ID
 */
export function extractPouleId(liendivision: string): string {
  const pouleMatch = liendivision.match(/cx_poule=(\d+)/);
  return pouleMatch ? pouleMatch[1] : "";
}

/**
 * Extract division ID (D1) from liendivision
 * @param liendivision - Division link
 * @returns Division ID
 */
export function extractDivisionId(liendivision: string): string {
  const divisionMatch = liendivision.match(/D1=(\d+)/);
  return divisionMatch ? divisionMatch[1] : "";
}

/**
 * Generate unique key for a team instance (idequipe + cx_poule)
 * This is unique because a team can't be in 2 different poules with the same cx_poule
 * @param idequipe - Team ID from FFTT
 * @param liendivision - Division link
 * @returns Unique key (e.g., "27182-1164490")
 */
export function getUniqueTeamKey(
  idequipe: string,
  liendivision: string,
): string {
  const pouleId = extractPouleId(liendivision);
  return `${idequipe}-${pouleId}`;
}

/**
 * Get team number from libequipe
 * @param libequipe - Team name (e.g., "LIBERCOURT CP 2 - Phase 1")
 * @returns Team number (1, 2, 3, etc.)
 */
export function extractTeamNumber(libequipe: string): number {
  // Match "CP (1)" or "CP 2" or "CP 3"
  const match = libequipe.match(/CP \(?(\d+)\)?/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Group teams by phase
 * @param teams - Array of teams
 * @returns Object with phase as key and teams as value
 */
export function groupTeamsByPhase<T extends { phase: number }>(
  teams: T[],
): Record<number, T[]> {
  return teams.reduce(
    (acc, team) => {
      const phase = team.phase;
      if (!acc[phase]) {
        acc[phase] = [];
      }
      acc[phase].push(team);
      return acc;
    },
    {} as Record<number, T[]>,
  );
}

/**
 * Get phase label for display
 * @param phase - Phase number
 * @returns Phase label
 */
export function getPhaseLabel(phase: number): string {
  return `Phase ${phase}`;
}

/**
 * Get phase description
 * @param phase - Phase number
 * @returns Phase description
 */
export function getPhaseDescription(phase: number): string {
  switch (phase) {
    case 1:
      return "Première partie de saison";
    case 2:
      return "Deuxième partie de saison";
    default:
      return `Phase ${phase}`;
  }
}
