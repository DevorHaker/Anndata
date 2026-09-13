import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from root or local .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "staging", "production"])
      .default("development"),
    PORT: z.coerce.number().default(5000),
    API_PREFIX: z.string().default("/api/v1"),
    DATABASE_URL: z
      .string()
      .default("postgresql://postgres:postgres@localhost:5432/smart_procure"),
    REDIS_URL: z.string().optional().default("redis://localhost:6379"),
    JWT_SECRET: z
      .string()
      .min(10)
      .default("dev-smart-procure-super-secret-key-change-in-prod"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CORS_ORIGIN: z.string().default("*"),
    LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
    SMS_PROVIDER_MODE: z.enum(["mock", "disabled", "twilio", "sns"]).default("mock"),
    PAYMENT_PROVIDER_MODE: z.enum(["mock", "disabled", "pfms", "npci"]).default("mock"),
    FEATURE_AI_RECOMMENDATIONS: z.coerce.boolean().default(true),
    FEATURE_VOICE_ASSISTANCE: z.coerce.boolean().default(true),
    // Vercel-injected environment variables (optional — only present on Vercel)
    VERCEL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === "production" && data.JWT_SECRET === "dev-smart-procure-super-secret-key-change-in-prod") {
        console.warn("⚠️ [SECURITY WARNING]: Using default dev JWT_SECRET in production. Set JWT_SECRET in your host environment variables for production security.");
      }
      if (data.NODE_ENV === "production" && data.CORS_ORIGIN === "*") {
        console.warn("⚠️ [CORS WARNING]: CORS_ORIGIN is set to '*' in production. Consider setting your frontend Vercel URL in environment variables.");
      }
      return true;
    }
  );

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid Environment Variables Configuration:");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  throw new Error(
    "Invalid environment configuration. Application start aborted.",
  );
}

export const env = _env.data;
