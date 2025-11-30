// API endpoint to serve activities data
// Returns JSON data from the public folder
import fs from "fs";
import path from "path";

export default defineEventHandler(() => {
  // Read activities.json from public folder
  const filePath = path.join(process.cwd(), "public", "activities.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileContent);

  return data;
});
