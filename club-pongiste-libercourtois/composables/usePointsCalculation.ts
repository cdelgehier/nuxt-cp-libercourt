/**
 * Composable for FFTT points calculation
 * Calculates ranking points gained/lost based on official FFTT rules
 */

interface PointsCalculationResult {
  points: number;
  isVictory: boolean;
  isAbnormal: boolean;
}

interface MatchResult {
  playerRanking: number;
  opponentRanking: number;
  victory: boolean;
}

/**
 * FFTT points calculation composable
 * Based on official FFTT points table
 */
export const usePointsCalculation = () => {
  /**
   * Official FFTT points table
   * Format: [minGap, maxGap, normalVictory, normalDefeat, abnormalVictory, abnormalDefeat]
   */
  const POINTS_TABLE = [
    [0, 24, 6, -5, 6, -5],
    [25, 49, 5.5, -4.5, 7, -6],
    [50, 99, 5, -4, 8, -7],
    [100, 149, 4, -3, 10, -8],
    [150, 199, 3, -2, 13, -10],
    [200, 299, 2, -1, 17, -12.5],
    [300, 399, 1, -0.5, 22, -16],
    [400, 499, 0.5, 0, 28, -20],
    [500, Infinity, 0, 0, 40, -29],
  ];

  /**
   * Convert FFTT ranking to points value
   * NC (Non Classé) = 500 points
   * Numbered rankings are actual points
   */
  const convertRankingToPoints = (ranking: string | number): number => {
    if (!ranking) return 500;

    if (typeof ranking === "string") {
      // Handle "NC" case
      if (ranking.toUpperCase() === "NC") return 500;

      // Try to parse as number
      const parsed = parseInt(ranking);
      return isNaN(parsed) ? 500 : parsed;
    }

    return ranking;
  };

  /**
   * Calculate points difference based on rankings
   */
  const calculateRankingGap = (
    playerRanking: number,
    opponentRanking: number,
  ): number => {
    return Math.abs(playerRanking - opponentRanking);
  };

  /**
   * Determine if victory/defeat is abnormal based on rankings
   * Abnormal victory: beating a higher-ranked player (player has FEWER points)
   * Abnormal defeat: losing to a lower-ranked player (player has MORE points)
   */
  const isAbnormalResult = (
    playerRanking: number,
    opponentRanking: number,
    victory: boolean,
  ): boolean => {
    if (victory) {
      // Abnormal victory: player has fewer points (worse ranking) than opponent
      return playerRanking < opponentRanking;
    } else {
      // Abnormal defeat: player has more points (better ranking) than opponent
      return playerRanking > opponentRanking;
    }
  };

  /**
   * Calculate points gained/lost for a single match
   */
  const calculateMatchPoints = (
    match: MatchResult,
  ): PointsCalculationResult => {
    const playerPoints = convertRankingToPoints(match.playerRanking);
    const opponentPoints = convertRankingToPoints(match.opponentRanking);

    const gap = calculateRankingGap(playerPoints, opponentPoints);
    const abnormal = isAbnormalResult(
      playerPoints,
      opponentPoints,
      match.victory,
    );

    // Find the appropriate row in the points table
    const tableRow = POINTS_TABLE.find((row) => gap >= row[0] && gap <= row[1]);

    if (!tableRow) {
      // Fallback for edge cases
      return {
        points: 0,
        isVictory: match.victory,
        isAbnormal: abnormal,
      };
    }

    let points: number;

    if (match.victory) {
      // Victory: use normal or abnormal victory points
      points = abnormal ? tableRow[4] : tableRow[2];
    } else {
      // Defeat: use normal or abnormal defeat points
      points = abnormal ? tableRow[5] : tableRow[3];
    }

    return {
      points,
      isVictory: match.victory,
      isAbnormal: abnormal,
    };
  };

  /**
   * Calculate total points from a list of matches
   */
  const calculateTotalPoints = (matches: MatchResult[]): number => {
    return matches.reduce((total, match) => {
      const result = calculateMatchPoints(match);
      return total + result.points;
    }, 0);
  };

  /**
   * Get points badge style based on total points
   */
  const getPointsBadgeStyle = (
    totalPoints: number,
  ): { color: string; text: string } => {
    if (totalPoints > 0) {
      return {
        color:
          "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        text: `+${totalPoints} pts`,
      };
    } else if (totalPoints < 0) {
      return {
        color: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
        text: `${totalPoints} pts`,
      };
    } else {
      return {
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
        text: "±0 pts",
      };
    }
  };

  return {
    convertRankingToPoints,
    calculateMatchPoints,
    calculateTotalPoints,
    getPointsBadgeStyle,
    isAbnormalResult,
  };
};
