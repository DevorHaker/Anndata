# 10 — DATA REQUIREMENTS

## SmartProcure: Conceptual and Logical Data Entity Analysis

_This is a logical requirements document. SQL table design is a Phase 2 deliverable._

---

## 1. Entity Overview

The following entities are central to the SmartProcure data model:

```
Users → Roles → Permissions
Farmers → FarmerProfiles → Documents
Farmers → ProduceBatches → CropTypes
ProcurementCentres → Slots → Bookings → Tokens
Bookings → QueueEntries
Procurements → Weighments → QualityInspections → ProcurementDecisions
Procurements → Payments
Centres → Equipment → EquipmentMaintenance
Centres → Staff → StaffAssignments
Recommendations → PredictionLogs
Notifications → NotificationDeliveryLogs
AuditLogs
SystemConfigurations
Exceptions
NoShowRecords
Reschedules
```

---

## 2. Entity Definitions

### 2.1 Users

**Purpose:** Central identity store for all accounts across all roles.

| Field                 | Type         | Description                                                | Sensitivity                  |
| --------------------- | ------------ | ---------------------------------------------------------- | ---------------------------- |
| user_id               | UUID         | Primary key                                                | None                         |
| mobile_number         | String       | Unique login identifier                                    | Medium (masked in logs)      |
| email                 | String       | Optional; secondary identifier                             | Medium                       |
| password_hash         | String       | bcrypt hash                                                | HIGH — never returned in API |
| role                  | Enum         | FARMER / OFFICER / MANAGER / DISTRICT_ADMIN / SYSTEM_ADMIN | None                         |
| status                | Enum         | PENDING / ACTIVE / LOCKED / SUSPENDED / DEACTIVATED        | None                         |
| failed_login_attempts | Integer      | Counter                                                    | None                         |
| locked_until          | Timestamp    | Lock expiry                                                | None                         |
| last_login_at         | Timestamp    | Analytics                                                  | None                         |
| created_at            | Timestamp    | Audit                                                      | None                         |
| created_by            | UUID → Users | Who created this account                                   | Audit                        |

**Relationships:**

- One User → One FarmerProfile (if role = FARMER)
- One User → Many Bookings (via FarmerProfile)
- One User → Many AuditLogs (as actor)

**Retention:** User records are soft-deleted (status = DEACTIVATED). Identity data retained 7 years for audit.

---

### 2.2 FarmerProfiles

**Purpose:** Extended profile for farmers including personal, land, and financial details.

| Field                      | Type         | Description                      | Sensitivity |
| -------------------------- | ------------ | -------------------------------- | ----------- |
| profile_id                 | UUID         | Primary key                      | None        |
| user_id                    | UUID → Users | Owner                            | None        |
| full_name                  | String       | Display name                     | Medium      |
| father_name                | String       |                                  | Medium      |
| date_of_birth              | Date         |                                  | Medium      |
| gender                     | Enum         |                                  | None        |
| address_full               | Text         |                                  | Medium      |
| district                   | String       | For routing/recommendation       | None        |
| gps_latitude               | Decimal      | Optional                         | None        |
| gps_longitude              | Decimal      | Optional                         | None        |
| aadhaar_number_encrypted   | String       | Encrypted at rest                | HIGH        |
| farmer_registration_number | String       | Government-issued                | Medium      |
| land_area_acres            | Decimal      |                                  | None        |
| bank_account_encrypted     | String       | Encrypted at rest                | HIGH        |
| bank_ifsc                  | String       |                                  | Medium      |
| bank_name                  | String       |                                  | None        |
| bank_account_holder        | String       |                                  | Medium      |
| profile_completion_pct     | Integer      | Calculated field                 | None        |
| verification_status        | Enum         | UNVERIFIED / VERIFIED / REJECTED | None        |
| verified_by                | UUID → Users | Admin who verified               | Audit       |
| verified_at                | Timestamp    |                                  | Audit       |
| no_show_count              | Integer      | Consecutive no-show counter      | None        |
| booking_suspended          | Boolean      |                                  | None        |

**Data Sensitivity:** Bank account and Aadhaar are stored encrypted (AES-256). They are never returned in API responses in unmasked form.

**Ownership:** Farmer owns their own profile data. Right to access, correct, export (GDPR-equivalent compliance).

---

### 2.3 Documents

**Purpose:** Store references to uploaded identity and land documents.

| Field              | Type                  | Description                                           | Sensitivity |
| ------------------ | --------------------- | ----------------------------------------------------- | ----------- |
| document_id        | UUID                  | Primary key                                           | None        |
| farmer_id          | UUID → FarmerProfiles | Owner                                                 | None        |
| document_type      | Enum                  | AADHAAR / LAND_RECORD / BANK_PASSBOOK / PHOTO / OTHER | None        |
| storage_key        | String                | Object storage key (not public URL)                   | Medium      |
| file_name_original | String                |                                                       | None        |
| upload_timestamp   | Timestamp             |                                                       | None        |
| verified           | Boolean               | Admin-verified                                        | None        |

**Retention:** Documents deleted (from storage) only upon explicit farmer account deletion request, subject to legal retention requirements.

---

### 2.4 CropTypes (Master List)

**Purpose:** System-managed list of all recognised crop types.

| Field                          | Type    | Description                                 |
| ------------------------------ | ------- | ------------------------------------------- |
| crop_id                        | UUID    | Primary key                                 |
| crop_name                      | String  | Official name                               |
| crop_code                      | String  | Short code (e.g., WHEAT, RICE)              |
| category                       | String  | Cereal / Oilseed / Pulse / Vegetable / etc. |
| default_moisture_threshold_pct | Decimal | Quality threshold                           |
| default_impurity_threshold_pct | Decimal | Quality threshold                           |
| default_deduction_rate         | Decimal | For net weight calculation                  |
| is_active                      | Boolean |                                             |

---

### 2.5 ProduceBatches

**Purpose:** Farmer-declared produce intended for procurement in a booking.

| Field                 | Type                  | Description                                                     |
| --------------------- | --------------------- | --------------------------------------------------------------- |
| batch_id              | UUID                  | Primary key                                                     |
| farmer_id             | UUID → FarmerProfiles | Owner                                                           |
| booking_id            | UUID → Bookings       | Linked booking (nullable before booking)                        |
| crop_id               | UUID → CropTypes      |                                                                 |
| variety               | String                | Optional                                                        |
| estimated_quantity_kg | Decimal               | Self-declared                                                   |
| harvest_date          | Date                  |                                                                 |
| storage_type          | String                | Optional                                                        |
| self_declared_grade   | String                | Optional                                                        |
| status                | Enum                  | DECLARED / BOOKED / IN_PROCUREMENT / APPROVED / REJECTED / PAID |
| created_at            | Timestamp             |                                                                 |

---

### 2.6 ProcurementCentres

**Purpose:** Registry of all procurement centres.

| Field              | Type             | Description                                                                                 |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------- |
| centre_id          | UUID             | Primary key                                                                                 |
| centre_name        | String           |                                                                                             |
| address            | Text             |                                                                                             |
| district           | String           |                                                                                             |
| state              | String           |                                                                                             |
| gps_latitude       | Decimal          |                                                                                             |
| gps_longitude      | Decimal          |                                                                                             |
| contact_number     | String           |                                                                                             |
| email              | String           | Optional                                                                                    |
| manager_id         | UUID → Users     | Assigned manager                                                                            |
| district_id        | UUID → Districts |                                                                                             |
| operational_status | Enum             | ACTIVE / REDUCED_CAPACITY / CONGESTED / TEMPORARILY_CLOSED / SUSPENDED / PERMANENTLY_CLOSED |
| daily_capacity     | Integer          | Configured max per day                                                                      |
| congestion_status  | Enum             | NORMAL / YELLOW / RED                                                                       |
| created_at         | Timestamp        |                                                                                             |
| created_by         | UUID → Users     |                                                                                             |

---

### 2.7 Slots

**Purpose:** Time slot definitions for a centre on a specific date.

| Field              | Type                      | Description                           |
| ------------------ | ------------------------- | ------------------------------------- |
| slot_id            | UUID                      | Primary key                           |
| centre_id          | UUID → ProcurementCentres |                                       |
| slot_date          | Date                      |                                       |
| start_time         | Time                      |                                       |
| end_time           | Time                      |                                       |
| capacity           | Integer                   | Max bookings for this slot            |
| confirmed_bookings | Integer                   | Atomic counter                        |
| checked_in_count   | Integer                   |                                       |
| completed_count    | Integer                   |                                       |
| status             | Enum                      | AVAILABLE / FULL / CLOSED / CANCELLED |
| cancelled_reason   | Text                      | If status = CANCELLED                 |
| created_by         | UUID → Users              |                                       |

---

### 2.8 Bookings

**Purpose:** Farmer appointment at a specific centre and slot.

| Field               | Type                      | Description                                                                                                       |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| booking_id          | UUID                      | Primary key                                                                                                       |
| farmer_id           | UUID → FarmerProfiles     |                                                                                                                   |
| centre_id           | UUID → ProcurementCentres |                                                                                                                   |
| slot_id             | UUID → Slots              |                                                                                                                   |
| booking_date        | Date                      |                                                                                                                   |
| produce_batch_id    | UUID → ProduceBatches     |                                                                                                                   |
| status              | Enum                      | CONFIRMED / CHECKED_IN / IN_QUEUE / CALLED / PROCESSING / COMPLETED / CANCELLED / NO_SHOW / RESCHEDULED / EXPIRED |
| cancellation_reason | Text                      |                                                                                                                   |
| cancelled_by        | UUID → Users              |                                                                                                                   |
| reschedule_count    | Integer                   | Default 0                                                                                                         |
| original_booking_id | UUID → Bookings           | If rescheduled                                                                                                    |
| created_at          | Timestamp                 |                                                                                                                   |
| confirmed_at        | Timestamp                 |                                                                                                                   |

---

### 2.9 Tokens

**Purpose:** Digital QR tokens for farmer identification at check-in.

| Field        | Type                      | Description                                                       |
| ------------ | ------------------------- | ----------------------------------------------------------------- |
| token_id     | UUID                      | Primary key                                                       |
| booking_id   | UUID → Bookings           | One-to-one                                                        |
| farmer_id    | UUID → FarmerProfiles     |                                                                   |
| centre_id    | UUID → ProcurementCentres |                                                                   |
| slot_id      | UUID → Slots              |                                                                   |
| token_date   | Date                      |                                                                   |
| payload_hash | String                    | HMAC-SHA256 signature                                             |
| status       | Enum                      | GENERATED / ACTIVE / USED / EXPIRED / INVALIDATED / FRAUD_FLAGGED |
| issued_at    | Timestamp                 |                                                                   |
| expires_at   | Timestamp                 |                                                                   |
| used_at      | Timestamp                 | Null if not used                                                  |
| nonce        | String                    | Unique per token                                                  |

---

### 2.10 QueueEntries

**Purpose:** Live queue tracking for each checked-in farmer.

| Field                   | Type                      | Description                                                                                |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| queue_entry_id          | UUID                      | Primary key                                                                                |
| booking_id              | UUID → Bookings           |                                                                                            |
| farmer_id               | UUID → FarmerProfiles     |                                                                                            |
| centre_id               | UUID → ProcurementCentres |                                                                                            |
| slot_id                 | UUID → Slots              |                                                                                            |
| queue_date              | Date                      |                                                                                            |
| position                | Integer                   | Queue order                                                                                |
| status                  | Enum                      | WAITING / CALLED / SKIPPED / WAITING_AGAIN / IN_SERVICE / COMPLETED / LEFT_QUEUE / REMOVED |
| check_in_timestamp      | Timestamp                 |                                                                                            |
| called_timestamp        | Timestamp                 | Null until CALLED                                                                          |
| service_start_timestamp | Timestamp                 |                                                                                            |
| service_end_timestamp   | Timestamp                 |                                                                                            |
| eta_minutes             | Integer                   | Last calculated ETA                                                                        |
| skipped_count           | Integer                   |                                                                                            |

---

### 2.11 Procurements

**Purpose:** Central procurement workflow record linking weighing, inspection, and decision.

| Field                | Type                      | Description                                                                                               |
| -------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| procurement_id       | UUID                      | Primary key                                                                                               |
| booking_id           | UUID → Bookings           |                                                                                                           |
| farmer_id            | UUID → FarmerProfiles     |                                                                                                           |
| centre_id            | UUID → ProcurementCentres |                                                                                                           |
| officer_id           | UUID → Users              | Assigned officer                                                                                          |
| produce_batch_id     | UUID → ProduceBatches     |                                                                                                           |
| status               | Enum                      | INITIATED / WEIGHING / INSPECTING / PENDING_DECISION / APPROVED / REJECTED / ON_HOLD / CANCELLED / CLOSED |
| gross_weight_kg      | Decimal                   | From weighing records                                                                                     |
| net_weight_kg        | Decimal                   | Calculated                                                                                                |
| quality_grade        | String                    | From inspection                                                                                           |
| msp_rate_at_approval | Decimal                   | Snapshot                                                                                                  |
| calculated_amount    | Decimal                   |                                                                                                           |
| rejection_reason     | String                    |                                                                                                           |
| hold_reason          | String                    |                                                                                                           |
| approved_by          | UUID → Users              |                                                                                                           |
| approved_at          | Timestamp                 |                                                                                                           |
| initiated_at         | Timestamp                 |                                                                                                           |
| completed_at         | Timestamp                 |                                                                                                           |

---

### 2.12 Weighments

**Purpose:** Individual weighing records linked to a procurement.

| Field                 | Type                | Description                  |
| --------------------- | ------------------- | ---------------------------- |
| weighment_id          | UUID                | Primary key                  |
| procurement_id        | UUID → Procurements |                              |
| equipment_id          | UUID → Equipment    |                              |
| officer_id            | UUID → Users        |                              |
| gross_weight_kg       | Decimal             |                              |
| bag_count             | Integer             |                              |
| deduction_rate        | Decimal             | Snapshot at time of weighing |
| net_weight_kg         | Decimal             | Calculated                   |
| record_type           | Enum                | ORIGINAL / CORRECTION        |
| original_weighment_id | UUID → Weighments   | If correction                |
| correction_reason     | Text                | If correction                |
| approved_by           | UUID → Users        | If correction                |
| timestamp             | Timestamp           | Server-generated             |

---

### 2.13 QualityInspections

**Purpose:** Quality assessment record for each procurement.

| Field                  | Type                      | Description                |
| ---------------------- | ------------------------- | -------------------------- |
| inspection_id          | UUID                      | Primary key                |
| procurement_id         | UUID → Procurements       |                            |
| inspector_id           | UUID → Users              |                            |
| moisture_pct           | Decimal                   |                            |
| impurity_pct           | Decimal                   |                            |
| grade                  | Enum                      | A / B / C / REJECTED       |
| auto_fail              | Boolean                   | System-triggered fail flag |
| override               | Boolean                   | Manager-overridden         |
| override_by            | UUID → Users              |                            |
| override_reason        | Text                      |                            |
| rejection_reason       | String                    | If rejected                |
| record_type            | Enum                      | ORIGINAL / CORRECTION      |
| original_inspection_id | UUID → QualityInspections | If correction              |
| timestamp              | Timestamp                 |                            |

---

### 2.14 Payments

**Purpose:** Track payment lifecycle for each approved procurement.

| Field               | Type                  | Description                                                                              | Sensitivity |
| ------------------- | --------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| payment_id          | UUID                  | Primary key                                                                              | None        |
| procurement_id      | UUID → Procurements   |                                                                                          | None        |
| farmer_id           | UUID → FarmerProfiles |                                                                                          | None        |
| amount              | Decimal               |                                                                                          | None        |
| currency            | String                | INR                                                                                      | None        |
| bank_account_masked | String                | Last 4 digits only                                                                       | None        |
| bank_ifsc_snapshot  | String                |                                                                                          | None        |
| bank_name_snapshot  | String                |                                                                                          | None        |
| status              | Enum                  | PENDING / INITIATED / PROCESSING / COMPLETED / FAILED / RETRYING / INTERVENTION_REQUIRED | None        |
| payment_reference   | String                | Provider UTR / transaction ID                                                            | None        |
| initiated_at        | Timestamp             |                                                                                          | Audit       |
| completed_at        | Timestamp             |                                                                                          | Audit       |
| failure_reason      | String                |                                                                                          | None        |
| retry_count         | Integer               |                                                                                          | None        |
| initiated_by        | UUID → Users          | Manager who triggered                                                                    | Audit       |

---

### 2.15 Equipment

**Purpose:** Centre equipment registry.

| Field                 | Type                      | Description                                                      |
| --------------------- | ------------------------- | ---------------------------------------------------------------- |
| equipment_id          | UUID                      | Primary key                                                      |
| centre_id             | UUID → ProcurementCentres |                                                                  |
| equipment_name        | String                    |                                                                  |
| equipment_type        | Enum                      | WEIGHING_MACHINE / MOISTURE_METER / CONVEYOR / GENERATOR / OTHER |
| serial_number         | String                    | Optional                                                         |
| status                | Enum                      | OPERATIONAL / FAULTY / UNDER_MAINTENANCE / DECOMMISSIONED        |
| last_maintenance_date | Date                      |                                                                  |
| installed_date        | Date                      |                                                                  |
| notes                 | Text                      |                                                                  |

---

### 2.16 Staff

**Purpose:** Staff accounts linked to centres.

| Field           | Type                      | Description                                         |
| --------------- | ------------------------- | --------------------------------------------------- |
| staff_id        | UUID                      | Primary key (same as user_id for officers/managers) |
| user_id         | UUID → Users              |                                                     |
| centre_id       | UUID → ProcurementCentres |                                                     |
| designated_role | Enum                      | WELCOMING / WEIGHING / INSPECTION / APPROVAL        |
| is_active       | Boolean                   |                                                     |
| joined_date     | Date                      |                                                     |

---

### 2.17 Notifications

**Purpose:** Record of all notifications generated by the system.

| Field           | Type         | Description                                                |
| --------------- | ------------ | ---------------------------------------------------------- |
| notification_id | UUID         | Primary key                                                |
| recipient_id    | UUID → Users |                                                            |
| event_type      | String       | BOOKING_CONFIRMED / PAYMENT_COMPLETED / etc.               |
| priority        | Enum         | HIGH / MEDIUM / LOW                                        |
| channel         | Enum         | IN_APP / SMS / EMAIL / PUSH                                |
| content_body    | Text         | Rendered from template                                     |
| status          | Enum         | QUEUED / SENDING / DELIVERED / FAILED / PERMANENTLY_FAILED |
| retry_count     | Integer      |                                                            |
| created_at      | Timestamp    |                                                            |
| delivered_at    | Timestamp    | Null until delivered                                       |
| entity_type     | String       | Related entity (BOOKING, PAYMENT, etc.)                    |
| entity_id       | UUID         | Related entity ID                                          |

---

### 2.18 AuditLogs

**Purpose:** Immutable audit trail for all sensitive operations.

| Field        | Type         | Description            |
| ------------ | ------------ | ---------------------- |
| audit_id     | UUID         | Primary key            |
| actor_id     | UUID → Users | Performing user        |
| actor_role   | Enum         | Role at time of action |
| action       | String       | Named action type      |
| entity_type  | String       |                        |
| entity_id    | UUID         |                        |
| before_state | JSONB        |                        |
| after_state  | JSONB        |                        |
| timestamp    | Timestamp    | UTC; server-generated  |
| ip_address   | String       |                        |
| request_id   | UUID         | For trace correlation  |

**Retention:** 7 years minimum. Never deleted.

---

### 2.19 Recommendations

**Purpose:** Logged output of recommendation engine for analytics and model training.

| Field              | Type                      | Description                    |
| ------------------ | ------------------------- | ------------------------------ |
| recommendation_id  | UUID                      | Primary key                    |
| farmer_id          | UUID → FarmerProfiles     |                                |
| requested_at       | Timestamp                 |                                |
| input_parameters   | JSONB                     | Location, crop, date, quantity |
| results            | JSONB                     | Full ranked list output        |
| engine_version     | String                    |                                |
| accepted_centre_id | UUID → ProcurementCentres | Null if farmer ignored         |
| accepted_at        | Timestamp                 |                                |

---

### 2.20 SystemConfigurations

**Purpose:** Dynamic system settings managed without code changes.

| Field        | Type         | Description                                     |
| ------------ | ------------ | ----------------------------------------------- |
| config_id    | UUID         | Primary key                                     |
| config_key   | String       | Hierarchical key (e.g., `booking.advance_days`) |
| config_value | String       | Serialised value                                |
| scope        | Enum         | SYSTEM / DISTRICT / CENTRE                      |
| scope_id     | UUID         | District or Centre ID (null for SYSTEM)         |
| updated_by   | UUID → Users |                                                 |
| updated_at   | Timestamp    |                                                 |
| is_active    | Boolean      |                                                 |

---

## 3. Entity Relationship Summary (Logical)

```
User (1) ──── (0,1) FarmerProfile
FarmerProfile (1) ──── (*) ProduceBatches
FarmerProfile (1) ──── (*) Bookings
FarmerProfile (1) ──── (*) Documents
Booking (1) ──── (0,1) Token
Booking (1) ──── (0,1) QueueEntry
Booking (1) ──── (0,1) Procurement
Procurement (1) ──── (*) Weighments
Procurement (1) ──── (0,1) QualityInspection
Procurement (1) ──── (0,1) Payment
ProcurementCentre (1) ──── (*) Slots
ProcurementCentre (1) ──── (*) Equipment
ProcurementCentre (1) ──── (*) Staff
Slot (1) ──── (*) Bookings
CropType (1) ──── (*) ProduceBatches
```

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
