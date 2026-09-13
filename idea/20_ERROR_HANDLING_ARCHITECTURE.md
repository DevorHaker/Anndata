# 20 — ERROR HANDLING ARCHITECTURE

## SmartProcure: Custom Error Hierarchy, HTTP Status Mapping, and Global Exception Handlers

---

## 1. Error Handling Philosophy

1. **Deterministic Error Responses**: Every API error returns a predictable JSON payload containing a machine-readable `code`, a human-readable `message`, optional `details`, and the request `requestId`.
2. **Zero Information Disclosure**: Internal stack traces, raw SQL error messages, or internal infrastructure IP addresses **MUST NEVER** be exposed to clients in API responses.
3. **Structured Classification**: Distinguishes between **Expected Business Failures** (e.g., Slot Full, Invalid OTP) and **Unexpected System Failures** (e.g., DB Connection Lost).

---

## 2. Base Application Error Class Hierarchy

```
                               ┌────────────────────────────────┐
                               │       AppError (Base Class)    │
                               │   - statusCode                 │
                               │   - errorCode                  │
                               │   - isOperational              │
                               └───────────────┬────────────────┘
                                               │
         ┌─────────────────────────────────────┼─────────────────────────────────────┐
         ▼                                     ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│ ValidationError  │                  │ BusinessRuleError│                  │  AuthError /     │
│ (HTTP 400/422)   │                  │ (HTTP 409/422)   │                  │  ForbiddenError  │
└──────────────────┘                  └──────────────────┘                  │  (HTTP 401/403)  │
                                                                            └──────────────────┘
```

### Custom Error Class Implementation (`utils/errors.js`)

```javascript
export class AppError extends Error {
  constructor(message, statusCode, errorCode, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Flag distinguishing expected vs unexpected runtime errors
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = []) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(errorCode, message, details = []) {
    super(message, 409, errorCode, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName = "Resource") {
    super(`${resourceName} not found`, 404, "RESOURCE_NOT_FOUND");
  }
}
```

---

## 3. Master Error Code & HTTP Status Mapping Matrix

| Error Code              | HTTP Status | Description / Cause                        | User-Facing Actionable Message                       |
| ----------------------- | ----------- | ------------------------------------------ | ---------------------------------------------------- |
| `VALIDATION_ERROR`      | 400 / 422   | Input schema validation failed (Zod)       | "Please check your inputs and try again."            |
| `UNAUTHENTICATED`       | 401         | Missing or expired JWT token               | "Session expired. Please log in again."              |
| `FORBIDDEN_ROLE`        | 403         | User role lacks access permission          | "You do not have permission to perform this action." |
| `FORBIDDEN_SCOPE`       | 403         | User attempting cross-tenant/centre access | "Access denied to requested centre data."            |
| `RESOURCE_NOT_FOUND`    | 404         | Entity ID does not exist in database       | "The requested record could not be found."           |
| `SLOT_FULL`             | 409         | Booking attempt on depleted capacity slot  | "This slot is now full. Please pick another slot."   |
| `ACTIVE_BOOKING_EXISTS` | 409         | Farmer already has booking on date         | "You already have an active booking on this date."   |
| `TOKEN_INVALID`         | 400         | QR token signature or payload corrupt      | "Invalid QR token. Please verify token display."     |
| `TOKEN_EXPIRED`         | 400         | QR token slot time window passed           | "Token expired. Please contact centre manager."      |
| `RATE_LIMIT_EXCEEDED`   | 429         | Exceeded maximum requests per minute       | "Too many requests. Please wait a moment."           |
| `INTERNAL_SERVER_ERROR` | 500         | Unhandled exception or DB crash            | "An unexpected error occurred. Please try again."    |

---

## 4. Global Express Error Handling Middleware (`middleware/errorHandler.js`)

```javascript
import { AppError } from "../utils/errors";
import { pinoLogger } from "../config/logger";

export const globalErrorHandler = (err, req, res, next) => {
  const requestId = req.headers["x-request-id"] || "N/A";

  // 1. Operational (Expected) Errors: Return formatted JSON directly
  if (err instanceof AppError && err.isOperational) {
    pinoLogger.warn(
      { err, requestId, url: req.originalUrl },
      `Operational Error: ${err.errorCode}`,
    );
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 2. Unexpected Programmer / Runtime Crashes (500)
  pinoLogger.error(
    { err, requestId, url: req.originalUrl },
    "CRITICAL UNHANDLED ERROR",
  );

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        "A technical error occurred on our server. Our team has been notified.",
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
};
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
