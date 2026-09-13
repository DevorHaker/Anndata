# 13 — BOOKING CONCURRENCY & OVERBOOKING PREVENTION

## SmartProcure: PostgreSQL Transaction & Atomic Capacity Lock Engineering

---

## 1. Concurrency Problem Statement

When 100 farmers attempt to book the exact same slot ID simultaneously:

- Naive read-then-update logic (`SELECT available_capacity` followed by `UPDATE`) causes race conditions, leading to overbooking (negative capacity).
- SmartProcure enforces **Database-Level Zero Overbooking Guarantees**.

---

## 2. PostgreSQL Atomic SQL Capacity Decrement Pattern

Overbooking is prevented without table locks by combining **Atomic SQL Updates** with **Check Constraints**.

```sql
-- Step 1: Enforce SQL Check Constraint on Table Definition
ALTER TABLE slots ADD CONSTRAINT chk_slot_capacity_non_negative
  CHECK (available_capacity >= 0);

-- Step 2: Atomic Conditional Capacity Decrement
-- Executed inside `BEGIN...COMMIT` transaction
UPDATE slots
SET
  available_capacity = available_capacity - 1,
  confirmed_count = confirmed_count + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND available_capacity > 0
  AND status = 'ACTIVE';
```

### Execution Guarantee Mechanics

1. PostgreSQL acquires an exclusive row-level write lock on the target `slots` row for the duration of the statement.
2. If `available_capacity > 0` condition is true, capacity is decremented and `rows_affected = 1`.
3. If `available_capacity == 0` (capacity exhausted), the `WHERE` condition fails, returning `rows_affected = 0`.
4. The application layer checks `rows_affected`:
   - If `1`: Transaction proceeds to insert `bookings` record and `COMMIT`.
   - If `0`: Transaction throws `SLOT_FULL` exception and executes `ROLLBACK`.

---

## 3. Step-by-Step Transaction Execution Sequence

```sql
BEGIN;

-- 1. Atomic Capacity Update Check
UPDATE slots
SET available_capacity = available_capacity - 1, confirmed_count = confirmed_count + 1
WHERE id = 's123' AND available_capacity > 0 AND status = 'ACTIVE';

-- Application Code Verification:
-- IF rows_affected == 0 THEN ROLLBACK AND RETURN 409 SLOT_FULL;

-- 2. Insert Canonical Booking
INSERT INTO bookings (
  id, booking_reference_id, farmer_id, centre_id, slot_id, crop_type_id, declared_weight_kg, status
) VALUES (
  gen_random_uuid(), 'BK-20260913-9821', 'f456', 'c789', 's123', 'cr1', 500.00, 'CONFIRMED'
);

-- 3. Insert Token Record
INSERT INTO tokens (
  id, token_code, booking_id, farmer_id, centre_id, expires_at, status
) VALUES (
  gen_random_uuid(), 'SP-9821-XK', 'b_new', 'f456', 'c789', '2026-09-13 17:00:00+00', 'ACTIVE'
);

-- 4. Record Immutable Audit Event
INSERT INTO audit_logs (
  request_id, actor_id, actor_role, action, entity_type, entity_id, centre_id, after_state
) VALUES (
  'req_123', 'u_farmer', 'FARMER', 'BOOKING_CREATED', 'BOOKING', 'b_new', 'c789', '{"status":"CONFIRMED"}'
);

COMMIT;
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
