# 34 — RECOMMENDED DEVELOPMENT ORDER & DEPENDENCY SEQUENCE

## SmartProcure: Phased Implementation Order for Phase 3 Code Execution

---

## 1. Development Sequence Principles

Implementation in Phase 3 **MUST NOT** start randomly. Development follows a strict dependency order:

1. **Lower-level foundation abstractions** must be built and tested before dependent modules.
2. **Backend APIs & database migrations** precede frontend UI integration.
3. **Core transactional journey** (Book -> Checkin -> Queue -> Procure -> Pay) precedes auxiliary analytics and notifications.

---

## 2. Master Phase 3 Implementation Roadmap

```
STEP 01: Repository Foundation & Config (.env validation, Pino logger, DB Pool, Redis client)
   │
   ▼
STEP 02: PostgreSQL Migrations & Database Core (Base Tables, Constraints, Indexes)
   │
   ▼
STEP 03: Auth & Identity Module (`auth`, JWT tokens, Redis sessions, bcrypt, OTP)
   │
   ▼
STEP 04: RBAC & Scope Middleware (`authenticate`, `authorizeRole`, `validateScope`)
   │
   ▼
STEP 05: Master Data Modules (`centres`, `produce`, `equipment`)
   │
   ▼
STEP 06: Farmer Profile & Documents Module (`farmers`, S3 upload pre-signed URLs)
   │
   ▼
STEP 07: Slot Management & Concurrency Engine (`slots`, Redis locking, atomic capacity SQL)
   │
   ▼
STEP 08: Booking & Cryptographic Token Module (`bookings`, `tokens`, HMAC QR generation)
   │
   ▼
STEP 09: Check-In & Gate Scanning Module (`checkins`, QR verification, status transition)
   │
   ▼
STEP 10: Live Queue & Real-Time Gateway (`queue`, Socket.IO server, Redis ZSET position tracking)
   │
   ▼
STEP 11: Weighment & Quality Inspection Modules (`weighments`, `quality`, scale entry forms)
   │
   ▼
STEP 12: Procurement Workflow State Machine (`procurements`, FSM transitions, digital receipt)
   │
   ▼
STEP 13: Payment Subsystem & Mock Gateway (`payments`, mock bank webhook, idempotency)
   │
   ▼
STEP 14: Asynchronous Notification Engine (`notifications`, BullMQ worker, SMS/Email mocks)
   │
   ▼
STEP 15: Intelligence & Recommendation Engine (`intelligence`, rule-based scoring, ETA computation)
   │
   ▼
STEP 16: Analytics & Reporting Dashboards (`analytics`, daily rollups, Prometheus metrics)
   │
   ▼
STEP 17: Exceptional Workflows & Auditing (`exceptions`, `audit`, full transactional audit logging)
   │
   ▼
STEP 18: Security Hardening & End-to-End Integration (Helmet headers, k6 load testing, Playwright E2E)
```

---

## 3. Rationale for Sequence Dependency

- **Why DB & Auth first (Steps 1–4)?** Without a database schema and working JWT/RBAC middleware, no subsequent domain module can authenticate users or save data securely.
- **Why Slots & Bookings before Tokens & Queue (Steps 7–10)?** A farmer cannot be checked in or queued without a valid, concurrency-checked slot booking and cryptographic token.
- **Why Procurement before Payment (Steps 12–13)?** A payment disbursement cannot be calculated or initiated until crop net weight and quality grade are finalized and approved.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
