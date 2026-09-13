# 29 — DATA DELETION & RETENTION ARCHITECTURE

## SmartProcure: Soft Deletion Policy Matrix and Regulatory Data Retention

---

## 1. Deletion Policy Matrix

In a financial and agricultural procurement platform, silent hard-deletion of records can destroy financial accountability and audit trails. SmartProcure establishes a strict deletion policy matrix:

| Entity Category    | Entity Name                                      | Deletion Strategy                   | Rationale & Enforcement                                                                               |
| ------------------ | ------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Core Identity**  | `users`, `farmers`                               | **Soft Delete** (`deleted_at`)      | Disabling an account must retain past transaction history for auditability. Hard deletion prohibited. |
| **Master Setup**   | `procurement_centres`, `crop_types`              | **Soft Delete** (`deleted_at`)      | Inactivating a centre or crop prevents new bookings while preserving historical reporting.            |
| **Transactional**  | `bookings`, `slots`                              | **Soft Delete / Status Transition** | Cancelled bookings update `status = 'CANCELLED'`. Soft delete used if created in error.               |
| **Financial**      | `procurements`, `payments`, `weighment_records`  | **IMMUTABLE (No Delete Allowed)**   | SQL `DELETE` permissions **REVOKED**. Financial & physical weight records can never be deleted.       |
| **Audit Logs**     | `audit_logs`, `booking_events`, `payment_events` | **IMMUTABLE (No Delete Allowed)**   | System audit logs are append-only. SQL `DELETE` & `UPDATE` commands are revoked.                      |
| **Ephemeral Logs** | `user_sessions`, `idempotency_records`           | **Hard Delete via TTL Cleanup**     | Expired JWT sessions and idempotency keys (>24h) are pruned automatically by worker job.              |

---

## 2. Regulatory Retention Policies

> **RETENTION POLICY NOTE**:
> Regulatory data retention rules vary by jurisdiction. Proposed retention targets require final confirmation from legal authorities:

1. **Procurement & Financial Records** (`procurements`, `payments`): Retained in active PostgreSQL tables for **7 Years** minimum to comply with financial audit standards.
2. **Audit Logs** (`audit_logs`): Retained in partitioned database tables for **3 Years**, then moved to compressed cold S3 object storage archives.
3. **Operational Snapshots** (`centre_congestion_snapshots`): Retained for **90 Days** for real-time analytics; aggregated into daily summary tables before pruning.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
