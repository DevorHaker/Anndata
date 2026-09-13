# 11 — SLOT DATABASE SCHEMA

## SmartProcure: Operating Slot Windows, Capacity Counters, and Schedule Invariants

---

## 1. Table Specifications

### 1.1 `slots`

Daily hourly booking slot windows per centre.

```sql
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_capacity INTEGER NOT NULL,            -- Base configured booking capacity (e.g., 20 farmers)
  confirmed_count INTEGER NOT NULL DEFAULT 0,  -- Denormalized active booking counter
  available_capacity INTEGER NOT NULL,       -- Denormalized remaining capacity (total - confirmed)
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'FULL', 'CANCELLED', 'CLOSED'
  version INTEGER NOT NULL DEFAULT 1,         -- Optimistic Locking Version Counter
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Integrity Constraints
  CONSTRAINT uq_centre_crop_slot UNIQUE (centre_id, crop_type_id, slot_date, start_time),
  CONSTRAINT chk_slot_times CHECK (end_time > start_time),
  CONSTRAINT chk_slot_capacity_non_negative CHECK (available_capacity >= 0),
  CONSTRAINT chk_slot_capacity_math CHECK (total_capacity = available_capacity + confirmed_count)
);

CREATE INDEX idx_slots_search ON slots(centre_id, slot_date, status);
CREATE INDEX idx_slots_available ON slots(centre_id, crop_type_id, slot_date) WHERE status = 'ACTIVE' AND available_capacity > 0;
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
