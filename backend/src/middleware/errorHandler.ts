import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { sendError } from "../utils/response";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  const requestId =
    (req as any).id || res.getHeader("x-request-id") || "unknown";

  if (err instanceof AppError) {
    logger.warn(`Handled AppError [${err.errorCode}]: ${err.message}`, {
      requestId,
      statusCode: err.statusCode,
      details: err.details,
    });
    return sendError(
      res,
      err.statusCode,
      err.errorCode,
      err.message,
      err.details,
    );
  }

  // Handle SyntaxError / JSON parse errors
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as any).status === 400
  ) {
    return sendError(
      res,
      400,
      "INVALID_JSON",
      "Malformed JSON payload provided in request body",
    );
  }

  // Handle generic unhandled internal errors
  logger.error(`Unhandled Server Error: ${err.message}`, {
    requestId,
    stack: err.stack,
  });

  const message =
    env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred"
      : err.message || "Internal Server Error";

  return sendError(res, 500, "INTERNAL_SERVER_ERROR", message);
}
