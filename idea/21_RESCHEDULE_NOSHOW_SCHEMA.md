# 21 — RESCHEDULING & NO-SHOW DATABASE SCHEMA

## SmartProcure: Historical Audit Records for Rescheduled Bookings and Missed Appointments

---

## 1. Table Specifications

### 1.1 `reschedule_records`

Preserves historical lineage whenever a booking is moved to a new slot window.

```sql
CREATE TABLE reschedule_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  previous_slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  new_slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  rescheduled_by UUID NOT NULL REFERENCES users(id),
  reason_code VARCHAR(50) NOT NULL,           -- 'FARMER_REQUEST', 'CENTRE_CONGESTION', 'WEATHER_DELAY'
  reason_text TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reschedules_booking ON reschedule_records(original_booking_id);
```

### 1.2 `noshow_records`

Historical tracking of missed booking appointments.

```sql
CREATE TABLE noshow_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  penalty_applied BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_noshows_farmer ON noshow_records(farmer_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
