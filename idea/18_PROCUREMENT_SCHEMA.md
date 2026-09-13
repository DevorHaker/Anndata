# 18 — PROCUREMENT DATABASE SCHEMA

## SmartProcure: Procurement Transaction Records and Final Financial Value Calculations

---

## 1. Table Specifications

### 1.1 `procurements`

Canonical procurement transaction record connecting Weighments, Quality, MSP, and Payable Values.

```sql
CREATE TABLE procurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_reference_id VARCHAR(30) NOT NULL UNIQUE, -- E.g. 'PR-2026-00012984'
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  weighment_id UUID NOT NULL UNIQUE REFERENCES weighment_records(id) ON DELETE RESTRICT,
  quality_inspection_id UUID NOT NULL UNIQUE REFERENCES quality_inspections(id) ON DELETE RESTRICT,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  gross_weight_kg NUMERIC(10, 3) NOT NULL,
  net_weight_kg NUMERIC(10, 3) NOT NULL,
  quality_deduction_kg NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
  final_accepted_weight_kg NUMERIC(10, 3) GENERATED ALWAYS AS (net_weight_kg - quality_deduction_kg) STORED,
  rate_per_kg NUMERIC(10, 4) NOT NULL,        -- Derived from MSP rate table / 100
  gross_payable_amount NUMERIC(12, 2) NOT NULL,
  total_deductions_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  net_payable_amount NUMERIC(12, 2) GENERATED ALWAYS AS (gross_payable_amount - total_deductions_amount) STORED,
  status VARCHAR(30) NOT NULL DEFAULT 'APPROVED', -- 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_INITIATED', 'COMPLETED', 'CANCELLED'
  approved_by UUID NOT NULL REFERENCES users(id),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_net_weight_pos CHECK (net_weight_kg > 0),
  CONSTRAINT chk_accepted_weight_pos CHECK (net_weight_kg >= quality_deduction_kg),
  CONSTRAINT chk_payable_pos CHECK (gross_payable_amount >= total_deductions_amount)
);

CREATE INDEX idx_procurements_farmer ON procurements(farmer_id);
CREATE INDEX idx_procurements_centre ON procurements(centre_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
