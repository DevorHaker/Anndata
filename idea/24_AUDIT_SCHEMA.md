# 24 — AUDIT LOG DATABASE SCHEMA

## SmartProcure: Immutable Transactional Audit Trail and Monthly Partitioning

---

## 1. Table Specifications

### 1.1 `audit_logs`

Append-only transactional audit trail for all sensitive operations, state modifications, and administrative overrides.

> **SECURITY & PERMISSION RULES**:
>
> 1. Application DB user possesses `INSERT` and `SELECT` rights only.
> 2. SQL commands `UPDATE` and `DELETE` are **STRICTLY REVOKED**.

```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  request_id VARCHAR(100) NOT NULL,            -- X-Request-ID correlation token
  actor_id UUID NOT NULL,                      -- Authenticated User ID
  actor_role VARCHAR(50) NOT NULL,             -- User role at time of action
  action VARCHAR(100) NOT NULL,                -- E.g. 'BOOKING_CREATED', 'WEIGHMENT_CORRECTED'
  entity_type VARCHAR(50) NOT NULL,            -- E.g. 'BOOKING', 'PROCUREMENT', 'WEIGHMENT'
  entity_id UUID NOT NULL,                     -- Target Primary Key
  centre_id UUID NULL,                         -- Associated Procurement Centre
  before_state JSONB NULL,                     -- JSON snapshot prior to update
  after_state JSONB NULL,                      -- JSON snapshot following update
  ip_address VARCHAR(45) NOT NULL,             -- IPv4 / IPv6 address
  user_agent TEXT NULL,                        -- Client device user agent
  reason TEXT NULL,                            -- Administrative rationale for override
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly Table Partitions
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
