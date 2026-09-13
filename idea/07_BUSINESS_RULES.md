# 07 — BUSINESS RULES

## SmartProcure: Explicit Business Rule Catalog

---

## Format

Each business rule has:

- **Rule ID**: Unique, namespaced identifier
- **Title**: Short descriptive name
- **Rule**: The precise business rule statement
- **Applies To**: Entity or module
- **Enforcement**: System-automated or manual
- **Violation Response**: What happens when rule is violated

---

## Section 1: Authentication Rules

| Rule ID     | Title                  | Rule                                                                                                                   | Enforcement                | Violation Response                                                |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| BR-AUTH-001 | Open Registration      | Farmer self-registration is unrestricted; no admin approval required for basic account creation                        | System                     | N/A                                                               |
| BR-AUTH-002 | Staff Account Creation | Accounts for OFFICER, MANAGER, DISTRICT_ADMIN roles may only be created by SYSTEM_ADMIN or MANAGER (centre-level only) | System (role check in API) | Forbidden (403)                                                   |
| BR-AUTH-003 | Account Lockout        | After 5 consecutive failed login attempts within 60 minutes, the account is locked                                     | System (automated)         | Lock applied; unlock after 30 minutes; alert sent to System Admin |
| BR-AUTH-004 | OTP Validity           | OTP for login/registration/password reset is valid for exactly 5 minutes from generation                               | System                     | OTP_EXPIRED error; resend option offered                          |
| BR-AUTH-005 | Session Limit          | A single user account may have at most 3 concurrent active sessions                                                    | System                     | Oldest session terminated on 4th login; user notified             |
| BR-AUTH-006 | JWT Refresh Rotation   | Each refresh token is single-use; a new refresh token is issued on every token refresh operation                       | System                     | Old refresh token is immediately invalidated on use               |
| BR-AUTH-007 | Password Complexity    | Minimum 8 characters; must contain at least 1 uppercase, 1 numeric, and 1 special character                            | System                     | Validation error on account creation/password change              |
| BR-AUTH-008 | Unique Identifier      | Mobile number must be globally unique in the system                                                                    | System                     | DUPLICATE_IDENTIFIER error on registration                        |

---

## Section 2: Booking Rules

| Rule ID     | Title                        | Rule                                                                                                                            | Enforcement                                | Violation Response                                                          |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| BR-BOOK-001 | Profile Completion           | A farmer cannot create a booking unless profile completion is ≥ 80%                                                             | System                                     | PROFILE_INCOMPLETE error with list of missing fields                        |
| BR-BOOK-002 | Active Booking Limit         | A farmer may have at most 1 active (CONFIRMED or CHECKED_IN) booking at any time (configurable to allow multi-crop, default: 1) | System                                     | ACTIVE_BOOKING_EXISTS error                                                 |
| BR-BOOK-003 | Advance Booking Window       | Bookings may be made at most N calendar days in advance from today (N is configurable, default: 7)                              | System                                     | BOOKING_TOO_FAR_AHEAD error                                                 |
| BR-BOOK-004 | Booking Atomicity            | Booking creation and token generation are a single atomic operation. If token generation fails, the booking is rolled back      | System (transaction)                       | BOOKING_FAILED — no partial state created                                   |
| BR-BOOK-005 | Slot Count Decrement         | On booking confirmation, the slot's available capacity is decremented atomically                                                | System (optimistic lock or row-level lock) | If slot becomes full during decrement, SLOT_FULL error; booking not created |
| BR-BOOK-006 | Duplicate Booking Prevention | Same farmer + same date + same centre = duplicate. System rejects on creation attempt                                           | System                                     | DUPLICATE_BOOKING error                                                     |
| BR-BOOK-007 | Crop Compatibility           | A booking may only be created for a centre that accepts the farmer's declared crop type                                         | System                                     | CROP_NOT_ACCEPTED error; recommendation triggered                           |
| BR-BOOK-008 | Cancellation Cutoff          | Farmer may cancel up to M hours before slot start (M configurable, default: 4 hours)                                            | System                                     | Past cutoff: requires Manager approval for cancellation                     |
| BR-BOOK-009 | Rescheduling Limit           | A farmer may reschedule a given booking exactly once (limit configurable)                                                       | System                                     | RESCHEDULE_LIMIT_EXCEEDED error                                             |
| BR-BOOK-010 | Cancellation Slot Release    | Slot capacity is restored immediately upon cancellation (within cutoff)                                                         | System                                     | N/A                                                                         |

---

## Section 3: Token Rules

| Rule ID      | Title                   | Rule                                                                                                                                      | Enforcement | Violation Response                                       |
| ------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| BR-TOKEN-001 | Token on Confirmation   | Token must be generated at the exact time booking is confirmed, in the same transaction                                                   | System      | Booking rolled back if token fails                       |
| BR-TOKEN-002 | Token Expiry            | Token expires at slot end time + grace period (e.g., 30 minutes after slot end). After expiry, token cannot be used for check-in          | System      | TOKEN_EXPIRED error on scan                              |
| BR-TOKEN-003 | Single Use              | Token becomes USED on first valid check-in scan. Any further scan attempt for the same token returns ALREADY_CHECKED_IN                   | System      | ALREADY_CHECKED_IN error; event logged                   |
| BR-TOKEN-004 | Regeneration            | Farmer may regenerate their token at any time before check-in. Regeneration invalidates old token and issues new token with new signature | System      | Old token → INVALIDATED; new token → GENERATED           |
| BR-TOKEN-005 | Cryptographic Signature | Token payload is signed using HMAC-SHA256 with a server-side secret. Signature verified on every check-in                                 | System      | Invalid signature → TOKEN_INVALID; security event logged |
| BR-TOKEN-006 | Fraud Reuse Detection   | If a USED token is scanned again, the event is flagged as a potential fraud attempt and Manager is alerted                                | System      | ALREADY_CHECKED_IN error; FRAUD_ATTEMPT audit event      |
| BR-TOKEN-007 | Token–Booking Linkage   | One token maps to exactly one booking. No token may be linked to more than one booking simultaneously                                     | System      | Integrity constraint in database                         |

---

## Section 4: Queue Rules

| Rule ID      | Title                     | Rule                                                                                                                      | Enforcement             | Violation Response                                                         |
| ------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| BR-QUEUE-001 | Queue Entry on Check-In   | A queue entry is created only on successful check-in. No queue entry without a valid, confirmed, active booking           | System                  | INVALID_CHECKIN error if booking not in CONFIRMED state                    |
| BR-QUEUE-002 | Queue Order               | Within a slot, queue order is determined by check-in timestamp (FIFO). Earlier check-in = earlier position                | System                  | Enforced by check-in timestamp sorting in queue                            |
| BR-QUEUE-003 | Slot Priority             | Earlier slot farmers are served before later slot farmers                                                                 | System                  | Queue sorted by slot start time, then check-in time                        |
| BR-QUEUE-004 | Late Arrival Grace Period | Farmer arriving within grace period (configurable, default: 30 minutes) after slot start retains original queue position  | System                  | Enforced by check-in time vs slot start time comparison                    |
| BR-QUEUE-005 | Late Arrival Past Grace   | Farmer arriving after grace period is placed at the end of the current queue                                              | System                  | Position assigned as (current max position + 1)                            |
| BR-QUEUE-006 | Skip Mechanism            | Officer may skip a farmer who is not physically present when called. Skipped farmer re-enters at the end of the queue     | System + Officer        | QUEUE_ENTRY transitions to SKIPPED then WAITING_AGAIN                      |
| BR-QUEUE-007 | Queue Pause               | Manager may pause the entire queue. No new farmers are called while paused. All waiting farmers receive notification      | System                  | QUEUE_PAUSED status; ETA suspended                                         |
| BR-QUEUE-008 | Priority Handling         | Priority queue positions may be granted by Manager for medical/emergency cases only, with documented reason and audit log | System + Manager        | Requires Manager action with mandatory justification                       |
| BR-QUEUE-009 | Queue Auto-Close          | Queue for a slot is automatically closed after slot end time + configurable overtime window (default: 60 minutes)         | System (background job) | Remaining WAITING entries transitioned to NO_SHOW (with separate handling) |

---

## Section 5: Procurement Rules

| Rule ID     | Title                       | Rule                                                                                                                             | Enforcement              | Violation Response                                                                        |
| ----------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| BR-PROC-001 | Sequential Workflow         | Procurement must follow: INITIATED → WEIGHING → INSPECTING → PENDING_DECISION → APPROVED/REJECTED/ON_HOLD                        | System (state machine)   | Invalid state transition returns STATE_TRANSITION_ERROR                                   |
| BR-PROC-002 | Weight Immutability         | Original weighing record cannot be overwritten. Corrections require a separate correction record with mandatory Manager approval | System                   | Overwrite attempt returns IMMUTABLE_RECORD_ERROR                                          |
| BR-PROC-003 | Approval Threshold          | Procurements with net weight or calculated value exceeding configurable threshold require Manager approval                       | System (threshold check) | Automatically escalated to Manager queue if threshold exceeded                            |
| BR-PROC-004 | Rejection Reason            | Rejection requires selection from a predefined reason list + optional free text                                                  | System (form validation) | MISSING_REJECTION_REASON validation error                                                 |
| BR-PROC-005 | ON_HOLD SLA                 | ON_HOLD procurements must be resolved within SLA_HOURS (configurable, default: 2 hours during operations)                        | System (background job)  | Auto-escalation to Manager; then to District Admin if further delayed                     |
| BR-PROC-006 | Approved Procurement Lock   | Once a procurement is APPROVED and payment record is created, the procurement record is locked for editing                       | System                   | Any edit attempt returns LOCKED_RECORD_ERROR; correction workflow exists as separate path |
| BR-PROC-007 | Produce Batch Link          | Each procurement must be linked to exactly one produce batch                                                                     | System                   | Integrity constraint                                                                      |
| BR-PROC-008 | One Procurement Per Booking | Each booking results in at most one procurement record                                                                           | System                   | Duplicate procurement attempt returns DUPLICATE_PROCUREMENT error                         |

---

## Section 6: Weighing Rules

| Rule ID      | Title                 | Rule                                                                                                                                          | Enforcement | Violation Response                                                                 |
| ------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| BR-WEIGH-001 | Equipment Required    | Every weighing record must reference a specific equipment ID (weighing machine) that is in OPERATIONAL status                                 | System      | If no operational equipment → weighing cannot proceed; EQUIPMENT_UNAVAILABLE error |
| BR-WEIGH-002 | Gross Weight > 0      | Gross weight must be a positive non-zero decimal value                                                                                        | System      | Validation error                                                                   |
| BR-WEIGH-003 | Deduction Application | Deduction percentage (per crop type configuration) is automatically applied to calculate net weight                                           | System      | Net weight = gross weight × (1 – deduction_rate)                                   |
| BR-WEIGH-004 | Multi-Bag Weighing    | Multiple weigh entries (separate bags) may be linked to one procurement. Total is auto-calculated                                             | System      | N/A                                                                                |
| BR-WEIGH-005 | Correction Record     | Weight corrections create a new record (type: CORRECTION) referencing original record ID, with correction value, reason, and Manager approval | System      | Correction without Manager approval returns APPROVAL_REQUIRED                      |
| BR-WEIGH-006 | Timestamp Integrity   | Weighing timestamp is server-generated; client-provided timestamps are rejected                                                               | System      | Client timestamp field ignored; server timestamp applied                           |

---

## Section 7: Quality Inspection Rules

| Rule ID     | Title                     | Rule                                                                                                                    | Enforcement      | Violation Response                              |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------- |
| BR-QUAL-001 | Threshold Enforcement     | Each crop type has configurable max moisture %, max impurity %. Exceeding these results in auto-flagged INSPECTION_FAIL | System           | INSPECTION_FAIL status; notification to officer |
| BR-QUAL-002 | Grade Assignment          | Quality grade (A/B/C/Rejected) maps to MSP rate modifier defined in configuration                                       | System           | Grade determines payment calculation            |
| BR-QUAL-003 | Override Authorization    | Inspector/officer may override INSPECTION_FAIL with Manager approval only                                               | System + Manager | APPROVAL_REQUIRED error if no manager approval  |
| BR-QUAL-004 | Rejection Reason Required | If grade = Rejected, a rejection reason must be selected from predefined list                                           | System           | MISSING_REASON validation error                 |
| BR-QUAL-005 | Immutability              | Quality inspection records cannot be overwritten; corrections follow same pattern as weighing corrections               | System           | IMMUTABLE_RECORD_ERROR if overwrite attempted   |

---

## Section 8: Payment Rules

| Rule ID    | Title                | Rule                                                                                                                                                                           | Enforcement           | Violation Response                                                                 |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------- |
| BR-PAY-001 | Payment on Approval  | A payment record is created only when procurement status transitions to APPROVED                                                                                               | System (event-driven) | No payment record exists for non-APPROVED procurements                             |
| BR-PAY-002 | Payment Idempotency  | Payment initiation with the same payment record ID is idempotent. Duplicate payment events from webhook callbacks are silently discarded                                       | System                | Duplicate webhook → HTTP 200 with no state change                                  |
| BR-PAY-003 | Amount Locking       | Payment amount is calculated at time of procurement APPROVAL based on: net weight × MSP rate × grade modifier. Subsequent price changes do not affect existing payment records | System                | Historical MSP rate at time of approval is stored in procurement record            |
| BR-PAY-004 | Bank Detail Snapshot | Farmer's bank details at time of payment initiation are stored as a snapshot in the payment record                                                                             | System                | Subsequent profile bank detail updates do not retroactively change payment records |
| BR-PAY-005 | Retry Limit          | Payment failures may be retried at most N times (configurable, default: 3) before requiring manual Manager intervention                                                        | System                | After N retries: PAYMENT_INTERVENTION_REQUIRED; Manager notified                   |
| BR-PAY-006 | Procurement Closure  | A procurement is fully closed only when payment reaches COMPLETED status                                                                                                       | System                | COMPLETED payment status required for closure                                      |
| BR-PAY-007 | No Payment No Edit   | Once payment is in PROCESSING or COMPLETED state, farming details in the linked procurement cannot be edited                                                                   | System                | Attempted edits return PAYMENT_IN_PROGRESS_ERROR                                   |

---

## Section 9: Capacity Rules

| Rule ID    | Title                                             | Rule                                                                                                                             | Enforcement                | Violation Response                                              |
| ---------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------- |
| BR-CAP-001 | Maximum Daily Capacity                            | Centre daily capacity cannot exceed the configured max value; System Admin must approve increases above a certain level          | System + Admin             | Admin approval required for capacity increases beyond threshold |
| BR-CAP-002 | Equipment Impact                                  | If a weighing machine transitions to FAULTY, effective daily capacity is reduced by (1 / total weighing machines) proportionally | System (event listener)    | Capacity reduced; Manager and District Admin alerted            |
| BR-CAP-003 | Staff Impact                                      | If active staff count drops below minimum required staff (configurable per centre), effective slot capacity is reduced           | System                     | Alert; slot capacity reduced for new bookings                   |
| BR-CAP-004 | Slot Capacity Cannot Increase After Booking Opens | A slot's capacity may not be increased after bookings have been opened for that slot (to prevent retrospective manipulation)     | System                     | Capacity increase on open slot returns SLOT_OPEN_CAPACITY_ERROR |
| BR-CAP-005 | Overbooking Not Allowed                           | Total confirmed bookings for any slot must never exceed slot capacity                                                            | System (atomic slot count) | SLOT_FULL error returned to farmer                              |

---

## Section 10: No-Show Rules

| Rule ID       | Title                   | Rule                                                                                                                                   | Enforcement       | Violation Response                                     |
| ------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| BR-NOSHOW-001 | Detection Trigger       | Background job runs at slot_end_time + grace_period (30 min default). All bookings in CONFIRMED state at that point are marked NO_SHOW | System (cron job) | N/A — automated                                        |
| BR-NOSHOW-002 | Slot Release            | Slot capacity is released on NO_SHOW marking                                                                                           | System            | Slot count incremented on no-show                      |
| BR-NOSHOW-003 | Counter Increment       | Farmer's consecutive no-show counter is incremented                                                                                    | System            | Tracked on farmer profile                              |
| BR-NOSHOW-004 | Suspension Trigger      | After N consecutive no-shows (configurable, default: 3), farmer's booking privileges are suspended                                     | System            | BOOKING_SUSPENDED status applied; farmer notified      |
| BR-NOSHOW-005 | Dispute Window          | Farmer has D days (configurable, default: 3) to dispute a no-show marking; Manager reviews                                             | System            | Dispute creates a review record; outcome audit-logged  |
| BR-NOSHOW-006 | Overturn Resets Counter | If Manager overturns a no-show, the counter is decremented                                                                             | System + Manager  | Counter adjusted; suspension lifted if below threshold |

---

## Section 11: Notification Rules

| Rule ID      | Title             | Rule                                                                                                                           | Enforcement              | Violation Response                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------- |
| BR-NOTIF-001 | Async Delivery    | All notifications are delivered asynchronously via a message queue; they must not block the main request flow                  | System (architecture)    | If queue unavailable, notification is logged but main operation completes       |
| BR-NOTIF-002 | Retry Policy      | Failed notifications are retried with exponential backoff: 1 min, 5 min, 30 min, 2 hours, 24 hours                             | System                   | After 5 failures, notification is marked FAILED; admin alerted if HIGH priority |
| BR-NOTIF-003 | Priority Channels | HIGH priority notifications (e.g., QUEUE_CALLED, PAYMENT_FAILED) are sent via SMS + push; MEDIUM via push; LOW via in-app only | System                   | Priority defined per notification event type                                    |
| BR-NOTIF-004 | No PII in SMS     | SMS notifications must not contain full Aadhaar, bank account numbers, or full addresses                                       | System (template engine) | Template review required; data masking applied                                  |
| BR-NOTIF-005 | Rate Limiting     | Maximum 10 notifications per farmer per hour to prevent spam                                                                   | System                   | Notifications above limit are queued for next window                            |

---

## Section 12: Audit Rules

| Rule ID      | Title                  | Rule                                                                                                                                                                                                                                                                                                                                | Enforcement                            | Violation Response                                                   |
| ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| BR-AUDIT-001 | Mandatory Audit Events | The following entity operations MUST generate an audit event: booking create/cancel/reschedule, token generate/invalidate/regenerate, check-in, queue state changes, weighing entry/correction, inspection entry/correction, procurement state changes, payment state changes, user account changes, role changes, capacity changes | System (AuditService)                  | If audit service fails, the main operation is rolled back            |
| BR-AUDIT-002 | Append-Only            | Audit records cannot be updated or deleted by any actor including System Admin                                                                                                                                                                                                                                                      | System (DB constraint + no DELETE API) | Any delete attempt returns IMMUTABLE_AUDIT_ERROR                     |
| BR-AUDIT-003 | Retention              | Audit logs must be retained for minimum 7 years                                                                                                                                                                                                                                                                                     | System (retention policy)              | Archive strategy defined in infrastructure spec                      |
| BR-AUDIT-004 | Completeness           | Every audit record must contain: actor_id, actor_role, action, entity_type, entity_id, before_state (JSON), after_state (JSON), timestamp (UTC), request_id, ip_address                                                                                                                                                             | System                                 | Incomplete audit record fails validation; main operation rolled back |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
