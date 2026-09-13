# 09 — DATABASE ARCHITECTURE

## SmartProcure: Relational Logical Architecture & PostgreSQL Design

---

## 1. Database Ownership & ACID Guarantees

PostgreSQL 16 is the **sole transactional source of truth** for SmartProcure. All operational state, user records, financial disbursements, and audit logs reside within a single PostgreSQL database instance (or primary-replica setup).

### ACID Transaction Mandates

Transactions (`BEGIN...COMMIT`) are strictly enforced for operations modifying multiple entities:

1. **Booking Creation**: Slot capacity decrement + Booking creation + Token generation + Audit log.
2. **QR Check-In**: Token validation/status update + Booking status update + Queue entry insertion.
3. **Procurement Completion**: Weighment finalization + Quality grading + Procurement approval + Payment record generation + Audit log.

---

## 2. Global Database Conventions & Rules

1. **Naming Conventions**: `snake_case` for all table names, column names, and index names. Primary keys are `id UUID DEFAULT gen_random_uuid()`.
2. **Timestamps**: Every table includes `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`.
3. **Soft Deletion**: Entities subject to historical compliance (`farmers`, `procurement_centres`, `bookings`) use soft deletion via `deleted_at TIMESTAMPTZ NULL`. Hard deletes are forbidden except via retention archival scripts.
4. **Foreign Key Integrity**: All relationships use explicit foreign key constraints (`ON DELETE RESTRICT` default; `ON DELETE CASCADE` prohibited on financial/procurement tables).
5. **Optimistic Locking**: Frequently updated entities (`slots`, `queue_entries`, `procurements`) include a `version INTEGER NOT NULL DEFAULT 1` column.

---

## 3. Logical Entity Schema Summary

```
                       ┌──────────────────────┐
                       │        users         │
                       └──────────┬───────────┘
                                  │ 1:1
                       ┌──────────┴───────────┐
                       │       farmers        │
                       └──────────┬───────────┘
                                  │ 1:N
                       ┌──────────┴───────────┐          ┌──────────────────────┐
                       │   produce_batches    │          │  procurement_centres │
                       └──────────┬───────────┘          └──────────┬───────────┘
                                  │                                 │ 1:N
                                  │                      ┌──────────┴───────────┐
                                  │                      │        slots         │
                                  │                      └──────────┬───────────┘
                                  │ 1:N                             │ 1:N
                                  └──────────────┬──────────────────┘
                                                 ▼
                                      ┌────────────────────┐
                                      │      bookings      │
                                      └──────────┬─────────┘
                                                 │ 1:1
                                      ┌──────────┴─────────┐
                                      │       tokens       │
                                      └──────────┬─────────┘
                                                 │ 1:1
                                      ┌──────────┴─────────┐
                                      │   queue_entries    │
                                      └──────────┬─────────┘
                                                 │ 1:1
                                      ┌──────────┴─────────┐
                                      │    procurements    │
                                      └──────────┬─────────┘
                                                 │
                                  ┌──────────────┴──────────────┐
                                  ▼                             ▼
                      ┌────────────────────┐       ┌────────────────────┐
                      │ weighment_records  │       │quality_inspections │
                      └────────────────────┘       └────────────────────┘
                                                 │ 1:1
                                      ┌──────────┴─────────┐
                                      │      payments      │
                                      └────────────────────┘
```

---

## 4. Mandatory Indexing Strategy

To guarantee sub-50ms query performance, indices are defined for all high-cardinality foreign keys and lookup filters:

```sql
-- Indexing Examples for High-Concurrency Tables
CREATE INDEX idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX idx_bookings_centre_date ON bookings(centre_id, booking_date, status);
CREATE INDEX idx_slots_centre_date ON slots(centre_id, slot_date);
CREATE INDEX idx_queue_centre_status ON queue_entries(centre_id, status, queue_position);
CREATE INDEX idx_tokens_code ON tokens(token_code);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

## 5. Partitioning Strategy for Scale

The `audit_logs` and `daily_centre_metrics` tables are partitioned by month (`RANGE (created_at)`) to ensure query performance and facilitate cold storage archival.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
