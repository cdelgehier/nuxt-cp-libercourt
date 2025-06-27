export default defineEventHandler(async (event) => {
  try {
    // Import club configuration data from JSON file
    const configData = await import("~/content/club/config.json");

    // Make sure we have the correct data structure
    const config = configData.default || configData;

    // Check that essential data is present
    if (!config.club || !config.location) {
      throw new Error("Club configuration is incomplete");
    }

    return config;
  } catch (error) {
    console.error("Error loading club configuration:", error);

    // Return complete default configuration on error
    return {
      club: {
        name: "Club Pongiste Libercourtois",
        id: "07620112",
        salle: "Salle Deladerriere",
        complexe: "Complexe Sportif Léo Lagrange",
        email: "cplibercourt@gmail.com",
        phone: "06 60 05 12 41",
        website: "cplibercourt.fr",
        description:
          "Club de tennis de table à Libercourt - Passion, convivialité et performance depuis 1970",
      },
      social: {
        facebook: {
          name: "Facebook",
          url: "https://www.facebook.com/profile.php?id=100066855954701",
          icon: "i-simple-icons-facebook",
          platform: "facebook",
        },
      },
      location: {
        name: "Salle Deladerriere - Complexe Sportif Léo Lagrange",
        salle: "Salle Deladerriere",
        complexe: "Complexe Sportif Léo Lagrange",
        street: "Complexe Sportif Léo Lagrange",
        postalCode: "62820",
        city: "Libercourt",
        country: "France",
        coordinates: {
          lat: 50.48185408012125,
          lng: 3.017099247377654,
        },
        googleMapsUrl:
          "https://www.google.com/maps/place/Salle+Deladerriere,+Complexe+Sportif+Leo+Lagrange/@50.48185408012125,3.017099247377654,17z",
      },
    };
  }
});
