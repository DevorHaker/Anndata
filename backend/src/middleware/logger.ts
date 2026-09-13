import morgan from "morgan";
import { logger } from "../utils/logger";

export const httpLoggerMiddleware = morgan(
  (tokens, req, res) => {
    const requestId = (req as any).id || res.getHeader("x-request-id") || "-";
    return JSON.stringify({
      requestId,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      responseTimeMs: Number(tokens["response-time"](req, res)),
      contentLength: tokens.res(req, res, "content-length") || "0",
    });
  },
  {
    stream: {
      write: (message: string) => {
        try {
          const logData = JSON.parse(message);
          logger.http(
            `HTTP ${logData.method} ${logData.url} ${logData.status}`,
            logData,
          );
        } catch {
          logger.http(message.trim());
        }
      },
    },
  },
);
