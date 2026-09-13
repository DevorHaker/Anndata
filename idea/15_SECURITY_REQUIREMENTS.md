# 15 — SECURITY REQUIREMENTS

## SmartProcure: Comprehensive Security Specification

---

## 1. Security Design Principles

1. **Defence in Depth:** Security is enforced at multiple layers — API gateway, application middleware, service layer, and database.
2. **Least Privilege:** Every role and service has only the permissions necessary for its function.
3. **Zero Trust:** No network segment is implicitly trusted; all requests are authenticated and authorised.
4. **Fail Secure:** On security control failure, the system defaults to denying access.
5. **Auditability First:** Every sensitive operation must be logged before it is executed.
6. **No Security by Obscurity:** Security must rely on proven mechanisms, not hidden implementation details.

---

## 2. Authentication Security

### 2.1 Password Security

| Requirement              | Standard                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| Hashing algorithm        | bcrypt with minimum cost factor 12                                |
| Salt                     | Per-user automatic salt (built into bcrypt)                       |
| Password complexity      | Minimum 8 characters; 1 uppercase; 1 numeric; 1 special character |
| Password history         | Prevent reuse of last 5 passwords                                 |
| Minimum password age     | 24 hours between changes (prevent rapid cycling)                  |
| Password in transmission | HTTPS only; never logged                                          |

### 2.2 OTP Security

| Requirement    | Standard                                                         |
| -------------- | ---------------------------------------------------------------- |
| OTP length     | Minimum 6 digits                                                 |
| OTP TTL        | 5 minutes                                                        |
| OTP reuse      | Single-use; invalidated on first verification                    |
| OTP generation | Cryptographically secure random generation (not sequential)      |
| Rate limiting  | Max 3 OTP requests per mobile per 10 minutes                     |
| OTP delivery   | Over encrypted channel (HTTPS/TLS for API; SMS via provider TLS) |

### 2.3 JWT Security

| Requirement            | Standard                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| Signing algorithm      | RS256 (RSA asymmetric) in production; HS256 acceptable for development       |
| Access token TTL       | 15 minutes                                                                   |
| Refresh token TTL      | 7 days                                                                       |
| Refresh token storage  | HttpOnly Secure cookie or encrypted local storage                            |
| Refresh token rotation | New refresh token issued on every refresh; old invalidated                   |
| Token revocation       | Refresh tokens stored in Redis with TTL; explicit logout removes entry       |
| Token payload          | Contains: user_id, role, session_id, issued_at, expires_at; no sensitive PII |
| Algorithm confusion    | `alg: none` rejected; only RS256/HS256 accepted                              |
| Token validation       | Every protected endpoint validates signature, expiry, and session validity   |

### 2.4 Session Management

| Requirement                 | Standard                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| Maximum concurrent sessions | 3 per user (configurable)                                             |
| Session metadata stored     | session_id, user_id, created_at, last_used_at, ip_address, user_agent |
| Inactive session timeout    | 60 minutes of inactivity                                              |
| Explicit logout             | Invalidates current session token in Redis                            |
| Session data storage        | Redis with TTL; not in JWT itself                                     |

---

## 3. Authorisation and Access Control

### 3.1 RBAC Enforcement

| Layer         | Enforcement Method                                                       |
| ------------- | ------------------------------------------------------------------------ |
| API Gateway   | Role-based route guards — reject unknown roles for protected paths       |
| Middleware    | `requireRole([ROLES])` middleware on every protected endpoint            |
| Service Layer | Secondary role check + data scope validation                             |
| Database      | Row-level filtering by actor's scope (centre_id, district_id, farmer_id) |

### 3.2 Data Scope Isolation

Every data query must be parameterised with the actor's authorised scope:

- `FARMER` queries: always filtered by `farmer_id = actor.userId`
- `OFFICER` / `MANAGER` queries: always filtered by `centre_id = actor.assignedCentreId`
- `DISTRICT_ADMIN` queries: always filtered by `district_id IN (actor.assignedDistricts)`
- `SYSTEM_ADMIN`: no scope filter; all cross-scope access audit-logged

### 3.3 Vertical Privilege Escalation Prevention

- Role is embedded in JWT but re-validated against database on every sensitive operation
- Role in JWT is for routing only; not used alone for access decisions
- Role changes in database immediately invalidate existing sessions (via Redis check)

---

## 4. Input Validation and Output Encoding

### 4.1 Input Validation

| Requirement          | Standard                                                       |
| -------------------- | -------------------------------------------------------------- |
| Validation location  | Server-side always; client-side as UX (not security)           |
| Validation library   | Joi (Node.js) or equivalent schema validation                  |
| Unknown fields       | Strip unknown fields from request bodies                       |
| Type enforcement     | All fields type-checked; numeric fields reject strings         |
| Length limits        | All text fields have defined maximum lengths                   |
| Enum validation      | Enum fields reject values not in defined set                   |
| Date/time validation | ISO 8601 format enforced; future/past date constraints applied |

### 4.2 SQL Injection Prevention

| Requirement          | Standard                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| Query method         | Parameterised queries only; no string concatenation                      |
| ORM/Query builder    | Knex.js or TypeORM with parameterised queries                            |
| Dynamic table/column | Never built from user input                                              |
| Database user        | Application DB user has no DDL permissions (no CREATE TABLE, DROP, etc.) |

### 4.3 XSS Prevention

| Requirement             | Standard                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| Output encoding         | All user-supplied content HTML-encoded before rendering                  |
| Content Security Policy | CSP header: `default-src 'self'; script-src 'self'; object-src 'none'`   |
| React XSS               | Use `textContent` / JSX text nodes; `dangerouslySetInnerHTML` prohibited |
| Rich text               | If any rich text input is needed, sanitised with DOMPurify server-side   |

### 4.4 CSRF Protection

| Requirement             | Standard                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| SPA pattern             | JWT in HttpOnly Secure cookie with SameSite=Strict                       |
| API-only                | REST API with JWT bearer token is inherently CSRF-safe for JSON requests |
| State-changing requests | Require `Content-Type: application/json` header (blocks HTML form CSRF)  |
| CORS policy             | Strict CORS allowlist; no wildcard origins in production                 |

---

## 5. File Upload Security

| Requirement           | Standard                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Allowed file types    | Only: PDF, JPG, PNG for documents                                                                     |
| MIME type validation  | Validate MIME type from file magic bytes, not file extension                                          |
| File size limit       | Maximum 5 MB per file                                                                                 |
| Storage               | Object storage (e.g., AWS S3, MinIO); not on application server filesystem                            |
| Storage access        | Signed URLs with short TTL (15 minutes) for document retrieval                                        |
| Antivirus             | Uploaded files scanned before storing (ClamAV or provider-native)                                     |
| Filename sanitisation | Original filename never used; UUID-based storage key generated                                        |
| Direct upload         | Files uploaded directly to object storage via pre-signed URL (never through API server in production) |

---

## 6. API Security

| Requirement                    | Standard                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| HTTPS only                     | HTTP requests redirected to HTTPS (301)                                                |
| HTTP Strict Transport Security | HSTS max-age=31536000; includeSubDomains                                               |
| Rate limiting                  | Per-IP: 100 req/min; Per-user: 60 req/min; Auth endpoints: 10 req/min                  |
| Rate limit headers             | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` returned                   |
| API gateway                    | Requests pass through API gateway before reaching application                          |
| Request size limit             | Maximum 1 MB request body                                                              |
| Slow down on repeated failures | Progressive delay after 3 failed auth attempts before lockout                          |
| Security headers               | Helmet.js (Node.js) to set all security response headers                               |
| CORS                           | Allowed origins: explicit whitelist; no `Access-Control-Allow-Origin: *` in production |

---

## 7. Secrets Management

| Requirement               | Standard                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Secret storage            | Environment variables from a secrets manager (AWS Secrets Manager, HashiCorp Vault, or `.env` for development only) |
| Secret in code            | Zero tolerance — no secrets, passwords, or API keys in source code                                                  |
| Secret in version control | `.env` files excluded via `.gitignore`                                                                              |
| Secret rotation           | JWT signing keys rotatable without downtime (grace period for old keys)                                             |
| Token secret              | `TOKEN_SIGNING_SECRET` for HMAC token signatures; rotated quarterly                                                 |
| Log scrubbing             | Secrets must not appear in any log output                                                                           |
| Environment separation    | Development, staging, and production use completely separate secrets                                                |

---

## 8. Sensitive Data Protection

| Data                | Protection Mechanism                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Password            | bcrypt hash; never stored plaintext; never logged                                                     |
| Aadhaar number      | AES-256 encryption at rest; last 4 digits shown only                                                  |
| Bank account number | AES-256 encryption at rest; last 4 digits shown in API responses                                      |
| JWT signing secret  | Stored in secrets manager; never in code                                                              |
| Token HMAC secret   | Stored in secrets manager; centre device caches derived key daily                                     |
| Document files      | Object storage with access control; signed URLs only                                                  |
| Payment data        | PCI-DSS considerations; bank details only decrypted at payment initiation, then discarded from memory |

---

## 9. Account Security Features

### 9.1 Account Lockout

| Trigger                                                             | Lockout Duration               | Recovery                                     |
| ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------- |
| 5 consecutive failed logins                                         | 30 minutes                     | Auto-unlock after TTL or manual admin unlock |
| Account locked > 3 times in 24 hours                                | 4 hours                        | Manual admin unlock required                 |
| Suspected brute force (rate: > 10 attempts per minute from same IP) | IP blocked (API gateway level) | Admin review                                 |

### 9.2 Suspicious Activity Detection

Events logged and reviewed as security alerts:

- Multiple failed OTP attempts for the same account
- Login from unusual geographic location (Phase 2: with geolocation data)
- Multiple token fraud attempts (FRAUD_FLAGGED tokens)
- Bulk data extraction (unusually high API query rate)
- Admin account performing bulk state changes

---

## 10. Audit Logging from a Security Perspective

All of the following must be security-audit-logged:

| Security Event                  | Log Content                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| Successful login                | actor_id, IP, user_agent, timestamp                               |
| Failed login                    | attempted identifier (without revealing if exists), IP, timestamp |
| Account lockout                 | actor_id, attempt_count, IP, lockout_until                        |
| Password change                 | actor_id, method (self/admin), timestamp                          |
| Role change                     | System Admin ID, target actor_id, old_role, new_role, timestamp   |
| Admin override                  | admin_id, entity_type, entity_id, override_reason, timestamp      |
| Token fraud attempt             | token_id, booking_id, scanner_ip, timestamp                       |
| Data export                     | actor_id, export_type, scope, record_count, timestamp             |
| File access (document download) | actor_id, document_id, farmer_id, timestamp, signed_url issued    |

---

## 11. Infrastructure Security

| Requirement         | Standard                                                                        |
| ------------------- | ------------------------------------------------------------------------------- |
| Network isolation   | Application servers in private subnet; only load balancer exposed publicly      |
| Database exposure   | Database not accessible from public internet                                    |
| Redis exposure      | Redis not accessible from public internet                                       |
| SSH access          | Key-based only; password SSH disabled                                           |
| Firewall            | Inbound: 80 (redirect), 443 only; outbound: minimal required services           |
| OS hardening        | Minimal OS packages; unnecessary services disabled                              |
| Container security  | Non-root user in containers; read-only filesystem where possible                |
| Dependency updates  | Automated security patch notification; critical patches applied within 48 hours |
| Intrusion detection | Cloud-provider IDS/IPS enabled; alerts reviewed daily                           |

---

## 12. Security for Specific Operations

| Operation                         | Who Can Perform                                    | Required Authorisation         | What Must Be Logged                           |
| --------------------------------- | -------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| Create user account (staff)       | Manager / System Admin                             | Role permission                | Creator, new account, role, timestamp         |
| Change user role                  | System Admin only                                  | System Admin role              | Changer, target, old role, new role           |
| Manual check-in override          | Manager only                                       | Manager role + reason          | Manager ID, farmer ID, reason, timestamp      |
| Weight/quality correction         | Officer (submit) + Manager (approve)               | Dual authorisation             | Original record, correction, approver, reason |
| Procurement approval (high-value) | Manager only                                       | Manager role + threshold check | Manager ID, amount, approval timestamp        |
| Admin system override             | System Admin only                                  | System Admin role + reason     | Admin ID, entity, before/after state, reason  |
| Payment initiation                | Manager only                                       | Manager role                   | Manager ID, amount, payment record            |
| Audit log access                  | Manager (own centre), District Admin, System Admin | Role-based                     | Viewer ID, query parameters, record count     |
| User suspension                   | System Admin only                                  | System Admin role              | Admin ID, target user, reason, timestamp      |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
