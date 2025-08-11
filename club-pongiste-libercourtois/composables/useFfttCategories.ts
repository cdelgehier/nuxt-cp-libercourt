/**
 * Composable for FFTT category utilities
 * Client-side utilities for category decoding and styling
 */

// FFTT category mapping (mirrored from server)
const FFTT_CATEGORY_MAP: Record<string, string> = {
  // Seniors
  'S': 'Sénior',

  // Veterans (age-specific)
  'V': 'Vétéran',
  'V35': 'Vétéran 35',
  'V40': 'Vétéran 40',
  'V45': 'Vétéran 45',
  'V50': 'Vétéran 50',
  'V55': 'Vétéran 55',
  'V60': 'Vétéran 60',
  'V65': 'Vétéran 65',
  'V70': 'Vétéran 70',
  'V75': 'Vétéran 75',

  // Youth categories
  'P': 'Poussin',
  'P1': 'Poussin 1',
  'P2': 'Poussin 2',

  'B': 'Benjamin',
  'B1': 'Benjamin 1',
  'B2': 'Benjamin 2',

  'M': 'Minime',
  'M1': 'Minime 1',
  'M2': 'Minime 2',

  'C': 'Cadet',
  'C1': 'Cadet 1',
  'C2': 'Cadet 2',

  'J': 'Junior',
  'J1': 'Junior 1',
  'J2': 'Junior 2',
  'J3': 'Junior 3'
};

/**
 * FFTT category utilities composable
 * Provides functions to decode and style FFTT categories
 */
export const useFfttCategories = () => {

  /**
   * Decode FFTT category code to readable French name
   */
  const decodeFfttCategory = (categoryCode: string): string => {
    if (!categoryCode) {
      return 'Non renseigné';
    }

    // Direct match first
    if (FFTT_CATEGORY_MAP[categoryCode]) {
      return FFTT_CATEGORY_MAP[categoryCode];
    }

    // Pattern matching for age-specific veterans
    if (categoryCode.startsWith('V') && categoryCode.length > 1) {
      const age = categoryCode.substring(1);
      if (/^\d+$/.test(age)) {
        return `Vétéran ${age}`;
      }
    }

    // Pattern matching for numbered subcategories
    const match = categoryCode.match(/^([PBMCJS])(\d+)$/);
    if (match) {
      const [, letter, number] = match;
      const baseName = FFTT_CATEGORY_MAP[letter];
      if (baseName) {
        return `${baseName} ${number}`;
      }
    }

    // If no match found, return as-is
    return categoryCode;
  };

  /**
   * Get category type for styling/grouping purposes
   */
  const getCategoryType = (categoryCode: string): 'youth' | 'senior' | 'veteran' | 'unknown' => {
    if (!categoryCode) return 'unknown';

    const firstChar = categoryCode.charAt(0).toUpperCase();

    switch (firstChar) {
      case 'P':
      case 'B':
      case 'M':
      case 'C':
      case 'J':
        return 'youth';
      case 'S':
        return 'senior';
      case 'V':
        return 'veteran';
      default:
        return 'unknown';
    }
  };

  /**
   * Get category color classes for UI display
   */
  const getCategoryColor = (categoryCode: string): string => {
    const type = getCategoryType(categoryCode);

    switch (type) {
      case 'youth':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'senior':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'veteran':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  /**
   * Get category icon based on type
   */
  const getCategoryIcon = (categoryCode: string): string => {
    const type = getCategoryType(categoryCode);

    switch (type) {
      case 'youth':
        return '🌱'; // Youth/growing
      case 'senior':
        return '⚡'; // Active/energy
      case 'veteran':
        return '🏆'; // Experience/trophy
      default:
        return '📋'; // Generic/clipboard
    }
  };

  /**
   * Get age group for filtering: junior or adult
   * Juniors: Poussin + Benjamin + Minime + Cadet
   * Adults: Junior + Senior + Veteran
   */
  const getAgeGroup = (categoryCode: string): 'junior' | 'adult' | 'unknown' => {
    if (!categoryCode) return 'unknown';

    const normalizedCode = categoryCode.toUpperCase();

    // Juniors (enfants et jeunes jusqu'aux cadets)
    if (normalizedCode.startsWith('P') || // Poussin
        normalizedCode.startsWith('B') || // Benjamin
        normalizedCode.startsWith('M') || // Minime
        normalizedCode.startsWith('C')) { // Cadet
      return 'junior';
    }

    // Adults (juniors FFTT et plus)
    if (normalizedCode.startsWith('J') || // Junior
        normalizedCode.startsWith('S') || // Senior
        normalizedCode.startsWith('V')) { // Veteran
      return 'adult';
    }

    return 'unknown';
  };

  return {
    decodeFfttCategory,
    getCategoryType,
    getCategoryColor,
    getCategoryIcon,
    getAgeGroup
  };
};
