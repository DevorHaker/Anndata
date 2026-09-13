import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existingId = req.header("x-request-id");
  const requestId = existingId || uuidv4();
  (req as any).id = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
