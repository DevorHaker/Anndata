# 15 — QUEUE DATABASE SCHEMA

## SmartProcure: Live Queue State Machine and Historical Event Logs

---

## 1. Table Specifications

### 1.1 `queue_entries`

Active live queue entries tracking arrival position, current state, and ETAs.

```sql
CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE RESTRICT,
  queue_number INTEGER NOT NULL,              -- Sequential daily queue integer e.g. 104
  priority_score NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING', -- 'WAITING', 'CALLED', 'PROCESSING', 'COMPLETED', 'SKIPPED', 'NO_SHOW'
  called_at TIMESTAMPTZ NULL,
  service_started_at TIMESTAMPTZ NULL,
  service_completed_at TIMESTAMPTZ NULL,
  estimated_wait_minutes INTEGER NULL,
  assigned_station_id VARCHAR(50) NULL,       -- E.g. 'WEIGHBRIDGE_01'
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_queue_active ON queue_entries(centre_id, status) WHERE status IN ('WAITING', 'CALLED', 'PROCESSING');
CREATE INDEX idx_queue_booking ON queue_entries(booking_id);
```

### 1.2 `queue_events`

Immutable historical log tracking queue state changes for auditability and bottleneck analytics.

```sql
CREATE TABLE queue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,            -- 'QUEUE_ENTRY_CREATED', 'FARMER_CALLED', 'FARMER_SKIPPED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  metadata JSONB NULL,                        -- Wait duration, position snapshot
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_queue_events_entry ON queue_events(queue_entry_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
