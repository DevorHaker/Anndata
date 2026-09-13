-- =============================================================================
-- SMARTPROCURE: DEVELOPMENT SEED DATA FOR PHASE 6 (002_phase6_seed.sql)
-- =============================================================================

BEGIN;

-- 1. ADDITIONAL DEMO PROCUREMENT CENTRES
INSERT INTO procurement_centres (
  id, centre_code, name, district, sub_district, state, pincode, address_text, latitude, longitude, contact_phone, status
) VALUES 
(
  '33333333-3333-4000-8000-333333333334',
  'PC-PANIPAT-002',
  'Panipat Grain Procurement Centre',
  'Panipat',
  'Panipat Tehsil',
  'Haryana',
  '132103',
  'G T Road, Industrial Area, Panipat, Haryana',
  29.39090000,
  76.96350000,
  '+919876543211',
  'ACTIVE'
),
(
  '33333333-3333-4000-8000-333333333335',
  'PC-AMBALA-003',
  'Ambala Cantt Agriculture Mandi',
  'Ambala',
  'Ambala Cantt',
  'Haryana',
  '133001',
  'Station Road Mandi Yard, Ambala Cantt, Haryana',
  30.37820000,
  76.77670000,
  '+919876543212',
  'ACTIVE'
) ON CONFLICT (centre_code) DO NOTHING;

-- 2. OPERATING HOURS FOR DEMO CENTRES
INSERT INTO centre_operating_hours (centre_id, day_of_week, open_time, close_time, slot_duration_minutes, is_operating) VALUES
  ('33333333-3333-4000-8000-333333333333', 1, '09:00:00', '17:00:00', 60, true),
  ('33333333-3333-4000-8000-333333333333', 2, '09:00:00', '17:00:00', 60, true),
  ('33333333-3333-4000-8000-333333333333', 3, '09:00:00', '17:00:00', 60, true),
  ('33333333-3333-4000-8000-333333333333', 4, '09:00:00', '17:00:00', 60, true),
  ('33333333-3333-4000-8000-333333333333', 5, '09:00:00', '17:00:00', 60, true),
  ('33333333-3333-4000-8000-333333333333', 6, '09:00:00', '13:00:00', 60, true),
  ('33333333-3333-4000-8000-333333333333', 0, '09:00:00', '17:00:00', 60, false)
ON CONFLICT (centre_id, day_of_week) DO NOTHING;

-- 3. CAPACITY CONFIGURATIONS
INSERT INTO centre_capacities (
  centre_id, daily_farmer_capacity, daily_quantity_capacity_kg, hourly_throughput_kg, weighing_station_count, counter_count
) VALUES (
  '33333333-3333-4000-8000-333333333333', 120, 60000.00, 6000.00, 3, 5
) ON CONFLICT (centre_id) DO NOTHING;

-- 4. SERVICES
INSERT INTO centre_services (centre_id, service_code, service_name, is_available) VALUES
  ('33333333-3333-4000-8000-333333333333', 'PROCUREMENT', 'Direct Grain Procurement', true),
  ('33333333-3333-4000-8000-333333333333', 'WEIGHBRIDGE', 'Electronic Weighment', true),
  ('33333333-3333-4000-8000-333333333333', 'QUALITY_TESTING', 'Lab Moisture & Quality Inspection', true),
  ('33333333-3333-4000-8000-333333333333', 'HELP_DESK', 'Farmer Registration & Assistance Desk', true)
ON CONFLICT (centre_id, service_code) DO NOTHING;

-- 5. SUPPORTED CROPS
INSERT INTO centre_supported_crops (centre_id, crop_type_id, daily_max_intake_kg, is_active) VALUES
  ('33333333-3333-4000-8000-333333333333', '20000000-0000-4000-8000-000000000001', 40000.00, true),
  ('33333333-3333-4000-8000-333333333333', '20000000-0000-4000-8000-000000000002', 30000.00, true)
ON CONFLICT (centre_id, crop_type_id) DO NOTHING;

-- 6. EQUIPMENT REGISTRY
INSERT INTO equipment_registry (
  id, centre_id, equipment_code, equipment_type, make_model, serial_number, status
) VALUES (
  '44444444-4444-4000-8000-444444444444',
  '33333333-3333-4000-8000-333333333333',
  'EQ-WB-01',
  'WEIGHBRIDGE',
  'Avery India 60T Electronic',
  'AV-2025-9982',
  'OPERATIONAL'
) ON CONFLICT (equipment_code) DO NOTHING;

COMMIT;
