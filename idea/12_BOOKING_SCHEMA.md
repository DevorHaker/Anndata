# 12 — BOOKING DATABASE SCHEMA

## SmartProcure: Slot Reservations, Booking State Machine, and Event History

---

## 1. Relational ER Diagram: Bookings

```
 ┌──────────────────────┐           ┌──────────────────────┐
 │       farmers        │           │        slots         │
 └──────────┬───────────┘           └──────────┬───────────┘
            │ 1:N                              │ 1:N
            └─────────────────┬────────────────┘
                              ▼
                   ┌────────────────────┐
                   │      bookings      │
                   └──────────┬─────────┘
                              │ 1:N
                   ┌──────────┴─────────┐
                   │   booking_events   │
                   └────────────────────┘
```

---

## 2. Table Specifications

### 2.1 `bookings`

Slot booking records connecting Farmers, Centres, Slots, and Crop Holdings.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference_id VARCHAR(30) NOT NULL UNIQUE, -- E.g. 'BK-20260913-A8F2'
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  declared_weight_kg NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW', 'RESCHEDULED'
  idempotency_key VARCHAR(100) NULL UNIQUE,   -- Edge retry protection key
  cancellation_reason TEXT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL,

  CONSTRAINT chk_declared_weight_positive CHECK (declared_weight_kg > 0)
);

CREATE INDEX idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX idx_bookings_centre_status ON bookings(centre_id, status);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);
```

### 2.2 `booking_events`

Immutable state transition history for every booking state modification.

```sql
CREATE TABLE booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(50) NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_events_booking ON booking_events(booking_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
