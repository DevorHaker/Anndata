# 17 — QUALITY INSPECTION DATABASE SCHEMA

## SmartProcure: Quality Inspections, Moisture %, Defect Scoring, and Deductions

---

## 1. Table Specifications

### 1.1 `quality_inspections`

Quality inspection parameters, moisture content %, defect grade, and acceptance results.

```sql
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  inspector_id UUID NOT NULL REFERENCES users(id),
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  crop_variety_id UUID NULL REFERENCES crop_varieties(id) ON DELETE RESTRICT,
  moisture_percentage NUMERIC(5, 2) NOT NULL,
  foreign_matter_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  damaged_grains_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  quality_grade VARCHAR(30) NOT NULL,        -- 'GRADE_A', 'GRADE_B', 'REJECTED'
  deduction_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'PASSED', -- 'PASSED', 'PASSED_WITH_DEDUCTION', 'REJECTED'
  rejection_reason TEXT NULL,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_moisture_range CHECK (moisture_percentage BETWEEN 0.00 AND 100.00),
  CONSTRAINT chk_deduction_range CHECK (deduction_percentage BETWEEN 0.00 AND 100.00)
);

CREATE INDEX idx_quality_booking ON quality_inspections(booking_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
