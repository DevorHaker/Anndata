# 10 — BOOKING CONCURRENCY DESIGN

## SmartProcure: Prevention of Race Conditions and Overbooking Guarantees

---

## 1. Problem Statement: The Race Condition Threat

```
Scenario: A high-demand slot at a procurement centre has exactly 1 remaining booking capacity.

Time T1: Farmer A sends request to book Slot #104 (Capacity = 1)
Time T1: Farmer B sends request to book Slot #104 (Capacity = 1)

Naive Implementation Failure:
- Thread A reads Slot #104 -> Available Capacity = 1 -> Valid
- Thread B reads Slot #104 -> Available Capacity = 1 -> Valid
- Thread A creates Booking A -> Decrements Capacity to 0
- Thread B creates Booking B -> Decrements Capacity to -1

RESULT: OVERBOOKING FAILS THE PLATFORM. Procurement centre overloaded; operational chaos.
```

---

## 2. Architectural Solution Matrix & Evaluation

We evaluated three potential concurrency handling strategies:

| Strategy                                | Mechanism                                                                                                | Pros                                                                           | Cons                                                                      | Decision                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------- |
| **1. Pessimistic Row Locking**          | `SELECT ... FOR UPDATE` on `slots` table row.                                                            | Simple; 100% database level isolation guarantee.                               | Can create lock contention under extreme surges.                          | **Primary DB Fallback** |
| **2. Atomic Conditional Update**        | `UPDATE slots SET available_capacity = available_capacity - 1 WHERE id = :id AND available_capacity > 0` | Exceptionally fast; zero row lock overhead; non-blocking; 100% ACID compliant. | Requires checking rows-affected count (0 = Slot Full).                    | **SELECTED PRIMARY**    |
| **3. Redis Distributed Lock (Redlock)** | Acquire Redis lock key `lock:slot:{slotId}` before booking attempt.                                      | Prevents DB hitting concurrency limits entirely.                               | Adds dependency on Redis availability; potential lock timeout edge cases. | **Layer 1 Protection**  |

---

## 3. Selected Dual-Layer Concurrency Architecture

SmartProcure employs a **Dual-Layer Concurrency Guard**:

- **Layer 1 (Edge Gate)**: Redis Distributed Lock (`Redlock`) to serialize simultaneous attempts on the exact same slot ID.
- **Layer 2 (Database Source of Truth)**: Atomic Conditional SQL Update with SQL Constraint check.

```
                 [Incoming Concurrent Booking Requests]
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │ Layer 1: Redis Redlock           │
                 │ Key: lock:slot:{slotId}          │
                 │ TTL: 3 seconds                   │
                 └─────────────────┬────────────────┘
                                   │ Lock Acquired (Sequential)
                                   ▼
                 ┌──────────────────────────────────┐
                 │ Layer 2: PostgreSQL Transaction  │
                 │ BEGIN                            │
                 └─────────────────┬────────────────┘
                                   │
                                   ▼
                 ┌──────────────────────────────────┐
                 │ Atomic Capacity Decrement SQL:   │
                 │ UPDATE slots SET                 │
                 │   available_capacity =           │
                 │     available_capacity - 1,      │
                 │   confirmed_count =              │
                 │     confirmed_count + 1          │
                 │ WHERE id = $1                    │
                 │   AND available_capacity > 0;    │
                 └─────────────────┬────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            Rows Affected == 1            Rows Affected == 0
                    │                             │
                    ▼                             ▼
        ┌───────────────────────┐     ┌───────────────────────┐
        │ Insert Booking Record │     │ ROLLBACK Transaction  │
        │ Generate Token        │     │ Release Redis Lock    │
        │ COMMIT Transaction    │     │ Return HTTP 409       │
        │ Release Redis Lock    │     │ "SLOT_FULL"           │
        │ Return HTTP 201       │     └───────────────────────┘
        │ "CONFIRMED"           │
        └───────────────────────┘
```

---

## 4. Production SQL Implementation

```sql
-- Database Check Constraint as Ultimate Safety Net
ALTER TABLE slots ADD CONSTRAINT chk_slot_capacity_non_negative
  CHECK (available_capacity >= 0);

-- Repository Execution (Knex / Raw SQL)
-- Execution returns number of updated rows. 0 indicates capacity was exhausted.
UPDATE slots
SET
  available_capacity = available_capacity - 1,
  confirmed_count = confirmed_count + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND available_capacity > 0
  AND status = 'ACTIVE';
```

---

## 5. Idempotency Key Handling for Double-Click Retries

Even with concurrency protection, a farmer's phone may submit two identical POST requests due to double-clicking the button or cellular retries.

```javascript
// Idempotency check executed inside booking transaction
const idempotencyKey = req.headers["idempotency-key"];
const existingBooking = await redis.get(
  `idempotency:booking:${idempotencyKey}`,
);

if (existingBooking) {
  // Return cached result without re-decrementing slot capacity!
  return res.status(200).json(JSON.parse(existingBooking));
}
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
