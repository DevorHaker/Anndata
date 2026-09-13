# 32 — ADVANCED CONCURRENCY & LOCKING STRATEGY

## SmartProcure: Optimistic vs. Pessimistic Locking, Row Locks, and Deadlock Prevention

---

## 1. Locking Strategy Matrix

SmartProcure pairs appropriate locking mechanisms with operational risk levels:

| Operation Type               | Concurrency Risk             | Chosen Locking Mechanism                | Rationale & SQL Implementation                                                                           |
| ---------------------------- | ---------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Slot Booking**             | High Volume Rush             | **Atomic Conditional SQL Update**       | `UPDATE slots SET capacity = capacity - 1 WHERE available > 0`. Zero table locks; fast row-level lock.   |
| **Procurement State Update** | Medium Volume                | **Optimistic Locking (`version`)**      | `UPDATE procurements SET status = $1, version = version + 1 WHERE id = $2 AND version = $3`.             |
| **Weight Correction**        | Low Volume / High Impact     | **Pessimistic Row Lock (`FOR UPDATE`)** | `SELECT * FROM weighment_records WHERE id = $1 FOR UPDATE`. Holds write lock until correction completes. |
| **Queue Position Shift**     | High Volume / High Frequency | **Redis ZSET + Atomic SQL Swap**        | Redis manages instant order swaps; final state committed to DB inside single transaction.                |

---

## 2. Deadlock Prevention Strategy

To guarantee that concurrent database transactions never crash into deadlocks (`SQLSTATE 40001`):

1. **Strict Table Access Ordering Rule**: Any multi-table transaction must acquire locks in a globally consistent order:
   ```
   1. procurement_centres ──► 2. slots ──► 3. bookings ──► 4. tokens ──► 5. audit_logs
   ```
2. **Statement Timeouts**: All application DB sessions enforce a strict statement timeout:
   ```sql
   SET statement_timeout = '10000'; -- 10 Second Execution Limit
   SET lock_timeout = '5000';       -- 5 Second Lock Wait Limit
   ```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
