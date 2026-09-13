-- =============================================================================
-- SMARTPROCURE: PRODUCTION POSTGRESQL 16 MASTER DDL SCRIPT
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. IDENTITY & RBAC DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_role ON users(role_id);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_info TEXT NULL,
  ip_address VARCHAR(45) NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- -----------------------------------------------------------------------------
-- 3. FARMER DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  farmer_reference_id VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED',
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_farmers_user ON farmers(user_id);
CREATE INDEX idx_farmers_ref ON farmers(farmer_reference_id);

CREATE TABLE farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
  village_name VARCHAR(100) NOT NULL,
  sub_district VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  latitude NUMERIC(10, 8) NULL,
  longitude NUMERIC(11, 8) NULL,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  land_holding_acres NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_profiles_district ON farmer_profiles(district);

CREATE TABLE farmer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  account_holder_name VARCHAR(150) NOT NULL,
  bank_name VARCHAR(150) NOT NULL,
  branch_name VARCHAR(150) NULL,
  encrypted_account_number TEXT NOT NULL,
  encrypted_ifsc_code TEXT NOT NULL,
  account_last_four VARCHAR(4) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_farmer_primary_bank UNIQUE (farmer_id, is_primary)
);

CREATE TABLE farmer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_key VARCHAR(255) NOT NULL UNIQUE,
  file_name_original VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT NULL,
  verified_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. PRODUCE DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE crop_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  default_unit VARCHAR(20) NOT NULL DEFAULT 'KG',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crop_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  max_acceptable_moisture_pct NUMERIC(5, 2) NOT NULL DEFAULT 14.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE msp_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  season VARCHAR(50) NOT NULL,
  rate_per_quintal NUMERIC(10, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_msp_dates CHECK (effective_to >= effective_from),
  CONSTRAINT chk_msp_rate_positive CHECK (rate_per_quintal > 0)
);

CREATE INDEX idx_msp_crop_season ON msp_rates(crop_type_id, season);

CREATE TABLE farmer_produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  crop_variety_id UUID NULL REFERENCES crop_varieties(id) ON DELETE RESTRICT,
  harvest_season VARCHAR(50) NOT NULL,
  estimated_yield_kg NUMERIC(10, 2) NOT NULL,
  declared_quantity_kg NUMERIC(10, 2) NOT NULL,
  procured_quantity_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'DECLARED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_declared_qty_positive CHECK (declared_quantity_kg > 0),
  CONSTRAINT chk_procured_qty_valid CHECK (procured_quantity_kg <= declared_quantity_kg)
);

CREATE INDEX idx_farmer_produce_farmer ON farmer_produce(farmer_id);

-- -----------------------------------------------------------------------------
-- 5. PROCUREMENT CENTRE DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE procurement_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  district VARCHAR(100) NOT NULL,
  sub_district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  address_text TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  contact_phone VARCHAR(15) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_centres_district ON procurement_centres(district);
CREATE INDEX idx_centres_status ON procurement_centres(status);

CREATE TABLE centre_operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_operating BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_day UNIQUE (centre_id, day_of_week),
  CONSTRAINT chk_day_of_week CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_open_close_times CHECK (close_time > open_time)
);

CREATE TABLE centre_supported_crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  daily_max_intake_kg NUMERIC(12, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_supported_crop UNIQUE (centre_id, crop_type_id)
);

CREATE TABLE centre_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  description VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_holiday UNIQUE (centre_id, holiday_date)
);

CREATE TABLE centre_capacity_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  slot_id UUID NULL,
  capacity_delta INTEGER NOT NULL,
  reason_code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capacity_adj_centre_date ON centre_capacity_adjustments(centre_id, effective_date);

-- -----------------------------------------------------------------------------
-- 6. STAFF & EQUIPMENT DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE centre_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  assignment_role VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_from DATE NOT NULL,
  assigned_until DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_staff_active_assignment UNIQUE (user_id, centre_id, is_active)
);

CREATE INDEX idx_staff_centre ON centre_staff(centre_id);

CREATE TABLE equipment_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  equipment_code VARCHAR(50) NOT NULL UNIQUE,
  equipment_type VARCHAR(50) NOT NULL,
  make_model VARCHAR(150) NULL,
  serial_number VARCHAR(100) NULL,
  calibration_date DATE NULL,
  next_calibration_due DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_centre ON equipment_registry(centre_id);

CREATE TABLE equipment_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_registry(id) ON DELETE CASCADE,
  fault_reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reported_by UUID NOT NULL REFERENCES users(id),
  fault_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL REFERENCES users(id),
  resolution_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. SCHEDULING DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_capacity INTEGER NOT NULL,
  confirmed_count INTEGER NOT NULL DEFAULT 0,
  available_capacity INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_centre_crop_slot UNIQUE (centre_id, crop_type_id, slot_date, start_time),
  CONSTRAINT chk_slot_times CHECK (end_time > start_time),
  CONSTRAINT chk_slot_capacity_non_negative CHECK (available_capacity >= 0),
  CONSTRAINT chk_slot_capacity_math CHECK (total_capacity = available_capacity + confirmed_count)
);

CREATE INDEX idx_slots_search ON slots(centre_id, slot_date, status);
CREATE INDEX idx_slots_available ON slots(centre_id, crop_type_id, slot_date) WHERE status = 'ACTIVE' AND available_capacity > 0;

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference_id VARCHAR(30) NOT NULL UNIQUE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  declared_weight_kg NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
  idempotency_key VARCHAR(100) NULL UNIQUE,
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

-- -----------------------------------------------------------------------------
-- 8. TOKEN / QUEUE DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code VARCHAR(50) NOT NULL UNIQUE,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  hmac_signature VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_code ON tokens(token_code);
CREATE INDEX idx_tokens_booking ON tokens(booking_id);

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  checked_in_by UUID NOT NULL REFERENCES users(id),
  verification_method VARCHAR(50) NOT NULL DEFAULT 'QR_SCAN',
  checkin_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  device_metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checkins_centre_time ON checkins(centre_id, checkin_timestamp);

CREATE TABLE queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE RESTRICT,
  queue_number INTEGER NOT NULL,
  priority_score NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
  called_at TIMESTAMPTZ NULL,
  service_started_at TIMESTAMPTZ NULL,
  service_completed_at TIMESTAMPTZ NULL,
  estimated_wait_minutes INTEGER NULL,
  assigned_station_id VARCHAR(50) NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_queue_active ON queue_entries(centre_id, status) WHERE status IN ('WAITING', 'CALLED', 'PROCESSING');
CREATE INDEX idx_queue_booking ON queue_entries(booking_id);

CREATE TABLE queue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID NOT NULL REFERENCES queue_entries(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_queue_events_entry ON queue_events(queue_entry_id);

-- -----------------------------------------------------------------------------
-- 9. WEIGHMENT & QUALITY DOMAIN
-- -----------------------------------------------------------------------------
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
  status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
  version INTEGER NOT NULL DEFAULT 1,
  weighed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_gross_weight_positive CHECK (gross_weight_kg > 0),
  CONSTRAINT chk_tare_weight_valid CHECK (tare_weight_kg >= 0),
  CONSTRAINT chk_net_weight_positive CHECK (gross_weight_kg > tare_weight_kg)
);

CREATE INDEX idx_weighment_booking ON weighment_records(booking_id);

CREATE TABLE weighment_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weighment_record_id UUID NOT NULL REFERENCES weighment_records(id) ON DELETE RESTRICT,
  original_gross_weight_kg NUMERIC(10, 3) NOT NULL,
  original_tare_weight_kg NUMERIC(10, 3) NOT NULL,
  corrected_gross_weight_kg NUMERIC(10, 3) NOT NULL,
  corrected_tare_weight_kg NUMERIC(10, 3) NOT NULL,
  correction_reason TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  inspector_id UUID NOT NULL REFERENCES users(id),
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  crop_variety_id UUID NULL REFERENCES crop_varieties(id) ON DELETE RESTRICT,
  moisture_percentage NUMERIC(5, 2) NOT NULL,
  foreign_matter_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  damaged_grains_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  quality_grade VARCHAR(30) NOT NULL,
  deduction_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'PASSED',
  rejection_reason TEXT NULL,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_moisture_range CHECK (moisture_percentage BETWEEN 0.00 AND 100.00),
  CONSTRAINT chk_deduction_range CHECK (deduction_percentage BETWEEN 0.00 AND 100.00)
);

CREATE INDEX idx_quality_booking ON quality_inspections(booking_id);

-- -----------------------------------------------------------------------------
-- 10. PROCUREMENT & PAYMENT DOMAIN
-- -----------------------------------------------------------------------------
CREATE TABLE procurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_reference_id VARCHAR(30) NOT NULL UNIQUE,
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
  rate_per_kg NUMERIC(10, 4) NOT NULL,
  gross_payable_amount NUMERIC(12, 2) NOT NULL,
  total_deductions_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  net_payable_amount NUMERIC(12, 2) GENERATED ALWAYS AS (gross_payable_amount - total_deductions_amount) STORED,
  status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
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

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference_id VARCHAR(30) NOT NULL UNIQUE,
  procurement_id UUID NOT NULL UNIQUE REFERENCES procurements(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  bank_account_id UUID NOT NULL REFERENCES farmer_bank_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  provider VARCHAR(50) NOT NULL DEFAULT 'MOCK_BANK',
  provider_transaction_ref VARCHAR(100) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  failure_reason TEXT NULL,
  initiated_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_farmer ON payments(farmer_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  provider_response_code VARCHAR(50) NULL,
  provider_payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_events_payment ON payment_events(payment_id);

-- -----------------------------------------------------------------------------
-- 11. NOTIFICATIONS & IDEMPOTENCY
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

CREATE TABLE idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_path VARCHAR(255) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_status_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_idempotency_key ON idempotency_records(idempotency_key);

-- -----------------------------------------------------------------------------
-- 12. AUDIT LOGS (PARTITIONED)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  request_id VARCHAR(100) NOT NULL,
  actor_id UUID NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  centre_id UUID NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

COMMIT;
