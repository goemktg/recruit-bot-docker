import { config } from "dotenv";
import path from "path";

const result = config({ path: path.join(__dirname, "../..", ".env") });
if (result.parsed == undefined) {
  throw new Error("Cannot load environment variables file.");
}
