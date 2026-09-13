# Security Threat Model — SmartProcure Platform

## 1. System Threat Landscape & Boundaries
The **SmartProcure (SIH26032)** platform manages high-value agricultural MSP transactions, direct benefit transfer (DBT) bank disbursements, dynamic mandi gate queues, and farmer identity records. The threat model follows STRIDE principles (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

---

## 2. Threat Analysis & Mitigations

### A. Authentication & Session Hijacking
* **Threat**: Brute-forcing OTP/passwords, session token theft, or credential stuffing.
* **Impact**: Account takeover of farmers or administrative procurement staff.
* **Mitigation Implemented**:
  * Passwords hashed using bcrypt with salt rounds = 10.
  * Short-lived JWT access tokens containing sub, sessionId, role, and explicit permissions array.
  * Redis-backed / in-memory rate limiters on `/api/v1/auth/login` (5 attempts per minute).
  * Automated credential masking in logger filter (`password`, `otp`, `jwt`, `aadhaar` redacted).

### B. Authorization Bypass & IDOR (Insecure Direct Object Reference)
* **Threat**: A farmer attempting to view or alter another farmer's bookings, tokens, or DBT payment records by manipulating UUID path parameters.
* **Impact**: Data leak or unauthorized state manipulation.
* **Mitigation Implemented**:
  * Server-side `authorizeRole()` middleware enforcing strict RBAC (`SYSTEM_ADMIN`, `DISTRICT_ADMIN`, `CENTRE_MANAGER`, `PROCUREMENT_OFFICER`, `FARMER`).
  * Explicit ownership check: `req.user.sub === booking.farmerId` enforced in business layer.

### C. Financial & Procurement Data Tampering
* **Threat**: Client-side parameter tampering to modify MSP rates, gross/tare weights, or payment disbursement amounts.
* **Impact**: Fraudulent payment generation or MSP loss.
* **Mitigation Implemented**:
  * Authoritative MSP calculation executed strictly server-side using fixed numeric/decimal precision formulas.
  * Payment records generated with UUID idempotency keys (`idemp-proc-{procurementId}`) to prevent duplicate payments.
  * Audit log recording actor, action, resource, timestamp, and payload for all weighment, quality, and payment overrides.

### D. Offline Synchronization Attacks
* **Threat**: Replay of tampered offline check-in payloads or fake gate notes when re-establishing connectivity.
* **Impact**: Queue corruption or unauthorized token state advancement.
* **Mitigation Implemented**:
  * `SyncService` verifies server token state prior to accepting client offline actions.
  * Server-authority conflict detection logs discrepancies into `sync_conflicts` table for human staff review.

### E. Distributed Denial of Service (DoS) & API Abuse
* **Threat**: Rapid submission of slot bookings or sync payload spam to saturate the API and database.
* **Impact**: Service unavailability during peak mandi procurement hours.
* **Mitigation Implemented**:
  * Express `globalRateLimiter` enforces 100 requests per 15-minute window per IP.
  * Compression middleware and JSON body parser payload size limit capped at 2MB.
