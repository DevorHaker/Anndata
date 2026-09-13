# 27 — ADVANCED POSTGRESQL FEATURES EVALUATION

## SmartProcure: Specialized PostgreSQL Engine Capabilities & Implementation Rationale

---

## 1. Features Adopted & Architectural Rationale

SmartProcure leverages selective, high-value PostgreSQL 16 core features to guarantee data integrity, performance, and operational security:

| Feature Name                       | Used In Tables                                      | Architectural Purpose & Benefit                                                                                       |
| ---------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Native `gen_random_uuid()`**     | All Tables                                          | Generates secure UUIDv4 primary keys natively in C without external extension dependencies.                           |
| **`TIMESTAMPTZ` (UTC)**            | All Tables                                          | Eliminates timezone ambiguity across multi-state procurement centres.                                                 |
| **Generated Stored Columns**       | `weighment_records`, `procurements`                 | Computes `net_weight_kg` and `net_payable_amount` automatically at the C engine level, preventing math discrepancies. |
| **JSONB Data Type**                | `audit_logs`, `payment_events`, `notification_logs` | Stores flexible, schema-less event payloads and snapshots without breaking 3NF on transactional entities.             |
| **Range Table Partitioning**       | `audit_logs`                                        | Horizontally partitions heavy append-only audit logs by month (`audit_logs_2026_09`), keeping index sizes manageable. |
| **Partial B-Tree Indexes**         | `slots`, `queue_entries`                            | Indexes only active operational records (`WHERE status = 'ACTIVE'`), saving up to 70% RAM on index caches.            |
| **Optimistic Concurrency Locking** | `users`, `slots`, `bookings`, `procurements`        | Monotonic `version` integer column updated via trigger to prevent overwrite anomalies.                                |

---

## 2. Features Evaluated & Deferred / Rejected

- **PostgreSQL ENUM Types**: **Deferred / Rejected**. ENUM types require `ALTER TYPE` schema migrations to add new codes, which lock tables. Standard `VARCHAR(30)` with application/CHECK validation is preferred for flexibility.
- **Unlogged Tables**: **Rejected**. Unlogged tables bypass WAL logging for speed, but are wiped on system crash. All SmartProcure tables require full WAL persistence.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
