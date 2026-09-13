# 22 — SECURITY ARCHITECTURE

## SmartProcure: Security Controls, OWASP Mitigation, Threat Model, and Hardening

---

## 1. Security Architecture Principles

1. **Zero-Trust Backend**: Every API endpoint explicitly authenticates, authorizes, and validates input payloads regardless of origin.
2. **Defense in Depth**: Multiple security layers (Edge Proxy Rate Limiting -> API Gateway Auth -> Service Domain Scoping -> DB Row Isolation -> Immutable Audit Logs).
3. **Data Protection at Rest & Transit**: TLS 1.3 enforced for all network hops; AES-256 encryption at rest for sensitive PII (Aadhaar, Bank Account Numbers).

---

## 2. Threat Model & Mitigation Matrix

| Threat Vector                  | Attack Scenario                                                          | Architectural Mitigation Strategy                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Account Takeover**           | Brute-force guessing farmer passwords or OTPs                            | Exponential rate limiting (3 OTPs / 10m); bcrypt cost factor 12; 30-min account lockout after 5 failed password attempts. |
| **Unauthorized Data Access**   | Farmer attempts reading another farmer's records by changing `id` in URL | Server-side `validateScope` middleware forcing `WHERE farmer_id = :authenticatedId` on every repository query.            |
| **Privilege Escalation**       | Farmer tampers JWT payload to claim `CENTRE_MANAGER` role                | RS256 asymmetric cryptographic signature verification on every access token; server re-verifies public key signature.     |
| **Token Theft / QR Re-use**    | Attacker screenshots or copies a farmer's QR token                       | Single-use QR token state transition (`ACTIVE` -> `USED`); HMAC-SHA256 signature verification at scan gate.               |
| **SQL Injection**              | Attacker injects malicious SQL payload into search filters               | Knex/pg parameterised queries exclusively; raw SQL string concatenation is strictly forbidden.                            |
| **Cross-Site Scripting (XSS)** | Attacker injects `<script>` into produce declaration fields              | React default JSX encoding; Content-Security-Policy (CSP) headers set via `Helmet.js`.                                    |
| **Cross-Site Request Forgery** | Attacker triggers state change via malicious link                        | JSON `Content-Type` requirement; SameSite=Strict cookies; Bearer JWT header authorization.                                |
| **Double Disbursement Fraud**  | Malicious officer double-submits payment initiation                      | Idempotency-Key tracking in Redis; DB unique constraint on `procurement_id` in `payments` table.                          |

---

## 3. Web Application Security Headers (Helmet.js Integration)

```javascript
// Express Security Headers Middleware Setup (app.js)
import helmet from "helmet";

export const configureSecurityHeaders = (app) => {
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://s3.amazonaws.com"],
        connectSrc: ["'self'", "wss:", "https:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    }),
  );
  app.use(
    helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }),
  );
};
```

---

## 4. Encryption Specification for Sensitive Data at Rest

Bank Account Numbers and Aadhaar details are encrypted in PostgreSQL using **AES-256-GCM** before database write:

```javascript
// Data Encryption Utility (utils/crypto.js)
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY_32_BYTES, "hex");

export const encryptSensitive = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
