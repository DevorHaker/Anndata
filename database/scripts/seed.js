const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/smart_procure";

async function runSeeds() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("[SEED] Connected to PostgreSQL database.");

    const seedsDir = path.join(__dirname, "..", "seeds");
    if (!fs.existsSync(seedsDir)) {
      console.log("[SEED] No seeds directory found.");
      return;
    }

    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`[SEED] Executing seed file: ${file}...`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
      console.log(`[SEED] Successfully executed seed file: ${file}`);
    }

    console.log("[SEED] All database seeds executed successfully.");
  } catch (err) {
    console.error("[SEED] Error executing seeds:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeeds();
