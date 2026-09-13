-- =============================================================================
-- SMARTPROCURE: PHASE 6 SCHEMA EXTENSIONS (002_phase6_schema.sql)
-- =============================================================================

BEGIN;

-- 1. CENTRE CAPACITY CONFIGURATIONS
CREATE TABLE IF NOT EXISTS centre_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL UNIQUE REFERENCES procurement_centres(id) ON DELETE CASCADE,
  daily_farmer_capacity INTEGER NOT NULL DEFAULT 100,
  daily_quantity_capacity_kg NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
  hourly_throughput_kg NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
  weighing_station_count INTEGER NOT NULL DEFAULT 2,
  counter_count INTEGER NOT NULL DEFAULT 4,
  storage_capacity_quintals NUMERIC(10, 2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_daily_farmer_cap_pos CHECK (daily_farmer_capacity >= 0),
  CONSTRAINT chk_daily_qty_cap_pos CHECK (daily_quantity_capacity_kg >= 0),
  CONSTRAINT chk_hourly_throughput_pos CHECK (hourly_throughput_kg >= 0)
);

-- 2. CENTRE SERVICES
CREATE TABLE IF NOT EXISTS centre_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  service_code VARCHAR(50) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_service UNIQUE (centre_id, service_code)
);

-- 3. CENTRE OPERATIONAL STATUS HISTORY
CREATE TABLE IF NOT EXISTS centre_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  reason TEXT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_centre_status_hist_centre ON centre_status_history(centre_id);

-- 4. CENTRE DISRUPTIONS
CREATE TABLE IF NOT EXISTS centre_disruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  disruption_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_end_time TIMESTAMPTZ NULL,
  actual_end_time TIMESTAMPTZ NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  resolved_by UUID NULL REFERENCES users(id),
  resolution_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_disruption_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT chk_disruption_status CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'MITIGATING', 'RESOLVED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_disruptions_centre ON centre_disruptions(centre_id);
CREATE INDEX IF NOT EXISTS idx_disruptions_status ON centre_disruptions(status);

-- 5. EQUIPMENT STATUS HISTORY
CREATE TABLE IF NOT EXISTS equipment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_registry(id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  reason TEXT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
