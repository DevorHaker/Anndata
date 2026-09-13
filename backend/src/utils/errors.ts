export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: any[];

  constructor(
    errorCode: string,
    message: string,
    statusCode = 500,
    details: any[] = [],
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
  constructor(errorCode = "VALIDATION_ERROR", message = "Request validation failed", details: any[] = []) {
    super(errorCode, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(errorCode = "UNAUTHORIZED", message = "Authentication credentials invalid or missing", details: any[] = []) {
    super(errorCode, message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(errorCode = "FORBIDDEN", message = "You do not have permission to access this resource", details: any[] = []) {
    super(errorCode, message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(errorCode = "NOT_FOUND", message = "Requested resource not found", details: any[] = []) {
    super(errorCode, message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(errorCode = "CONFLICT", message = "Resource conflict occurred", details: any[] = []) {
    super(errorCode, message, 409, details);
  }
}

export class RateLimitError extends AppError {
  constructor(errorCode = "RATE_LIMIT_EXCEEDED", message = "Too many requests. Please try again later.", details: any[] = []) {
    super(errorCode, message, 429, details);
  }
}

export class DatabaseError extends AppError {
  constructor(errorCode = "DATABASE_ERROR", message = "A database operational error occurred", details: any[] = []) {
    super(errorCode, message, 500, details);
  }
}
