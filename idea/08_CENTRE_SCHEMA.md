# 08 — PROCUREMENT CENTRE DATABASE SCHEMA

## SmartProcure: Centre Registry, Operating Schedules, and Supported Crops

---

## 1. Table Specifications

### 1.1 `procurement_centres`

Master registry for physical procurement centres.

```sql
CREATE TABLE procurement_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_code VARCHAR(30) NOT NULL UNIQUE,   -- E.g. 'CNC-LDH-014'
  name VARCHAR(150) NOT NULL,
  district VARCHAR(100) NOT NULL,
  sub_district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  address_text TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,           -- WGS84 Latitude
  longitude NUMERIC(11, 8) NOT NULL,          -- WGS84 Longitude
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  contact_phone VARCHAR(15) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'BUSY', 'CONGESTED', 'TEMPORARILY_CLOSED'
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_centres_district ON procurement_centres(district);
CREATE INDEX idx_centres_status ON procurement_centres(status);
```

### 1.2 `centre_operating_hours`

Weekly recurring operational schedule per centre.

```sql
CREATE TABLE centre_operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,               -- 0 = Sunday, 1 = Monday ... 6 = Saturday
  open_time TIME NOT NULL,                    -- E.g. '08:00:00'
  close_time TIME NOT NULL,                   -- E.g. '17:00:00'
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_operating BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_day UNIQUE (centre_id, day_of_week),
  CONSTRAINT chk_day_of_week CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_open_close_times CHECK (close_time > open_time)
);
```

### 1.3 `centre_supported_crops`

Crops accepted by a centre along with daily max intake limits.

```sql
CREATE TABLE centre_supported_crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  daily_max_intake_kg NUMERIC(12, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (centre_id, crop_type_id)
);
```

### 1.4 `centre_holidays`

Scheduled non-operating holiday exceptions per centre.

```sql
CREATE TABLE centre_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  description VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_holiday UNIQUE (centre_id, holiday_date)
);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
