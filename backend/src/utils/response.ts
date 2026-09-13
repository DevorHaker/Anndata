import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  requestId?: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, any>,
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details: any[] = [],
): Response {
  const requestId =
    (res.getHeader("x-request-id") as string) || (res.req as any)?.id;
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    ...(requestId ? { requestId } : {}),
  };
  return res.status(statusCode).json(payload);
}
