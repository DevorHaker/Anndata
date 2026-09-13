# 16 — WEIGHMENT DATABASE SCHEMA

## SmartProcure: Scale Readings, Net Weight Integrity, and Correction Logs

---

## 1. Table Specifications

### 1.1 `weighment_records`

Official scale readings for gross weight, tare weight, and computed net weight.

```sql
CREATE TABLE weighment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  equipment_id UUID NOT NULL REFERENCES equipment_registry(id) ON DELETE RESTRICT,
  weighbridge_operator_id UUID NOT NULL REFERENCES users(id),
  gross_weight_kg NUMERIC(10, 3) NOT NULL,
  tare_weight_kg NUMERIC(10, 3) NOT NULL,
  net_weight_kg NUMERIC(10, 3) GENERATED ALWAYS AS (gross_weight_kg - tare_weight_kg) STORED,
  unit VARCHAR(10) NOT NULL DEFAULT 'KG',
  status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED', -- 'PENDING', 'VERIFIED', 'CORRECTED', 'REJECTED'
  version INTEGER NOT NULL DEFAULT 1,
  weighed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_gross_weight_positive CHECK (gross_weight_kg > 0),
  CONSTRAINT chk_tare_weight_valid CHECK (tare_weight_kg >= 0),
  CONSTRAINT chk_net_weight_positive CHECK (gross_weight_kg > tare_weight_kg)
);

CREATE INDEX idx_weighment_booking ON weighment_records(booking_id);
```

### 1.2 `weighment_corrections`

Immutable audit log for weight modifications (e.g., scale recalibration after initial weighment).

```sql
CREATE TABLE weighment_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weighment_record_id UUID NOT NULL REFERENCES weighment_records(id) ON DELETE RESTRICT,
  original_gross_weight_kg NUMERIC(10, 3) NOT NULL,
  original_tare_weight_kg NUMERIC(10, 3) NOT NULL,
  corrected_gross_weight_kg NUMERIC(10, 3) NOT NULL,
  corrected_tare_weight_kg NUMERIC(10, 3) NOT NULL,
  correction_reason TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES users(id), -- Requires CENTRE_MANAGER approval
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
