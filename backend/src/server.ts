import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { closeDatabase } from "./database";
import { initRedis, closeRedis } from "./database/redis";

let server: ReturnType<typeof app.listen>;

async function startServer() {
  try {
    // Initialize auxiliary infrastructure (Redis)
    await initRedis();

    server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 SmartProcure Backend API running on port ${env.PORT} [${env.NODE_ENV}]`,
      );
      logger.info(
        `👉 API Health Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`,
      );
      logger.info(
        `👉 API Readiness Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/ready`,
      );
    });
  } catch (err: any) {
    logger.error("Failed to start HTTP server:", { error: err.message });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed to new connections.");
      try {
        await closeDatabase();
        await closeRedis();
        logger.info(
          "Graceful shutdown completed successfully. Process exiting.",
        );
        process.exit(0);
      } catch (err: any) {
        logger.error("Error during graceful shutdown:", { error: err.message });
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after 10 seconds if lingering connections exist
  setTimeout(() => {
    logger.error(
      "Forced shutdown due to timeout on active connection cleanup.",
    );
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
