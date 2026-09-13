# 26 — ENVIRONMENT CONFIGURATION ARCHITECTURE

## SmartProcure: Environment Variables Schema, Secrets Management, and `.env` Specifications

---

## 1. Environment Variable Management Rules

1. **Zero Hardcoded Secrets**: Secrets, database passwords, JWT private keys, and API tokens **MUST NEVER** be hardcoded in codebase files or committed to Git.
2. **Schema Validation on Boot**: The backend application uses **Zod** (`config/env.js`) to validate all environment variables at startup. If any required variable is missing or invalid, the process crashes immediately with a clear configuration error.
3. **Environment Isolation**: Distinct configuration files exist for `.env.development`, `.env.test`, `.env.staging`, `.env.production`.

---

## 2. Master Environment Variables Specification (`.env.example`)

```ini
# ==============================================================================
# SMARTPROCURE MASTER ENVIRONMENT CONFIGURATION TEMPLATE
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. APPLICATION CORE
# ------------------------------------------------------------------------------
NODE_ENV=development                       # Options: development, test, staging, production
PORT=5000                                  # API Server Listening Port
APP_URL=http://localhost:5000              # Canonical Backend URL
FRONTEND_URL=http://localhost:3000         # CORS Allowed Origin
LOG_LEVEL=debug                            # Options: fatal, error, warn, info, debug, trace

# ------------------------------------------------------------------------------
# 2. DATABASE CONFIGURATION (POSTGRESQL)
# ------------------------------------------------------------------------------
DATABASE_URL=postgres://smartprocure_admin:dev_secure_password_123@localhost:5432/smartprocure_dev
DB_POOL_MIN=2                              # Connection Pool Minimum
DB_POOL_MAX=20                             # Connection Pool Maximum
DB_STATEMENT_TIMEOUT_MS=10000              # Statement Execution Timeout

# ------------------------------------------------------------------------------
# 3. CACHE & QUEUE CONFIGURATION (REDIS)
# ------------------------------------------------------------------------------
REDIS_URL=redis://:redis_secure_password_123@localhost:6379
REDIS_DB=0                                 # Logical Redis Database Number

# ------------------------------------------------------------------------------
# 4. SECURITY & CRYPTOGRAPHY
# ------------------------------------------------------------------------------
JWT_ACCESS_SECRET=dev_jwt_access_secret_min_32_chars_long_123456
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_min_32_chars_long_123456
JWT_ACCESS_TTL_SECONDS=900                 # 15 Minutes
JWT_REFRESH_TTL_SECONDS=604800             # 7 Days
ENCRYPTION_KEY_32_BYTES=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef # 64 Hex Chars

# ------------------------------------------------------------------------------
# 5. EXTERNAL INTEGRATION ADAPTERS (SWITCHES & MOCKS)
# ------------------------------------------------------------------------------
# Provider Switches (Options: MOCK, PRODUCTION)
SMS_PROVIDER=MOCK
EMAIL_PROVIDER=MOCK
PAYMENT_PROVIDER=MOCK
MAPS_PROVIDER=HAVERSINE
STORAGE_PROVIDER=LOCAL

# Provider Credentials (Populated in Staging/Production)
TWILIO_ACCOUNT_SID=                        # Required if SMS_PROVIDER=TWILIO
TWILIO_AUTH_TOKEN=                         # Required if SMS_PROVIDER=TWILIO
TWILIO_FROM_NUMBER=                        # Required if SMS_PROVIDER=TWILIO
AWS_SES_REGION=us-east-1                  # Required if EMAIL_PROVIDER=SES
PAYMENT_WEBHOOK_SECRET=dev_webhook_secret_key_123

# 6. OBJECT STORAGE CONFIGURATION (S3 / MINIO)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_NAME=smartprocure-documents
S3_ACCESS_KEY=minio_admin
S3_SECRET_KEY=minio_secure_password_123
S3_REGION=us-east-1
```

---

## 3. Server Schema Validation Code (`config/env.js`)

```javascript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .default("5000"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ENCRYPTION_KEY_32_BYTES: z.string().length(64),
  SMS_PROVIDER: z.enum(["MOCK", "TWILIO", "MSG91"]).default("MOCK"),
  PAYMENT_PROVIDER: z.enum(["MOCK", "PRODUCTION"]).default("MOCK"),
});

export const env = envSchema.parse(process.env);
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
