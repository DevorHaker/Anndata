import { Request, Response } from "express";
import { NotFoundError } from "../utils/errors";
import { sendError } from "../utils/response";

export function notFoundHandlerMiddleware(
  req: Request,
  res: Response,
): Response {
  const err = new NotFoundError(
    `Endpoint ${req.method} ${req.originalUrl} does not exist`,
  );
  return sendError(res, err.statusCode, err.errorCode, err.message);
}
