# 05 — FUNCTIONAL REQUIREMENTS

## SmartProcure: Complete Module-Level Functional Requirements

---

## MODULE 1 — Authentication and Account Management

### 1.1 Purpose

Manage user identity, authentication, session lifecycle, and account security across all roles.

### 1.2 Actors

Farmer, Procurement Officer, Centre Manager, District Admin, System Admin

### 1.3 Functional Requirements

| Req ID      | Requirement                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| FR-AUTH-001 | The system shall allow farmers to self-register via a public registration form                                |
| FR-AUTH-002 | Staff accounts (Officer, Manager, District Admin) shall be created only by System Admin or authorised Manager |
| FR-AUTH-003 | Every user account shall require a unique mobile number or email as login identifier                          |
| FR-AUTH-004 | The system shall support OTP-based login in addition to password-based login                                  |
| FR-AUTH-005 | The system shall enforce password complexity rules configurable by System Admin                               |
| FR-AUTH-006 | The system shall lock an account after N consecutive failed login attempts (N configurable)                   |
| FR-AUTH-007 | The system shall issue JWT access tokens on successful login                                                  |
| FR-AUTH-008 | Access tokens shall expire after a configurable TTL (default: 15 minutes)                                     |
| FR-AUTH-009 | The system shall issue refresh tokens with a configurable TTL (default: 7 days)                               |
| FR-AUTH-010 | All token refresh operations shall be logged                                                                  |
| FR-AUTH-011 | The system shall support explicit logout, invalidating the session                                            |
| FR-AUTH-012 | Forgotten password reset shall use OTP to the registered mobile/email                                         |
| FR-AUTH-013 | Password reset links shall expire after 10 minutes                                                            |
| FR-AUTH-014 | All login events (success and failure) shall be audit-logged                                                  |
| FR-AUTH-015 | Account lockout events shall trigger a notification to System Admin                                           |

### 1.4 Inputs

- Registration: name, mobile number, email, password, role
- Login: identifier (mobile/email) + password or OTP
- Password reset: identifier + OTP + new password

### 1.5 Outputs

- JWT access token + refresh token on successful login
- Account created confirmation
- Error messages with reason (without revealing whether account exists — security)

### 1.6 Business Rules

- BR-AUTH-001: Farmer registration is open (public endpoint); staff registration requires admin action
- BR-AUTH-002: Account lockout releases after N minutes or manual admin unlock
- BR-AUTH-003: OTP validity window is 5 minutes
- BR-AUTH-004: Concurrent sessions per user are limited to 3 (configurable)
- BR-AUTH-005: Refresh token rotation — new refresh token issued on each use; old token invalidated

### 1.7 Validation Rules

- Mobile number: 10-digit numeric, unique in system
- Email: valid RFC 5321 format, unique in system
- Password: minimum 8 characters, uppercase + numeric + special character

### 1.8 Error Cases

- Account not found → return generic "Invalid credentials" (never reveal existence)
- Account locked → return ACCOUNT_LOCKED with unlock time estimate
- OTP expired → TOKEN_EXPIRED error with option to resend
- Concurrent session limit exceeded → SESSION_LIMIT_EXCEEDED with list of active sessions

### 1.9 Audit Requirements

- LOGIN_SUCCESS: actor ID, IP, timestamp, device fingerprint
- LOGIN_FAILURE: attempted identifier, IP, timestamp, failure reason
- ACCOUNT_LOCKED: actor ID, IP, timestamp, attempt count
- PASSWORD_CHANGED: actor ID, timestamp, method (self / admin reset)
- ACCOUNT_CREATED: creator ID, new account ID, role, timestamp
- ROLE_CHANGED: System Admin ID, target account ID, old role, new role, timestamp

---

## MODULE 2 — Farmer Profile Management

### 2.1 Purpose

Capture and maintain complete farmer profile including personal details, land information, bank details, and identity documents.

### 2.2 Actors

Farmer (primary), System Admin (management)

### 2.3 Functional Requirements

| Req ID        | Requirement                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------- |
| FR-FARMER-001 | A farmer must complete their profile before creating a booking                                |
| FR-FARMER-002 | The profile must capture personal details, land details, bank details, and identity documents |
| FR-FARMER-003 | The system must support document upload (Aadhaar, land records, bank passbook)                |
| FR-FARMER-004 | Documents must be stored in secure object storage, not in the database directly               |
| FR-FARMER-005 | The system must track profile completeness as a percentage                                    |
| FR-FARMER-006 | A farmer with incomplete profile may browse centres but cannot confirm a booking              |
| FR-FARMER-007 | Farmer bank account details must be encrypted at rest                                         |
| FR-FARMER-008 | Profile changes to bank details require re-verification by System Admin                       |

### 2.4 Farmer Profile Fields

| Field                                    | Required | Sensitive | Notes                    |
| ---------------------------------------- | -------- | --------- | ------------------------ |
| Full name                                | Yes      | No        |                          |
| Father/Guardian name                     | Yes      | No        |                          |
| Date of birth                            | Yes      | No        |                          |
| Gender                                   | Yes      | No        |                          |
| Mobile number                            | Yes      | No        | Also login identifier    |
| Email                                    | No       | No        |                          |
| Address (full with district, state, pin) | Yes      | No        |                          |
| GPS location (optional)                  | No       | No        | Used for recommendations |
| Aadhaar number (masked display)          | Yes      | Yes       | Encrypted at rest        |
| Farmer registration number               | No       | No        | Govt-issued if available |
| Land holding size (acres)                | Yes      | No        |                          |
| Land survey number                       | No       | No        |                          |
| Bank account number                      | Yes      | Yes       | Encrypted at rest        |
| Bank IFSC code                           | Yes      | No        |                          |
| Bank name                                | Yes      | No        |                          |
| Bank account holder name                 | Yes      | No        |                          |
| Profile photo                            | No       | No        | Stored in object storage |
| Document uploads                         | Yes      | Yes       | Stored in object storage |

### 2.5 Business Rules

- BR-FARMER-001: Profile completion percentage is calculated as filled required fields / total required fields × 100
- BR-FARMER-002: Minimum profile completion of 80% required to create a booking
- BR-FARMER-003: Any change to bank details must be flagged and requires System Admin re-verification
- BR-FARMER-004: Soft delete only — farmer profiles are never hard-deleted; they are deactivated

---

## MODULE 3 — Produce / Crop Management

### 3.1 Purpose

Allow farmers to declare produce they intend to sell, and allow centres to define which crops they accept.

### 3.2 Functional Requirements

| Req ID         | Requirement                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| FR-PRODUCE-001 | Farmers must be able to add one or more produce batches to their profile                                                 |
| FR-PRODUCE-002 | Each produce batch must capture: crop type, estimated quantity (kg/quintal), variety, harvest date, and storage location |
| FR-PRODUCE-003 | Crop types must be managed centrally by System Admin (master list)                                                       |
| FR-PRODUCE-004 | Procurement centres must specify which crop types they accept                                                            |
| FR-PRODUCE-005 | The recommendation engine must filter centres based on crop compatibility                                                |
| FR-PRODUCE-006 | A produce batch must be associated with a specific booking                                                               |
| FR-PRODUCE-007 | Estimated quantity must be re-validated at weighing stage                                                                |

### 3.3 Produce Batch Fields

| Field                            | Required | Notes                   |
| -------------------------------- | -------- | ----------------------- |
| Crop type (from master list)     | Yes      |                         |
| Crop variety                     | No       |                         |
| Estimated quantity               | Yes      | In kg or quintal        |
| Harvest date                     | Yes      | Cannot be future date   |
| Storage type                     | No       | On-farm/warehouse       |
| Quality grade (self-declared)    | No       | Officer will re-inspect |
| Moisture content (self-declared) | No       |                         |

---

## MODULE 4 — Procurement Centre Management

### 4.1 Purpose

Create and maintain a registry of all procurement centres with their basic details, location, accepted crops, and operational contact.

### 4.2 Functional Requirements

| Req ID        | Requirement                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------- |
| FR-CENTRE-001 | System Admin must be able to create a new procurement centre                                      |
| FR-CENTRE-002 | Each centre must have a unique Centre ID, name, address, GPS coordinates, and district assignment |
| FR-CENTRE-003 | Centre Manager must be able to update operating hours and accepted crops                          |
| FR-CENTRE-004 | A centre can be in one of: ACTIVE, SUSPENDED, CLOSED, UNDER_MAINTENANCE states                    |
| FR-CENTRE-005 | Centre contact information must be publicly visible to farmers                                    |
| FR-CENTRE-006 | Centre GPS coordinates are used for distance-based recommendation                                 |
| FR-CENTRE-007 | A centre's accepted crops list must be maintained as a many-to-many relationship                  |

### 4.3 Centre Record Fields

| Field                      | Required | Notes            |
| -------------------------- | -------- | ---------------- |
| Centre ID                  | Yes      | System-generated |
| Centre name                | Yes      |                  |
| Address                    | Yes      |                  |
| District                   | Yes      |                  |
| State                      | Yes      |                  |
| GPS coordinates (lat/long) | Yes      |                  |
| Contact number             | Yes      |                  |
| Email                      | No       |                  |
| Accepted crop types        | Yes      | List             |
| Operational status         | Yes      | State machine    |
| Manager ID                 | Yes      | FK to user       |
| Created by                 | Yes      | System Admin     |

---

## MODULE 5 — Centre Capacity and Operational Availability

### 5.1 Purpose

Manage the real-time capacity of a centre based on configured limits, active staff, and working equipment.

### 5.2 Functional Requirements

| Req ID     | Requirement                                                                                |
| ---------- | ------------------------------------------------------------------------------------------ |
| FR-CAP-001 | Centre Manager must configure maximum daily capacity (farmers per day)                     |
| FR-CAP-002 | Configurable slot capacity (farmers per slot, slots per day)                               |
| FR-CAP-003 | Effective capacity must be dynamically recalculated when equipment or staff status changes |
| FR-CAP-004 | The system must track current queue depth against theoretical daily capacity               |
| FR-CAP-005 | When capacity reaches a configurable threshold (e.g., 90%), an alert must be raised        |
| FR-CAP-006 | When equipment is FAULTY, affected capacity slots must be blocked automatically            |
| FR-CAP-007 | Recommended capacity per slot = floor(daily capacity / number of slots)                    |
| FR-CAP-008 | Capacity overrides by Manager are audit-logged                                             |

---

## MODULE 6 — Recommendation Engine

### 6.1 Purpose

Suggest the best-suited procurement centre and slot to a farmer based on multiple weighted factors.

### 6.2 Functional Requirements

| Req ID     | Requirement                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| FR-REC-001 | The engine must accept farmer location, crop type, preferred date, and produce quantity as input                                         |
| FR-REC-002 | The engine must evaluate all active centres accepting the farmer's crop                                                                  |
| FR-REC-003 | Each centre must be scored across: distance, current queue, predicted queue, slot availability, equipment status, and staff availability |
| FR-REC-004 | The engine must return a ranked list of up to 5 recommendations                                                                          |
| FR-REC-005 | Each recommendation must include a human-readable explanation                                                                            |
| FR-REC-006 | If no suitable centre is found within configured radius, expand radius and retry                                                         |
| FR-REC-007 | If all nearby centres are full, inform farmer with earliest available date per centre                                                    |
| FR-REC-008 | The engine must be pluggable: initial rule-based, evolving to ML                                                                         |
| FR-REC-009 | Recommendation data must be logged for future model training                                                                             |

---

## MODULE 7 — Slot Management

### 7.1 Purpose

Define, configure, and manage time-based slots within each procurement centre's operating day.

### 7.2 Functional Requirements

| Req ID      | Requirement                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| FR-SLOT-001 | Slots are defined per centre per day with a start time, end time, and capacity          |
| FR-SLOT-002 | Centre Manager must be able to define slot templates (e.g., 9am–11am, 11am–1pm)         |
| FR-SLOT-003 | Slots must track: total capacity, confirmed bookings, checked-in count, completed count |
| FR-SLOT-004 | A slot is AVAILABLE if confirmed bookings < capacity                                    |
| FR-SLOT-005 | A slot is FULL if confirmed bookings = capacity                                         |
| FR-SLOT-006 | A slot is CLOSED once its end time has passed                                           |
| FR-SLOT-007 | Slots can be cancelled by Manager with reason                                           |
| FR-SLOT-008 | Cancelled slots trigger rescheduling notifications to all affected bookings             |

---

## MODULE 8 — Booking Management

### 8.1 Purpose

Allow farmers to discover, reserve, and manage procurement appointments (bookings).

### 8.2 Functional Requirements

| Req ID      | Requirement                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| FR-BOOK-001 | Farmers must be able to create a booking by selecting a centre, date, slot, and produce batch |
| FR-BOOK-002 | Booking must be rejected if the farmer has an active booking for the same date                |
| FR-BOOK-003 | Booking must be rejected if the slot capacity is full                                         |
| FR-BOOK-004 | Bookings can be made up to N days in advance (configurable by District Admin)                 |
| FR-BOOK-005 | On booking confirmation, a digital token must be automatically generated                      |
| FR-BOOK-006 | Farmer receives BOOKING_CONFIRMED notification                                                |
| FR-BOOK-007 | Farmer can cancel a booking up to M hours before the slot start time                          |
| FR-BOOK-008 | Cancellation after cutoff requires Manager approval and is audit-logged                       |
| FR-BOOK-009 | Farmer can reschedule once per booking (limit configurable)                                   |
| FR-BOOK-010 | Rescheduling creates a new booking and cancels the original                                   |
| FR-BOOK-011 | Duplicate booking prevention: same farmer, same date, same centre = rejected                  |

### 8.3 Business Rules

- BR-BOOK-001: A farmer may have at most 1 active booking at a time (configurable to allow more per crop type)
- BR-BOOK-002: Booking confirmation triggers token generation (atomic — if token fails, booking is rolled back)
- BR-BOOK-003: Cancellation within cutoff window decreases slot confirmed count immediately
- BR-BOOK-004: No-show detection runs as a background job at slot end + grace period

---

## MODULE 9 — Digital Token Management

### 9.1 Purpose

Generate, manage, and validate unique digital tokens (QR codes) for farmer identification at check-in.

### 9.2 Functional Requirements

| Req ID       | Requirement                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| FR-TOKEN-001 | A unique digital token must be generated on booking confirmation                                      |
| FR-TOKEN-002 | Token must encode: booking ID, farmer ID, centre ID, slot ID, date, and a cryptographic signature     |
| FR-TOKEN-003 | Token must be renderable as a QR code displayable on farmer's device                                  |
| FR-TOKEN-004 | Token must expire at the end of the booking slot (plus grace period)                                  |
| FR-TOKEN-005 | Token must be single-use per check-in (invalidated after first valid scan)                            |
| FR-TOKEN-006 | Farmer must be able to regenerate token if original is lost (resets signature, old token invalidated) |
| FR-TOKEN-007 | Token validation must be possible offline using local cryptographic verification                      |
| FR-TOKEN-008 | Fraudulent reuse attempts must be logged and alert sent to Manager                                    |
| FR-TOKEN-009 | Token status must reflect booking status at all times                                                 |

---

## MODULE 10 — QR-Based Identification and Check-In

### 10.1 Purpose

Enable secure, fraud-resistant farmer check-in using QR token scanning.

### 10.2 Functional Requirements

| Req ID         | Requirement                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| FR-CHECKIN-001 | Officer scans farmer's QR token using the centre device's camera                           |
| FR-CHECKIN-002 | System validates: token signature, expiry, booking date, centre ID match                   |
| FR-CHECKIN-003 | Valid check-in creates a queue entry and transitions booking to CHECKED_IN                 |
| FR-CHECKIN-004 | Invalid token (expired/tampered) results in CHECK_IN_REJECTED with reason                  |
| FR-CHECKIN-005 | Duplicate scan (already checked in) returns ALREADY_CHECKED_IN error                       |
| FR-CHECKIN-006 | Manual check-in override by Manager requires reason, is audit-logged                       |
| FR-CHECKIN-007 | Farmer receives CHECK_IN_CONFIRMED notification with queue position and ETA                |
| FR-CHECKIN-008 | Check-in timestamp is recorded for audit                                                   |
| FR-CHECKIN-009 | Early arrival is accepted; farmer enters queue with a lower priority than on-time arrivals |
| FR-CHECKIN-010 | Late arrival within grace period retains original queue position                           |
| FR-CHECKIN-011 | Late arrival past grace period goes to end of queue or is offered rescheduling             |

---

## MODULE 11 — Live Queue Management

### 11.1 Purpose

Maintain, display, and manage real-time farmer queue at each procurement centre.

### 11.2 Functional Requirements

| Req ID       | Requirement                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| FR-QUEUE-001 | Queue entries are created on successful check-in                                           |
| FR-QUEUE-002 | Queue order is determined by: check-in time within slot, then slot order                   |
| FR-QUEUE-003 | Officers can call the next farmer from the queue (transitions farmer to CALLED state)      |
| FR-QUEUE-004 | Farmer is notified when they are CALLED                                                    |
| FR-QUEUE-005 | Farmer is notified N positions before their turn (configurable, e.g., 3 positions ahead)   |
| FR-QUEUE-006 | Officer can temporarily skip a farmer (transitions to SKIPPED, may re-enter at back)       |
| FR-QUEUE-007 | Manager can pause the entire queue (e.g., equipment failure)                               |
| FR-QUEUE-008 | Queue pause sends notification to all waiting farmers                                      |
| FR-QUEUE-009 | Queue depth and speed are used to calculate ETA for waiting farmers                        |
| FR-QUEUE-010 | Farmer dashboard shows live queue position, estimated ETA, and current number being served |

---

## MODULE 12 — ETA and Waiting-Time Estimation

### 12.1 Purpose

Calculate and continuously update estimated waiting time for each farmer in the queue.

### 12.2 Functional Requirements

| Req ID     | Requirement                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------- |
| FR-ETA-001 | ETA shall be calculated as: (position in queue) × (rolling average processing time per farmer)     |
| FR-ETA-002 | Rolling average shall use the last N completed procurements (N configurable, default: 10)          |
| FR-ETA-003 | ETA must be recalculated after each farmer completes service                                       |
| FR-ETA-004 | When queue is paused, ETA is suspended and farmer is notified                                      |
| FR-ETA-005 | When queue pauses for equipment failure, ETA is replaced with "Service temporarily paused" message |
| FR-ETA-006 | ETA must be pushed to farmer dashboard and via push notification                                   |
| FR-ETA-007 | ETA accuracy metric must be tracked per centre for analytics                                       |

---

## MODULE 13 — Procurement Operations

### 13.1 Purpose

Manage the end-to-end process from farmer being called to procurement completion, including weighing, inspection, and decision.

### 13.2 Functional Requirements

| Req ID      | Requirement                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| FR-PROC-001 | Procurement record is created when an officer calls a farmer from the queue                                |
| FR-PROC-002 | Procurement workflow: INITIATED → WEIGHING → INSPECTING → PENDING_DECISION → APPROVED / REJECTED / ON_HOLD |
| FR-PROC-003 | Each stage transition must be explicitly recorded with actor, timestamp, and data entered                  |
| FR-PROC-004 | Approved procurement generates a digital receipt for the farmer                                            |
| FR-PROC-005 | Rejected procurement requires a rejection reason from a predefined list                                    |
| FR-PROC-006 | ON_HOLD procurement requires reason and must be resolved within a configurable time window                 |
| FR-PROC-007 | Once APPROVED, procurement data (weight, grade, amount) cannot be modified without a correction entry      |
| FR-PROC-008 | Corrections require Manager approval and full audit trail                                                  |

---

## MODULE 14 — Weighing Management

### 14.1 Purpose

Digitally record weighing measurements with equipment tracking and correction audit trail.

### 14.2 Functional Requirements

| Req ID       | Requirement                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| FR-WEIGH-001 | Officer must record: weight (kg/quintal), equipment ID used, timestamp                                 |
| FR-WEIGH-002 | Multiple weighings per procurement are allowed (e.g., multiple bags)                                   |
| FR-WEIGH-003 | Total weight is auto-calculated from individual weighings                                              |
| FR-WEIGH-004 | Deduction percentage (moisture, impurity) is applied per crop type settings                            |
| FR-WEIGH-005 | Net weight = gross weight × (1 – deduction%)                                                           |
| FR-WEIGH-006 | Weighing record correction requires original record ID, correction value, reason, and Manager approval |
| FR-WEIGH-007 | Original weighing record is never overwritten; a correction record is created                          |

---

## MODULE 15 — Quality Inspection

### 15.1 Purpose

Record produce quality assessment including grade, moisture, impurities, and pass/fail decision.

### 15.2 Functional Requirements

| Req ID      | Requirement                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------- |
| FR-QUAL-001 | Officer or designated inspector records quality inspection per procurement                     |
| FR-QUAL-002 | Inspection parameters: moisture content (%), impurity percentage, grade (A/B/C/Rejected)       |
| FR-QUAL-003 | Each crop type has configurable acceptance thresholds                                          |
| FR-QUAL-004 | If quality parameters fall below thresholds, system flags as INSPECTION_FAIL                   |
| FR-QUAL-005 | Officer may override an auto-fail with Manager approval (documented reason required)           |
| FR-QUAL-006 | Rejected produce requires reason from predefined list + officer notes                          |
| FR-QUAL-007 | Quality inspection data is stored immutably; corrections follow same audit process as weighing |

---

## MODULE 16 — Procurement Decision Management

### 16.1 Purpose

Finalise procurement outcome (approve, reject, hold) with appropriate authorisation and audit trail.

### 16.2 Functional Requirements

| Req ID     | Requirement                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| FR-DEC-001 | Officer submits procurement for decision after weighing and quality inspection |
| FR-DEC-002 | Standard procurements (below threshold) are auto-approved or officer-approved  |
| FR-DEC-003 | High-value procurements (above threshold) require Manager approval             |
| FR-DEC-004 | Rejection requires rejection category + description                            |
| FR-DEC-005 | Approved procurement triggers payment record creation                          |
| FR-DEC-006 | Rejected procurement notifies farmer with reason                               |
| FR-DEC-007 | ON_HOLD procurement must be resolved within SLA; auto-escalates if not         |

---

## MODULE 17 — Payment Tracking

### 17.1 Purpose

Create, track, and notify payment status corresponding to each approved procurement.

### 17.2 Functional Requirements

| Req ID     | Requirement                                                                               |
| ---------- | ----------------------------------------------------------------------------------------- |
| FR-PAY-001 | Payment record is created automatically on procurement approval                           |
| FR-PAY-002 | Payment record captures: procurement ID, farmer ID, amount, bank details snapshot, status |
| FR-PAY-003 | Payment is initiated manually or via integration trigger                                  |
| FR-PAY-004 | Payment status transitions: PENDING → INITIATED → PROCESSING → COMPLETED / FAILED         |
| FR-PAY-005 | Failed payments require retry mechanism with configurable max retries                     |
| FR-PAY-006 | Duplicate payment events must be idempotent (same payment ID = no double payment)         |
| FR-PAY-007 | Farmer is notified at each payment status change                                          |
| FR-PAY-008 | Payment confirmation provides UTR / transaction reference to farmer                       |
| FR-PAY-009 | All payment events are audit-logged                                                       |

---

## MODULE 18 — Notification Management

### 18.1 Purpose

Manage all system notifications across multiple channels with reliable delivery tracking.

### 18.2 Functional Requirements

| Req ID       | Requirement                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| FR-NOTIF-001 | System must support in-app, SMS, email, and push notification channels                |
| FR-NOTIF-002 | Notification channel preference must be configurable per user                         |
| FR-NOTIF-003 | All notification events must be queued asynchronously                                 |
| FR-NOTIF-004 | Failed notifications must be retried N times with exponential backoff                 |
| FR-NOTIF-005 | Delivery status must be tracked per notification and per channel                      |
| FR-NOTIF-006 | Notification templates must be configurable by System Admin                           |
| FR-NOTIF-007 | System must support provider failover (e.g., if SMS provider A fails, try provider B) |
| FR-NOTIF-008 | Each notification event type must have a defined priority (HIGH/MEDIUM/LOW)           |

---

## MODULE 19 — Rescheduling and Cancellation

### 19.1 Purpose

Allow farmers to reschedule or cancel bookings with appropriate policies and slot management.

### 19.2 Functional Requirements

| Req ID       | Requirement                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| FR-RESCH-001 | Farmer can cancel a booking up to M hours before slot start (M configurable)                                |
| FR-RESCH-002 | Cancellation releases the slot count immediately                                                            |
| FR-RESCH-003 | Late cancellation (past M hours) requires Manager approval; slot is not immediately released until approved |
| FR-RESCH-004 | Farmer can reschedule exactly once per booking (limit configurable)                                         |
| FR-RESCH-005 | Rescheduling creates a new booking; old booking is cancelled with reason RESCHEDULED                        |
| FR-RESCH-006 | Rescheduled booking must be to an available future slot                                                     |
| FR-RESCH-007 | Both cancellation and rescheduling generate appropriate notifications                                       |
| FR-RESCH-008 | Officer or Manager may reschedule on behalf of farmer with documented reason                                |

---

## MODULE 20 — No-Show Management

### 20.1 Purpose

Detect, record, and manage farmers who do not check in for their confirmed booking.

### 20.2 Functional Requirements

| Req ID        | Requirement                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| FR-NOSHOW-001 | A background job runs at slot end time + grace period to identify unchecked-in bookings     |
| FR-NOSHOW-002 | Unconfirmed bookings at that point are marked NO_SHOW                                       |
| FR-NOSHOW-003 | The farmer's no-show counter is incremented                                                 |
| FR-NOSHOW-004 | Farmer is notified of the no-show marking                                                   |
| FR-NOSHOW-005 | After N consecutive no-shows (configurable), farmer's booking privileges are suspended      |
| FR-NOSHOW-006 | Slot count is released when a booking is marked NO_SHOW                                     |
| FR-NOSHOW-007 | A no-show can be disputed by the farmer; Manager reviews and may overturn with audit record |

---

## MODULE 21 — Exception Management

### 21.1 Purpose

Handle system and operational exceptions — equipment failures, network issues, Centre closures — with structured responses.

### 21.2 Functional Requirements

| Req ID    | Requirement                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| FR-EX-001 | Any officer or manager must be able to raise an exception with type, description, and severity             |
| FR-EX-002 | Exception types: EQUIPMENT_FAILURE, STAFF_SHORTAGE, POWER_OUTAGE, NETWORK_FAILURE, CENTRE_CLOSURE, OTHER   |
| FR-EX-003 | HIGH severity exceptions must immediately notify Manager and District Admin                                |
| FR-EX-004 | Exceptions affecting centre capacity must trigger capacity recalculation                                   |
| FR-EX-005 | Exceptions affecting today's queue must trigger farmer notifications (queue paused / rescheduling offered) |
| FR-EX-006 | Exception resolution must be recorded with timestamp and resolution notes                                  |
| FR-EX-007 | All exceptions are permanently recorded in the audit log                                                   |

---

## MODULE 22 — Equipment Management

### 22.1 Purpose

Track procurement centre equipment status, availability, and maintenance history.

### 22.2 Functional Requirements

| Req ID       | Requirement                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------- |
| FR-EQUIP-001 | Each piece of equipment must have a record: ID, name, type, centre, status, last maintenance date |
| FR-EQUIP-002 | Equipment types: WEIGHING_MACHINE, MOISTURE_METER, CONVEYOR, GENERATOR, OTHER                     |
| FR-EQUIP-003 | Equipment states: OPERATIONAL, FAULTY, UNDER_MAINTENANCE, DECOMMISSIONED                          |
| FR-EQUIP-004 | When equipment transitions to FAULTY or UNDER_MAINTENANCE, centre capacity is recalculated        |
| FR-EQUIP-005 | Maintenance records capture: maintenance type, date, technician, notes, expected return date      |
| FR-EQUIP-006 | Equipment downtime is tracked as a metric for analytics                                           |
| FR-EQUIP-007 | Manager receives an alert when equipment downtime exceeds a configurable threshold per day        |

---

## MODULE 23 — Centre Staff Management

### 23.1 Purpose

Manage staff accounts, assignments, and daily operational roles within a procurement centre.

### 23.2 Functional Requirements

| Req ID       | Requirement                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| FR-STAFF-001 | Manager can create and manage staff accounts for their centre                                          |
| FR-STAFF-002 | Each staff member must be assigned a role within the centre: WELCOMING, WEIGHING, INSPECTION, APPROVAL |
| FR-STAFF-003 | Daily staff attendance must be recordable by Manager                                                   |
| FR-STAFF-004 | When active staff count drops below minimum threshold, an alert is sent to Manager and District Admin  |
| FR-STAFF-005 | Staff performance metrics (procurements processed, average processing time) are tracked                |
| FR-STAFF-006 | Staff can be temporarily reassigned between roles by Manager during operations                         |

---

## MODULE 24 — Analytics and Reporting

### 24.1 Purpose

Provide operational and analytical insight to all relevant roles via dashboards and exportable reports.

### 24.2 Functional Requirements

| Req ID           | Requirement                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| FR-ANALYTICS-001 | Farmer dashboard: booking history, queue history, payment history                    |
| FR-ANALYTICS-002 | Officer dashboard: today's processed farmers, weighing summary                       |
| FR-ANALYTICS-003 | Manager dashboard: live operations, daily throughput, equipment status, no-show rate |
| FR-ANALYTICS-004 | District Admin dashboard: multi-centre comparison, utilisation, congestion map       |
| FR-ANALYTICS-005 | System Admin dashboard: system health, user counts, audit events                     |
| FR-ANALYTICS-006 | All reports must be exportable as CSV or PDF                                         |
| FR-ANALYTICS-007 | Historical data must support date-range filtering                                    |
| FR-ANALYTICS-008 | Real-time operational metrics must update at most every 60 seconds                   |

---

## MODULE 25 — Congestion Detection

### 25.1 Purpose

Detect when a centre's queue is reaching or exceeding capacity thresholds and trigger timely alerts.

### 25.2 Functional Requirements

| Req ID      | Requirement                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| FR-CONG-001 | Congestion level is calculated as (current queue depth / daily capacity) × 100 |
| FR-CONG-002 | YELLOW alert at 70% threshold; RED alert at 90% threshold (configurable)       |
| FR-CONG-003 | Congestion alerts are sent to Manager and District Admin                       |
| FR-CONG-004 | Congestion status is visible on all relevant dashboards                        |
| FR-CONG-005 | System logs congestion events with timestamp, level, and contributing factors  |

---

## MODULE 26 — Bottleneck Detection

### 26.1 Purpose

Identify specific stages in the procurement workflow where delays are accumulating.

### 26.2 Functional Requirements

| Req ID        | Requirement                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| FR-BOTTLE-001 | System tracks time spent at each procurement stage: check-in, queue wait, weighing, inspection, decision |
| FR-BOTTLE-002 | If average time at a stage exceeds 2× historical average, a bottleneck alert is raised                   |
| FR-BOTTLE-003 | Bottleneck alerts specify the stage name, current average time, and historical baseline                  |
| FR-BOTTLE-004 | Multiple consecutive bottleneck alerts in the same stage escalate to District Admin                      |
| FR-BOTTLE-005 | Bottleneck data feeds into the ETA calculation as a dynamic adjustment factor                            |

---

## MODULE 27 — Cross-Centre Load Balancing

### 27.1 Purpose

Identify and address imbalances in queue load across centres in the same district.

### 27.2 Functional Requirements

| Req ID    | Requirement                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| FR-LB-001 | System calculates load ratio for each centre in the district                                         |
| FR-LB-002 | When one centre exceeds 85% capacity while another is below 40%, a balancing suggestion is generated |
| FR-LB-003 | Balancing suggestion appears on District Admin dashboard                                             |
| FR-LB-004 | Suggestion includes: overloaded centre, underloaded centre, recommended farmer count to redirect     |
| FR-LB-005 | District Admin can accept suggestion; system sends affected farmers rescheduling offers              |
| FR-LB-006 | Farmers who accept rescheduling retain their priority for the new centre                             |
| FR-LB-007 | Load balancing actions are audit-logged                                                              |

---

## MODULE 28 — Audit Logs and Traceability

### 28.1 Purpose

Maintain a complete, tamper-evident audit trail for all sensitive operations in the system.

### 28.2 Functional Requirements

| Req ID       | Requirement                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| FR-AUDIT-001 | Every state-changing operation on sensitive entities must generate an audit log entry                                                   |
| FR-AUDIT-002 | Audit log entries must be append-only; no edit or delete operation is permitted on audit records                                        |
| FR-AUDIT-003 | Each entry must record: actor ID, actor role, action type, entity type, entity ID, before-state, after-state, timestamp, and IP address |
| FR-AUDIT-004 | Audit logs must be queryable by: actor, entity type, entity ID, date range, and action type                                             |
| FR-AUDIT-005 | System Admin and authorised managers can view but not modify audit logs                                                                 |
| FR-AUDIT-006 | Audit logs must be retained for a minimum of 7 years                                                                                    |
| FR-AUDIT-007 | Audit logs must be exportable as JSON or CSV                                                                                            |

---

## MODULE 29 — System Administration

### 29.1 Purpose

Provide System Admin with full platform management capability.

### 29.2 Functional Requirements

| Req ID        | Requirement                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| FR-SYSADM-001 | System Admin can create, view, edit, and deactivate any user account                        |
| FR-SYSADM-002 | System Admin can assign, modify, and revoke user roles                                      |
| FR-SYSADM-003 | System Admin can unlock locked accounts                                                     |
| FR-SYSADM-004 | System Admin can view all audit logs across the platform                                    |
| FR-SYSADM-005 | System Admin can manage background job schedules                                            |
| FR-SYSADM-006 | System Admin can trigger manual re-runs of background jobs                                  |
| FR-SYSADM-007 | System Admin can view system performance metrics: API latency, error rates, job queue depth |
| FR-SYSADM-008 | System Admin can manage notification provider configurations                                |

---

## MODULE 30 — Configuration Management

### 30.1 Purpose

Allow authorised users to configure system-wide and centre-specific parameters without code changes.

### 30.2 Functional Requirements

| Req ID        | Requirement                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-CONFIG-001 | All configurable parameters must be stored in a database configuration table managed by System Admin                                                                                       |
| FR-CONFIG-002 | Centre-level configurations can be overridden by Centre Manager within System Admin–defined bounds                                                                                         |
| FR-CONFIG-003 | Configurable parameters include: booking advance days, cancellation cutoff hours, no-show threshold, congestion alert thresholds, slot capacity, max bookings per farmer, OTP TTL, JWT TTL |
| FR-CONFIG-004 | Configuration changes are audit-logged                                                                                                                                                     |
| FR-CONFIG-005 | Configurations take effect immediately without server restart                                                                                                                              |
| FR-CONFIG-006 | Configuration history must be viewable for audit purposes                                                                                                                                  |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
