// API endpoint to serve sponsors data
// Uses static import to work reliably in all environments (local and Netlify)
import sponsorsData from "../../public/sponsors.json";

export default defineEventHandler(() => {
  return sponsorsData;
});
