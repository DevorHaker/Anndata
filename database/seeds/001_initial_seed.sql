-- =============================================================================
-- SMARTPROCURE: DEVELOPMENT SEED DATA (001_initial_seed.sql)
-- =============================================================================

BEGIN;

-- 1. SYSTEM ROLES
INSERT INTO roles (id, code, name, description, is_system) VALUES
  ('00000000-0000-4000-8000-000000000001', 'ADMIN', 'System Administrator', 'Full system management and configuration access', true),
  ('00000000-0000-4000-8000-000000000002', 'FARMER', 'Farmer', 'Registered farmer booking slots and tracking procurement', true),
  ('00000000-0000-4000-8000-000000000003', 'CENTRE_OPERATOR', 'Centre Operator', 'Manages procurement centre operations and token check-ins', true),
  ('00000000-0000-4000-8000-000000000004', 'WEIGHBRIDGE_OPERATOR', 'Weighbridge Operator', 'Records gross and tare weights', true),
  ('00000000-0000-4000-8000-000000000005', 'QUALITY_INSPECTOR', 'Quality Inspector', 'Performs moisture and crop quality inspection', true),
  ('00000000-0000-4000-8000-000000000006', 'FINANCE_OFFICER', 'Finance Officer', 'Approves and processes DBT payment disbursements', true)
ON CONFLICT (code) DO NOTHING;

-- 2. SYSTEM PERMISSIONS
INSERT INTO permissions (id, code, module, description) VALUES
  ('00000000-0000-4000-9000-000000000001', 'READ_HEALTH', 'SYSTEM', 'Access system health and readiness endpoints'),
  ('00000000-0000-4000-9000-000000000002', 'MANAGE_USERS', 'IDENTITY', 'Manage user accounts and roles'),
  ('00000000-0000-4000-9000-000000000003', 'CREATE_BOOKING', 'SCHEDULING', 'Create produce procurement slot bookings'),
  ('00000000-0000-4000-9000-000000000004', 'VERIFY_CHECKIN', 'QUEUE', 'Perform farmer token check-in'),
  ('00000000-0000-4000-9000-000000000005', 'RECORD_WEIGHMENT', 'WEIGHMENT', 'Record produce weight measurements'),
  ('00000000-0000-4000-9000-000000000006', 'RECORD_QUALITY', 'QUALITY', 'Record produce quality inspection results'),
  ('00000000-0000-4000-9000-000000000007', 'APPROVE_PAYMENT', 'PAYMENT', 'Authorize procurement payment disbursement')
ON CONFLICT (code) DO NOTHING;

-- 3. CROP TYPES
INSERT INTO crop_types (id, code, name, category, default_unit, is_active) VALUES
  ('20000000-0000-4000-8000-000000000001', 'WHEAT', 'Wheat', 'CEREALS', 'KG', true),
  ('20000000-0000-4000-8000-000000000002', 'PADDY', 'Paddy (Rice)', 'CEREALS', 'KG', true),
  ('20000000-0000-4000-8000-000000000003', 'MAIZE', 'Maize', 'CEREALS', 'KG', true),
  ('20000000-0000-4000-8000-000000000004', 'GRAM', 'Gram (Chana)', 'PULSES', 'KG', true),
  ('20000000-0000-4000-8000-000000000005', 'MUSTARD', 'Mustard', 'OILSEEDS', 'KG', true)
ON CONFLICT (code) DO NOTHING;

-- 4. CROP VARIETIES
INSERT INTO crop_varieties (id, crop_type_id, code, name, max_acceptable_moisture_pct) VALUES
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'WHEAT_SHARBATI', 'Sharbati Wheat', 12.00),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'WHEAT_HD2967', 'HD-2967 Wheat', 14.00),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'PADDY_BASMATI_1121', 'Basmati 1121', 14.00)
ON CONFLICT (code) DO NOTHING;

-- 5. MSP RATES
INSERT INTO msp_rates (id, crop_type_id, season, rate_per_quintal, effective_from, effective_to) VALUES
  ('22000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'RABI_2026', 2275.00, '2026-01-01', '2026-12-31'),
  ('22000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'KHARIF_2026', 2183.00, '2026-01-01', '2026-12-31')
ON CONFLICT DO NOTHING;

-- 6. DEMO PROCUREMENT CENTRE
INSERT INTO procurement_centres (
  id, centre_code, name, district, sub_district, state, pincode, address_text, latitude, longitude, contact_phone, status
) VALUES (
  '33333333-3333-4000-8000-333333333333',
  'PC-KARNAL-001',
  'Karnal Central Procurement Mandi',
  'Karnal',
  'Karnal Tehsil',
  'Haryana',
  '132001',
  'Mandi Complex, GT Road, Karnal, Haryana',
  29.68570000,
  76.99050000,
  '+919876543210',
  'ACTIVE'
) ON CONFLICT (centre_code) DO NOTHING;

-- 7. DEMO USERS
INSERT INTO users (id, mobile_number, password_hash, role_id, status) VALUES
  ('10000000-0000-4000-8000-000000000001', '+919999900001', '$2b$10$abcdefghijklmnopqrstuv', '00000000-0000-4000-8000-000000000001', 'ACTIVE'),
  ('10000000-0000-4000-8000-000000000002', '+919999900002', '$2b$10$abcdefghijklmnopqrstuv', '00000000-0000-4000-8000-000000000002', 'ACTIVE')
ON CONFLICT (mobile_number) DO NOTHING;

-- 8. DEMO FARMER PROFILE
INSERT INTO farmers (id, user_id, farmer_reference_id, first_name, last_name, verification_status, status) VALUES
  ('11111111-1111-4000-8000-111111111111', '10000000-0000-4000-8000-000000000002', 'FARM-2026-9821', 'Ramesh', 'Kumar', 'VERIFIED', 'ACTIVE')
ON CONFLICT (farmer_reference_id) DO NOTHING;

INSERT INTO farmer_profiles (id, farmer_id, village_name, sub_district, district, state, pincode, land_holding_acres) VALUES
  ('12000000-0000-4000-8000-000000000001', '11111111-1111-4000-8000-111111111111', 'Kachhwa', 'Karnal Tehsil', 'Karnal', 'Haryana', '132001', 8.50)
ON CONFLICT (farmer_id) DO NOTHING;

COMMIT;
