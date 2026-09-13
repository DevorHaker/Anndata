# 30 — DATABASE TRANSACTION BOUNDARIES & ISOLATION

## SmartProcure: Step-by-Step Transaction Specifications (TX 01 – TX 10)

---

## 1. Master Transaction Inventory

| TX ID     | Transaction Purpose      | Isolation Level  | Primary Tables Mutated                               | Locking Mechanism                     |
| --------- | ------------------------ | ---------------- | ---------------------------------------------------- | ------------------------------------- |
| **TX-01** | Booking Creation         | `READ COMMITTED` | `slots`, `bookings`, `tokens`, `audit_logs`          | Row Lock on `slots`                   |
| **TX-02** | Booking Cancellation     | `READ COMMITTED` | `bookings`, `slots`, `tokens`, `booking_events`      | Row Lock on `bookings`, `slots`       |
| **TX-03** | Booking Rescheduling     | `READ COMMITTED` | `bookings`, `slots` (old/new), `reschedule_records`  | Row Lock on old/new `slots`           |
| **TX-04** | QR Gate Check-In         | `READ COMMITTED` | `tokens`, `bookings`, `checkins`, `queue_entries`    | Row Lock on `tokens`                  |
| **TX-05** | Queue State Transition   | `READ COMMITTED` | `queue_entries`, `queue_events`                      | Row Lock on `queue_entries`           |
| **TX-06** | Weighment Recording      | `READ COMMITTED` | `weighment_records`, `bookings`, `audit_logs`        | Unique Constraint                     |
| **TX-07** | Procurement Approval     | `READ COMMITTED` | `procurements`, `bookings`, `payments`, `audit_logs` | Unique Constraint on `procurements`   |
| **TX-08** | Payment Initiation       | `READ COMMITTED` | `payments`, `payment_events`                         | Unique Constraint on `procurement_id` |
| **TX-09** | Payment Callback Update  | `READ COMMITTED` | `payments`, `payment_events`, `procurements`         | Row Lock on `payments`                |
| **TX-10** | Centre Capacity Override | `READ COMMITTED` | `centre_capacity_adjustments`, `slots`               | Row Lock on `slots`                   |

---

## 2. Detailed Transaction Walkthrough: TX-07 (Procurement Approval)

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Read & Verify Weighment and Quality Status
SELECT id, net_weight_kg FROM weighment_records WHERE booking_id = 'b123' AND status = 'VERIFIED';
SELECT id, quality_grade, deduction_percentage FROM quality_inspections WHERE booking_id = 'b123' AND status = 'PASSED';

-- 2. Insert Canonical Procurement Record
INSERT INTO procurements (
  id, procurement_reference_id, booking_id, farmer_id, centre_id, weighment_id,
  quality_inspection_id, crop_type_id, gross_weight_kg, net_weight_kg, quality_deduction_kg,
  rate_per_kg, gross_payable_amount, total_deductions_amount, status, approved_by
) VALUES (
  gen_random_uuid(), 'PR-2026-00012984', 'b123', 'f456', 'c789', 'w111',
  'q222', 'cr1', 1050.000, 1000.000, 0.000,
  22.7500, 22750.00, 0.00, 'APPROVED', 'u_manager'
);

-- 3. Transition Booking Status to 'PROCESSING'
UPDATE bookings SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = 'b123';

-- 4. Create Initial Payment Record (Status: PENDING)
INSERT INTO payments (
  id, payment_reference_id, procurement_id, farmer_id, bank_account_id, amount, status
) VALUES (
  gen_random_uuid(), 'PAY-20260913-004812', 'pr_new', 'f456', 'bank_999', 22750.00, 'PENDING'
);

-- 5. Record Transactional Audit Log
INSERT INTO audit_logs (
  request_id, actor_id, actor_role, action, entity_type, entity_id, centre_id, after_state
) VALUES (
  'req_proc_01', 'u_manager', 'CENTRE_MANAGER', 'PROCUREMENT_APPROVED', 'PROCUREMENT', 'pr_new', 'c789', '{"amount": 22750.00}'
);

COMMIT;
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
