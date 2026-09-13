import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let isRedisConnected = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis connection retry attempt ${times}, delaying ${delay}ms`);
    return delay;
  },
  lazyConnect: true,
});

redis.on("connect", () => {
  isRedisConnected = true;
  logger.info("Connected to Redis server successfully.");
});

redis.on("error", (err) => {
  isRedisConnected = false;
  logger.warn("Redis client error (operating in degraded state if optional):", {
    error: err.message,
  });
});

redis.on("close", () => {
  isRedisConnected = false;
});

export async function initRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err: any) {
    logger.warn(
      "Initial Redis connection failed (app will continue in degraded state for Redis features):",
      { error: err.message },
    );
  }
}

export async function checkRedisHealth(): Promise<{
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  message?: string;
}> {
  const start = Date.now();
  try {
    const response = await redis.ping();
    const latencyMs = Date.now() - start;
    if (response === "PONG") {
      return { status: "ok", latencyMs };
    }
    return { status: "degraded", message: "Unexpected ping response" };
  } catch (err: any) {
    return { status: "degraded", message: err.message || "Redis unreachable" };
  }
}

export function getRedisClient(): Redis | null {
  return isRedisConnected ? redis : null;
}

export async function closeRedis(): Promise<void> {
  if (isRedisConnected) {
    logger.info("Disconnecting Redis client...");
    await redis.quit();
    logger.info("Redis client disconnected.");
  }
}
