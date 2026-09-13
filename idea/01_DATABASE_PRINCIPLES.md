# 01 — DATABASE DESIGN PRINCIPLES

## SmartProcure: Foundational PostgreSQL Relational Architecture Principles

---

## 1. Executive Summary & Database Context

SmartProcure relies on **PostgreSQL 16** as its sole, canonical, transactional source of truth. The database design underpins high-concurrency agricultural procurement operations across distributed centres, enforcing ACID transactional guarantees, zero overbooking, strict data isolation, financial precision, and immutable auditability.

---

## 2. Core Database Principles

### 1. PostgreSQL as Sole Source of Truth

- **Rule**: All persistent operational state, financial records, weighments, quality grades, and audit trails reside in PostgreSQL.
- **Enforcement**: Caches (Redis) and client state are non-authoritative derivatives. Cache invalidation or redis container destruction must never cause data loss or corrupt financial/inventory state.

### 2. Referential Integrity & Relational Rules

- **Rule**: All entity relationships must be enforced using explicit PostgreSQL Foreign Key constraints (`FOREIGN KEY ... REFERENCES ...`).
- **Enforcement**: `ON DELETE RESTRICT` is the default to prevent accidental orphaned operational records. `ON DELETE CASCADE` is strictly prohibited on transactional and financial entities.

### 3. Normalization & Controlled Denormalization

- **Rule**: Schema is normalized to **Third Normal Form (3NF)** to eliminate redundancy and update anomalies.
- **Controlled Exception**: Read-heavy operational counters (e.g., `confirmed_count` on `slots`, `total_amount` on `procurements`) are denormalized only where high-concurrency read performance or transactional performance warrants it, backed by strict SQL triggers or atomic updates.

### 4. Strict Financial & Physical Measurement Types

- **Rule**: Floating-point types (`FLOAT`, `DOUBLE PRECISION`, `REAL`) are **STRICTLY PROHIBITED** for monetary amounts, weights, percentages, and prices.
- **Enforcement**: Use `NUMERIC(p, s)` (e.g., `NUMERIC(12, 2)` for currency, `NUMERIC(10, 3)` for weights in kg/quintals).

### 5. Explicit State Machine Governance

- **Rule**: Entity state transitions (`bookings`, `tokens`, `queue_entries`, `procurements`, `payments`) are governed by explicit SQL `CHECK` constraints or lookup table foreign keys.
- **Enforcement**: Illegal state bypasses (e.g. paying an unapproved procurement) are blocked at the database engine level.

### 6. Idempotency & Concurrency Safety

- **Rule**: Critical operations (slot booking, check-in, payment callbacks) mandate atomic database constraints or `WHERE` clause conditions to prevent race conditions and duplicate retries.
- **Enforcement**: Atomic SQL updates (`available_capacity = available_capacity - 1 WHERE available_capacity > 0`) and unique index constraints on `idempotency_key`.

### 7. Immutable Auditability by Design

- **Rule**: Sensitive state changes, manual overrides, weight corrections, and role modifications write an immutable audit log inside the same database transaction.
- **Enforcement**: Application user possesses `INSERT` and `SELECT` privileges only on `audit_logs`. `UPDATE` and `DELETE` SQL commands are revoked.

### 8. Data Minimization & Privacy Protection

- **Rule**: Personally Identifiable Information (PII) and sensitive financial details are encrypted at rest or masked before display.
- **Enforcement**: AES-256-GCM column encryption for sensitive identity fields; non-sensitive public reference IDs for QR presentation.

### 9. Explicit Timestamps & Timezone Strategy

- **Rule**: All timestamps must use `TIMESTAMPTZ` (UTC). Ambiguous local `TIMESTAMP` without timezone is forbidden.
- **Enforcement**: Applications query in UTC; centre-local rendering is handled client-side or using centre timezone offsets stored in `procurement_centres`.

### 10. Migration Safety & Version Control

- **Rule**: Database structure changes must be executed via version-controlled, backward-compatible Knex/SQL migration scripts.
- **Enforcement**: Direct manual `ALTER TABLE` commands on staging or production databases are strictly prohibited.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
