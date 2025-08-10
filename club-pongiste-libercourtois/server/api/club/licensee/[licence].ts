// server/api/club/licensee/[licence].ts
// Get detailed information for a specific licensee using xml_licence_b.php

import { SmartPingAPI } from '~/server/utils/smartping';

// Import composable functions directly
import { useFfttCategories } from '~/composables/useFfttCategories';

export default defineEventHandler(async (event) => {
  const licence = getRouterParam(event, 'licence');

  // Use FFTT categories composable
  const { decodeFfttCategory, getCategoryType, getCategoryColor } = useFfttCategories();

  if (!licence) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Licence number is required'
    });
  }

  try {
    // Get environment variables for FFTT authentication
    const appCode = process.env.SMARTPING_APP_CODE;
    const password = process.env.SMARTPING_PASSWORD;
    const email = process.env.SMARTPING_EMAIL;

    if (!appCode || !password || !email) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing SmartPing configuration'
      });
    }

    // Initialize SmartPing API with proper authentication
    const smartPing = new SmartPingAPI(appCode, password, email);

    // Get detailed licensee information
    const result = await smartPing.getLicenseeDetails(licence);

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch licensee details: ${result.error}`
      });
    }

    // Enhance licensee data with decoded category information
    const licensee = result.data;
    if (licensee) {
      // Add readable category name from FFTT category code
      const categoryDecoded = decodeFfttCategory(licensee.cat || '');
      const categoryType = getCategoryType(licensee.cat || '');
      const categoryColor = getCategoryColor(licensee.cat || '');

      return {
        success: true,
        licensee: {
          ...licensee,
          categoryDecoded,     // "Vétéran 45" instead of "V45"
          categoryType,        // "veteran", "youth", "senior", "unknown"
          categoryColor        // Tailwind CSS classes for styling
        }
      };
    }

    return {
      success: true,
      licensee: result.data
    };

  } catch (error) {
    console.error('Licensee details API error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});
