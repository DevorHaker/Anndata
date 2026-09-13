-- =============================================================================
-- SMARTPROCURE: REPRESENTATIVE VALIDATION SQL QUERIES (1–14)
-- =============================================================================

-- 1. Farmer's Upcoming Bookings
SELECT 
  b.id AS booking_id,
  b.booking_reference_id,
  c.name AS centre_name,
  cr.name AS crop_name,
  s.slot_date,
  s.start_time,
  s.end_time,
  t.token_code,
  b.status
FROM bookings b
JOIN procurement_centres c ON b.centre_id = c.id
JOIN crop_types cr ON b.crop_type_id = cr.id
JOIN slots s ON b.slot_id = s.id
LEFT JOIN tokens t ON b.id = t.booking_id
WHERE b.farmer_id = '11111111-1111-4000-8000-111111111111'
  AND b.status IN ('CONFIRMED', 'CHECKED_IN')
ORDER BY s.slot_date ASC, s.start_time ASC;

-- 2. Farmer's Complete Procurement & Booking History
SELECT 
  b.booking_reference_id,
  s.slot_date,
  c.name AS centre_name,
  p.final_accepted_weight_kg,
  p.net_payable_amount,
  pay.status AS payment_status
FROM bookings b
JOIN procurement_centres c ON b.centre_id = c.id
JOIN slots s ON b.slot_id = s.id
LEFT JOIN procurements p ON b.id = p.booking_id
LEFT JOIN payments pay ON p.id = pay.procurement_id
WHERE b.farmer_id = '11111111-1111-4000-8000-111111111111'
ORDER BY b.created_at DESC;

-- 3. Search Available Slots for a Centre & Crop
SELECT 
  id AS slot_id,
  slot_date,
  start_time,
  end_time,
  available_capacity,
  total_capacity
FROM slots
WHERE centre_id = '33333333-3333-4000-8000-333333333333'
  AND crop_type_id = '20000000-0000-4000-8000-000000000001'
  AND slot_date = '2026-09-15'
  AND status = 'ACTIVE'
  AND available_capacity > 0
ORDER BY start_time ASC;

-- 4. Current Live Queue Position & Wait Status for a Centre
SELECT 
  q.queue_number,
  t.token_code,
  f.first_name || ' ' || f.last_name AS farmer_name,
  q.status AS queue_status,
  q.estimated_wait_minutes,
  q.assigned_station_id
FROM queue_entries q
JOIN farmers f ON q.farmer_id = f.id
JOIN tokens t ON q.token_id = t.id
WHERE q.centre_id = '33333333-3333-4000-8000-333333333333'
  AND q.status IN ('WAITING', 'CALLED', 'PROCESSING')
ORDER BY q.priority_score DESC, q.created_at ASC;

-- 5. Count Farmers Ahead of a Specific Token Code
SELECT COUNT(*) AS farmers_ahead
FROM queue_entries q_target
JOIN queue_entries q_ahead 
  ON q_target.centre_id = q_ahead.centre_id 
 AND q_ahead.status = 'WAITING' 
 AND q_ahead.created_at < q_target.created_at
JOIN tokens t ON q_target.token_id = t.id
WHERE t.token_code = 'SP-9821-XK'
  AND q_target.status = 'WAITING';

-- 6. Centre Workload & Queue Summary Statistics
SELECT 
  c.id AS centre_id,
  c.name AS centre_name,
  COUNT(CASE WHEN q.status = 'WAITING' THEN 1 END) AS waiting_count,
  COUNT(CASE WHEN q.status = 'PROCESSING' THEN 1 END) AS processing_count,
  COUNT(CASE WHEN q.status = 'COMPLETED' THEN 1 END) AS completed_today_count
FROM procurement_centres c
LEFT JOIN queue_entries q ON c.id = q.centre_id AND (q.created_at AT TIME ZONE 'Asia/Kolkata')::DATE = CURRENT_DATE
WHERE c.id = '33333333-3333-4000-8000-333333333333'
GROUP BY c.id, c.name;

-- 7. Average Wait Time Analysis per Centre
SELECT 
  centre_id,
  AVG(EXTRACT(EPOCH FROM (service_started_at - created_at))/60)::NUMERIC(10,1) AS avg_wait_minutes
FROM queue_entries
WHERE status IN ('PROCESSING', 'COMPLETED')
  AND service_started_at IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY centre_id;

-- 8. Procurement Financial Totals per District
SELECT 
  c.district,
  cr.name AS crop_name,
  COUNT(p.id) AS total_procurements,
  SUM(p.final_accepted_weight_kg)/1000.0 AS total_metric_tons,
  SUM(p.net_payable_amount) AS total_payout_inr
FROM procurements p
JOIN procurement_centres c ON p.centre_id = c.id
JOIN crop_types cr ON p.crop_type_id = cr.id
WHERE p.status = 'APPROVED'
GROUP BY c.district, cr.name;

-- 9. Pending Disbursements Requiring Processing
SELECT 
  pay.id AS payment_id,
  pay.payment_reference_id,
  f.first_name || ' ' || f.last_name AS farmer_name,
  pay.amount,
  pay.status
FROM payments pay
JOIN farmers f ON pay.farmer_id = f.id
WHERE pay.status IN ('PENDING', 'RETRY_REQUIRED')
ORDER BY pay.created_at ASC
LIMIT 50;

-- 10. Failed Payments & Exception Analysis
SELECT 
  pay.payment_reference_id,
  f.farmer_reference_id,
  pay.amount,
  pay.failure_reason,
  pay.updated_at AS failed_at
FROM payments pay
JOIN farmers f ON pay.farmer_id = f.id
WHERE pay.status = 'FAILED'
ORDER BY pay.updated_at DESC;

-- 11. Centre Congestion Index Snapshot History
SELECT 
  snapshot_timestamp,
  waiting_queue_count,
  processing_count,
  average_wait_minutes,
  congestion_index,
  operational_status
FROM centre_congestion_snapshots
WHERE centre_id = '33333333-3333-4000-8000-333333333333'
ORDER BY snapshot_timestamp DESC
LIMIT 24;

-- 12. No-Show Rate Calculation per Centre
SELECT 
  centre_id,
  COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100.0 AS noshow_rate_pct
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY centre_id;

-- 13. Equipment Downtime & Fault Incident Logs
SELECT 
  eq.equipment_code,
  eq.equipment_type,
  c.name AS centre_name,
  log.fault_type,
  log.description,
  log.fault_reported_at,
  log.resolved_at
FROM equipment_maintenance_logs log
JOIN equipment_registry eq ON log.equipment_id = eq.id
JOIN procurement_centres c ON eq.centre_id = c.id
ORDER BY log.fault_reported_at DESC;

-- 14. Transactional Audit History for a Specific Booking
SELECT 
  a.created_at,
  a.actor_role,
  a.action,
  a.before_state,
  a.after_state,
  a.ip_address
FROM audit_logs a
WHERE a.entity_type = 'BOOKING'
  AND a.entity_id = '44444444-4444-4000-8000-444444444444'
ORDER BY a.created_at ASC;
