# 31 — AUDIT ARCHITECTURE

## SmartProcure: Immutable Transactional Audit Trail, Schema, and Data Protection

---

## 1. Audit Engineering Mandate

Every sensitive operation, authorization override, financial state change, and administrative configuration modification **MUST** emit an immutable, tamper-evident audit record within the exact same PostgreSQL transaction as the primary operation.

### Audit Security Rules

1. **Append-Only Table**: The PostgreSQL `audit_logs` table grants `INSERT` and `SELECT` permissions to the application user. `UPDATE` and `DELETE` SQL operations are **STRICTLY REVOKED**.
2. **Transactional Binding**: Audit entry writes occur inside the domain service database transaction (`BEGIN...COMMIT`). If the primary business action fails and rolls back, the audit record also rolls back.

---

## 2. PostgreSQL Audit Schema (`audit_logs`)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(100) NOT NULL,            -- X-Request-ID Correlation Token
  actor_id UUID NOT NULL,                      -- Authenticated User ID
  actor_role VARCHAR(50) NOT NULL,             -- User Role at time of action
  action VARCHAR(100) NOT NULL,                -- E.g., 'BOOKING_CREATED', 'WEIGHMENT_CORRECTED'
  entity_type VARCHAR(50) NOT NULL,            -- E.g., 'BOOKING', 'PROCUREMENT', 'WEIGHMENT'
  entity_id UUID NOT NULL,                     -- Target Primary Key
  centre_id UUID NULL,                         -- Associated Procurement Centre
  before_state JSONB NULL,                     -- State prior to modification (For Updates)
  after_state JSONB NULL,                      -- State following modification
  ip_address VARCHAR(45) NOT NULL,             -- Client IPv4 / IPv6
  user_agent TEXT NULL,                        -- Client Browser / App User Agent
  reason TEXT NULL,                            -- Administrative Override Rationale
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Partition Tables by Month
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
```

---

## 3. Auditable Events Catalog

| Domain           | Action Name                | Audited Metadata                                              |
| ---------------- | -------------------------- | ------------------------------------------------------------- |
| **Auth**         | `USER_LOGIN_FAILED`        | IP Address, Mobile Number, Failure Reason                     |
| **Auth**         | `PASSWORD_CHANGED`         | User ID, IP Address                                           |
| **Bookings**     | `BOOKING_CREATED`          | Booking ID, Farmer ID, Slot ID, Crop ID                       |
| **Bookings**     | `BOOKING_CANCELLED`        | Booking ID, Cancelled By, Reason                              |
| **Checkins**     | `CHECKIN_MANUAL_OVERRIDE`  | Booking ID, Officer ID, Override Reason                       |
| **Queue**        | `QUEUE_SKIPPED`            | Queue Entry ID, Station ID, Reason                            |
| **Weighments**   | `WEIGHMENT_CORRECTED`      | Weighment ID, Before Net Weight, After Net Weight, Manager ID |
| **Quality**      | `QUALITY_GRADE_OVERRIDDEN` | Inspection ID, Before Grade, After Grade, Manager ID          |
| **Procurements** | `PROCUREMENT_APPROVED`     | Procurement ID, Total Amount, Approved By                     |
| **Payments**     | `PAYMENT_DISBURSED`        | Payment ID, UTR Number, Bank Reference                        |
| **Admin**        | `MSP_RATE_UPDATED`         | Crop ID, Before MSP, After MSP, Admin ID                      |

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
