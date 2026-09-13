# 25 — MASTER DATABASE CONSTRAINTS

## SmartProcure: Relational Rules, Foreign Keys, Unique Keys, and Business Invariants

---

## 1. Constraint Enforcement Architecture

Business invariants are guarded at the database layer using 4 explicit constraint mechanisms:

1. `NOT NULL`: Prevents missing required fields.
2. `FOREIGN KEY ... ON DELETE RESTRICT`: Guards against orphaned relational data.
3. `UNIQUE`: Prevents duplicate records, overbooking collisions, and double payments.
4. `CHECK`: Prevents invalid mathematical or logical states (negative weights, non-zero prices).

---

## 2. Master Constraints Inventory

| Entity / Table         | Constraint Name                  | Type     | Expression / Rule                                       | Architectural Purpose                                  |
| ---------------------- | -------------------------------- | -------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `users`                | `uq_users_mobile`                | `UNIQUE` | `mobile_number`                                         | Prevents duplicate user registrations.                 |
| `farmers`              | `uq_farmers_ref`                 | `UNIQUE` | `farmer_reference_id`                                   | Guarantees unique farmer public IDs.                   |
| `farmer_bank_accounts` | `uq_farmer_primary_bank`         | `UNIQUE` | `(farmer_id, is_primary)`                               | Guarantees exactly 1 primary bank account per farmer.  |
| `procurement_centres`  | `uq_centre_code`                 | `UNIQUE` | `centre_code`                                           | Guarantees unique public centre code.                  |
| `slots`                | `uq_centre_crop_slot`            | `UNIQUE` | `(centre_id, crop_type_id, slot_date, start_time)`      | Prevents duplicate slot definitions.                   |
| `slots`                | `chk_slot_capacity_non_negative` | `CHECK`  | `available_capacity >= 0`                               | **DB Enforcement of Zero Overbooking**.                |
| `slots`                | `chk_slot_capacity_math`         | `CHECK`  | `total_capacity = available_capacity + confirmed_count` | Guarantees mathematical capacity integrity.            |
| `bookings`             | `uq_bookings_ref`                | `UNIQUE` | `booking_reference_id`                                  | Guarantees unique booking reference ID.                |
| `bookings`             | `uq_bookings_idempotency`        | `UNIQUE` | `idempotency_key`                                       | Prevents duplicate booking creation on client retries. |
| `tokens`               | `uq_tokens_booking`              | `UNIQUE` | `booking_id`                                            | Enforces 1 active QR token per booking.                |
| `checkins`             | `uq_checkins_booking`            | `UNIQUE` | `booking_id`                                            | Prevents duplicate check-in scans.                     |
| `queue_entries`        | `uq_queue_booking`               | `UNIQUE` | `booking_id`                                            | Prevents duplicate queue placement.                    |
| `weighment_records`    | `chk_net_weight_positive`        | `CHECK`  | `gross_weight_kg > tare_weight_kg`                      | Prevents zero/negative net weights.                    |
| `procurements`         | `uq_procurements_booking`        | `UNIQUE` | `booking_id`                                            | Enforces 1 procurement record per booking.             |
| `payments`             | `uq_payments_procurement`        | `UNIQUE` | `procurement_id`                                        | **DB Enforcement of Zero Double Disbursement**.        |
| `msp_rates`            | `chk_msp_dates`                  | `CHECK`  | `effective_to >= effective_from`                        | Guarantees valid MSP rate date range.                  |

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
