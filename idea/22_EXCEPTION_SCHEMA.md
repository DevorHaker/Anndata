# 22 — OPERATIONAL EXCEPTION DATABASE SCHEMA

## SmartProcure: Dispute Holds, Breakdown Incidents, and Recovery Workflow

---

## 1. Table Specifications

### 1.1 `operational_exceptions`

Tracks centre operational holds, quality disputes, weighbridge faults, and equipment breakdowns.

```sql
CREATE TABLE operational_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_code VARCHAR(30) NOT NULL UNIQUE, -- E.g. 'EX-2026-00129'
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  category VARCHAR(50) NOT NULL,              -- 'EQUIPMENT_FAULT', 'QUALITY_DISPUTE', 'NETWORK_OUTAGE', 'QUEUE_OVERLOAD'
  severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  affected_entity_type VARCHAR(50) NULL,      -- E.g. 'BOOKING', 'EQUIPMENT', 'SLOT'
  affected_entity_id UUID NULL,
  reported_by UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  assigned_to UUID NULL REFERENCES users(id),
  resolution_notes TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exceptions_centre ON operational_exceptions(centre_id);
CREATE INDEX idx_exceptions_status ON operational_exceptions(status);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
