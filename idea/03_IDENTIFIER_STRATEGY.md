# 03 — IDENTIFIER & REFERENCE STRATEGY

## SmartProcure: Primary Keys, Human-Readable References, and Uniqueness Rules

---

## 1. Identifier Strategy Matrix

SmartProcure decouples **Internal System Identifiers** (used for database primary/foreign keys) from **External Human-Readable References** (presented to farmers, officers, and printed receipts).

> **MANDATORY SECURITY RULE**:
> Phone numbers, Aadhaar numbers, PAN numbers, or bank account numbers **MUST NEVER** be used as primary or foreign keys. Internal identifiers must be cryptographically non-sequential and immutable.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 IDENTIFIER DUALITY                                     │
│                                                                                        │
│  INTERNAL PRIMARY KEY (UUIDv4)                  PUBLIC HUMAN-READABLE REFERENCE        │
│  - Database Joins & Indexes                     - Mobile UI, Receipts, QR Scans        │
│  - `b8f411e2-9b24-4f32-841f-823901bc09a1`      - `BK-2026-0913-9821`                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Internal Primary Key Standard (UUID)

- **Data Type**: `UUID` (PostgreSQL 16 native 128-bit type).
- **Default Generator**: `gen_random_uuid()` (Cryptographically secure UUIDv4 generator built into PostgreSQL 16 core; zero external extension requirement).
- **Benefits**:
  - Eliminates primary key enumeration attacks (e.g. `GET /farmers/101`, `GET /farmers/102`).
  - Allows client or API tier to generate IDs prior to database insertion if necessary.
  - Simplifies future multi-region database sharding without primary key collision risks.

---

## 3. Public Human-Readable Reference Specifications

Human-readable references are generated via sequence-backed database triggers or service helpers for operational usability:

| Entity                   | Public Reference Format       | Example Value         | Pattern Specification                 |
| ------------------------ | ----------------------------- | --------------------- | ------------------------------------- |
| **Farmer**               | `FRM-{YYYY}-{SEQ:6}`          | `FRM-2026-008912`     | Year + 6-digit padded sequence        |
| **Procurement Centre**   | `CNC-{DISTRICT_CODE}-{SEQ:3}` | `CNC-LDH-014`         | District Code + 3-digit sequence      |
| **Booking**              | `BK-{YYYYMMDD}-{HEX:4}`       | `BK-20260913-A8F2`    | Date + 4-character random hex         |
| **Token / QR**           | `SP-{SEQ:4}-{CHAR:2}`         | `SP-9821-XK`          | Short 4-digit code + checksum         |
| **Procurement Receipt**  | `PR-{YYYY}-{SEQ:8}`           | `PR-2026-00012984`    | Year + 8-digit transaction sequence   |
| **Payment Disbursement** | `PAY-{YYYYMMDD}-{SEQ:6}`      | `PAY-20260913-004812` | Date + 6-digit payment batch sequence |

---

## 4. Database Unique Constraint Specifications

To guarantee reference integrity, explicit SQL unique constraints are placed on both primary and public reference columns:

```sql
-- Example Table Primary & Public Reference Constraints
ALTER TABLE farmers
  ADD CONSTRAINT pk_farmers PRIMARY KEY (id),
  ADD CONSTRAINT uq_farmers_reference_id UNIQUE (farmer_reference_id);

ALTER TABLE bookings
  ADD CONSTRAINT pk_bookings PRIMARY KEY (id),
  ADD CONSTRAINT uq_bookings_reference_id UNIQUE (booking_reference_id);

ALTER TABLE tokens
  ADD CONSTRAINT pk_tokens PRIMARY KEY (id),
  ADD CONSTRAINT uq_tokens_code UNIQUE (token_code);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
