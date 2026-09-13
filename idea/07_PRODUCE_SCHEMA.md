# 07 — PRODUCE DATABASE SCHEMA

## SmartProcure: Master Crops, Varieties, MSP Rates, and Farmer Holdings

---

## 1. Table Specifications

### 1.1 `crop_types`

Master registry of agricultural commodities.

```sql
CREATE TABLE crop_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,          -- E.g. 'CROP_WHEAT', 'CROP_PADDY', 'CROP_MAIZE'
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,             -- 'GRAIN', 'PULSE', 'OILSEED'
  default_unit VARCHAR(20) NOT NULL DEFAULT 'KG', -- Standard base unit 'KG' or 'QUINTAL'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 `crop_varieties`

Sub-varieties under a crop type with default physical parameters.

```sql
CREATE TABLE crop_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL UNIQUE,          -- E.g. 'WHEAT_HD2967', 'PADDY_BASMATI_1121'
  name VARCHAR(100) NOT NULL,
  max_acceptable_moisture_pct NUMERIC(5, 2) NOT NULL DEFAULT 14.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 `msp_rates`

Minimum Support Price (MSP) rate table per crop type and harvest season.

```sql
CREATE TABLE msp_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  season VARCHAR(50) NOT NULL,               -- E.g. 'RABI_2026', 'KHARIF_2026'
  rate_per_quintal NUMERIC(10, 2) NOT NULL,   -- Rate in Currency per 100 kg
  effective_from DATE NOT NULL,
  effective_to DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_msp_dates CHECK (effective_to >= effective_from),
  CONSTRAINT chk_msp_rate_positive CHECK (rate_per_quintal > 0)
);

CREATE INDEX idx_msp_crop_season ON msp_rates(crop_type_id, season);
```

### 1.4 `farmer_produce`

Farmer-declared crop produce holdings available for procurement.

```sql
CREATE TABLE farmer_produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  crop_variety_id UUID NULL REFERENCES crop_varieties(id) ON DELETE RESTRICT,
  harvest_season VARCHAR(50) NOT NULL,
  estimated_yield_kg NUMERIC(10, 2) NOT NULL,
  declared_quantity_kg NUMERIC(10, 2) NOT NULL,
  procured_quantity_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'DECLARED', -- 'DECLARED', 'PARTIALLY_PROCURED', 'FULLY_PROCURED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_declared_qty_positive CHECK (declared_quantity_kg > 0),
  CONSTRAINT chk_procured_qty_valid CHECK (procured_quantity_kg <= declared_quantity_kg)
);

CREATE INDEX idx_farmer_produce_farmer ON farmer_produce(farmer_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
