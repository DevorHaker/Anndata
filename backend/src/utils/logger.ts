import winston from "winston";
import { env } from "../config/env";

const sensitiveFields = [
  "password",
  "password_hash",
  "otp",
  "jwt",
  "secret",
  "aadhaar",
  "account_number",
  "ifsc",
];

const maskSensitiveData = winston.format((info) => {
  if (typeof info.message === "object") {
    info.message = redactObject(info.message);
  }
  return info;
});

function redactObject(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);

  const redacted: any = {};
  for (const key of Object.keys(obj)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object") {
      redacted[key] = redactObject(obj[key]);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    maskSensitiveData(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.json(),
  ),
  defaultMeta: { service: "smart-procure-backend" },
  transports: [
    new winston.transports.Console({
      format:
        env.NODE_ENV === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, requestId, ...meta }) => {
                  const reqIdStr = requestId ? ` [ReqID: ${requestId}]` : "";
                  const metaStr =
                    Object.keys(meta).length > 1
                      ? ` ${JSON.stringify(meta)}`
                      : "";
                  return `${timestamp} [${level}]${reqIdStr}: ${typeof message === "object" ? JSON.stringify(message) : message}${metaStr}`;
                },
              ),
            )
          : winston.format.json(),
    }),
  ],
});
