import { Router, Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import { checkDatabaseHealth } from "../database";
import { checkRedisHealth } from "../database/redis";

export const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
  return sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
});

healthRouter.get("/ready", async (_req: Request, res: Response) => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const isReady = dbHealth.status === "ok";
  const statusCode = isReady ? 200 : 503;

  const payload = {
    status: isReady ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    dependencies: {
      postgres: dbHealth,
      redis: redisHealth,
    },
  };

  if (isReady) {
    return sendSuccess(res, payload, statusCode);
  } else {
    return sendError(
      res,
      statusCode,
      "SERVICE_UNAVAILABLE",
      "Core dependencies are not ready",
      [payload],
    );
  }
});
