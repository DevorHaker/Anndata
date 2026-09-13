const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/smart_procure";

async function runMigrations() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("[MIGRATE] Connected to PostgreSQL database.");

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, "..", "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows: executed } = await client.query(
      "SELECT name FROM schema_migrations",
    );
    const executedSet = new Set(executed.map((r) => r.name));

    for (const file of files) {
      if (!executedSet.has(file)) {
        console.log(`[MIGRATE] Running migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf8");

        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        console.log(`[MIGRATE] Successfully executed: ${file}`);
      } else {
        console.log(`[MIGRATE] Skipping already applied migration: ${file}`);
      }
    }

    console.log("[MIGRATE] All database migrations completed successfully.");
  } catch (err) {
    console.error("[MIGRATE] Error running migrations:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
