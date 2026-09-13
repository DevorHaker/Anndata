# API Security & RBAC Matrix — SmartProcure

## 1. Security Controls Overview
All API v1 endpoints enforce:
1. **Authentication**: Mandatory JWT verification (`Bearer <token>`).
2. **Role-Based Access Control (RBAC)**: Fine-grained permission checks via `authorizeRole()`.
3. **Audit Logging**: Structured log capture of actor ID, request ID (`x-request-id`), route, and HTTP verb.
4. **Input Validation**: Request body & query parameter schema validation.

---

## 2. API Endpoint Security Matrix

| Endpoint | Verb | Minimum Auth Role | Ownership / Scope Enforcement | Rate Limit Bucket | Audit Logging |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | POST | Public | Anonymous | Strict (5 req/min) | Yes (`LOGIN`) |
| `/api/v1/auth/logout` | POST | Authenticated | Current Session | Standard (100/15min) | Yes (`LOGOUT`) |
| `/api/v1/farmers` | GET / POST | `DISTRICT_ADMIN`, `SYSTEM_ADMIN` | District Scope | Standard | Yes |
| `/api/v1/farmers/:id` | GET | `FARMER` (Self), Staff | IDOR Check (`req.user.sub === id`) | Standard | Yes |
| `/api/v1/bookings` | POST | `FARMER` | Verified Farmer Quota Check | Standard | Yes (`BOOKING_CREATED`) |
| `/api/v1/tokens/checkin` | POST | `PROCUREMENT_OFFICER` | Centre Assignment Scope | Standard | Yes (`CHECK_IN`) |
| `/api/v1/procurements` | POST | `PROCUREMENT_OFFICER` | Assigned Mandi Centre | Standard | Yes (`PROCUREMENT_FINALIZED`) |
| `/api/v1/quality/inspect` | POST | `PROCUREMENT_OFFICER` | Mandatory MSP Grade Formula | Standard | Yes (`QUALITY_INSPECTED`) |
| `/api/v1/payments` | POST | `SYSTEM_ADMIN`, `CENTRE_MANAGER` | Idempotent Bank Handoff | Strict | Yes (`PAYMENT_DISBURSED`) |
| `/api/v1/sync` | POST | Staff / Offline PWA | Server-Authority Sync Engine | Standard | Yes (`OFFLINE_SYNC`) |
| `/api/v1/analytics/summary` | GET | Staff / Admin | Role-Based Data Masking | Standard | Yes |
