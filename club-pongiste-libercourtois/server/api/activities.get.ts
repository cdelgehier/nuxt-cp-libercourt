// API endpoint to serve activities data
// Uses static import to work reliably in all environments (local and Netlify)
import activitiesData from "../../public/activities.json";

export default defineEventHandler(() => {
  return activitiesData;
});
