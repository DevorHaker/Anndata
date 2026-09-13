# 26 — INDEXING STRATEGY & QUERY OPTIMIZATION

## SmartProcure: Index Catalog, Query Access Paths, and Storage/Write Overhead

---

## 1. Indexing Discipline & Principles

1. **Query-Driven Indexing**: Indexes are created strictly to support known, high-frequency API access patterns (e.g. slot availability lookup, active queue filtering, mobile login). Blind indexing is prohibited.
2. **Partial Indexes for Active Worksets**: Uses SQL `WHERE` clauses on indexes to index only active, uncompleted records (e.g., `WHERE status = 'ACTIVE'`), keeping index trees compact and lightning-fast.
3. **Composite Index Ordering**: Equality fields first, range fields second (`centre_id`, `crop_type_id`, `slot_date`).

---

## 2. Master Index Catalog & Justification Matrix

| Table           | Index Name                   | Type / Columns                                                                                                 | Supported API Query             | Expected Benefit / Justification                                              |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| `users`         | `idx_users_mobile`           | B-Tree (`mobile_number`)                                                                                       | Login `POST /auth/login`        | Instant sub-ms user lookup by mobile.                                         |
| `farmers`       | `idx_farmers_user`           | B-Tree (`user_id`)                                                                                             | Auth context profile lookup     | Sub-ms retrieval of farmer by `user_id`.                                      |
| `slots`         | `idx_slots_available`        | Partial B-Tree (`centre_id`, `crop_type_id`, `slot_date`) `WHERE status = 'ACTIVE' AND available_capacity > 0` | Slot Search `GET /slots`        | Excludes full/closed slots from index; ultra-fast search.                     |
| `bookings`      | `idx_bookings_centre_status` | Composite B-Tree (`centre_id`, `status`)                                                                       | Centre Dashboard lists          | Fast filtering of centre bookings by state.                                   |
| `queue_entries` | `idx_queue_active`           | Partial B-Tree (`centre_id`, `status`) `WHERE status IN ('WAITING', 'CALLED', 'PROCESSING')`                   | Live Queue Screen `GET /queue`  | Filters active live queue entries without scanning completed/skipped history. |
| `checkins`      | `idx_checkins_centre_time`   | Composite B-Tree (`centre_id`, `checkin_timestamp`)                                                            | Daily Gate Arrival Analytics    | Fast range scan for daily arrival reporting.                                  |
| `payments`      | `idx_payments_status`        | B-Tree (`status`)                                                                                              | Worker Payment Disbursement Job | Fast polling of `PENDING` and `RETRY_REQUIRED` payments.                      |
| `audit_logs`    | `idx_audit_entity`           | Composite B-Tree (`entity_type`, `entity_id`)                                                                  | Audit History Viewer            | Instant audit trail lookups for a specific booking or weight.                 |

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
