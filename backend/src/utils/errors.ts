export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: any[];

  constructor(
    errorCode: string,
    message: string,
    statusCode = 500,
    details: any[] = []
  ) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Request validation failed",
    errorCode = "VALIDATION_ERROR",
    details: any[] = []
  ) {
    super(errorCode, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message = "Authentication credentials invalid or missing",
    errorCode = "UNAUTHORIZED",
    details: any[] = []
  ) {
    super(errorCode, message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to access this resource",
    errorCode = "FORBIDDEN",
    details: any[] = []
  ) {
    super(errorCode, message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "Requested resource not found",
    errorCode = "NOT_FOUND",
    details: any[] = []
  ) {
    super(errorCode, message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "Resource conflict occurred",
    errorCode = "CONFLICT",
    details: any[] = []
  ) {
    super(errorCode, message, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message = "Too many requests. Please try again later.",
    errorCode = "RATE_LIMIT_EXCEEDED",
    details: any[] = []
  ) {
    super(errorCode, message, 429, details);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message = "A database operational error occurred",
    errorCode = "DATABASE_ERROR",
    details: any[] = []
  ) {
    super(errorCode, message, 500, details);
  }
}

