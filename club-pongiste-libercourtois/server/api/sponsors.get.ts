// API endpoint to serve sponsors data
// Returns JSON data from the public folder
import fs from "fs";
import path from "path";

export default defineEventHandler(() => {
  // Read sponsors.json from public folder
  const filePath = path.join(process.cwd(), "public", "sponsors.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileContent);

  return data;
});
