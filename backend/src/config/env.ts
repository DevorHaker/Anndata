import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from root or local .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/smart_procure"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z
    .string()
    .min(10)
    .default("dev-smart-procure-super-secret-key-change-in-prod"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid Environment Variables Configuration:");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  throw new Error(
    "Invalid environment configuration. Application start aborted.",
  );
}

export const env = _env.data;
