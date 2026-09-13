# 06 — USER JOURNEYS

## SmartProcure: Complete End-to-End User Journey Definitions

---

## JOURNEY 1 — MAIN FARMER PROCUREMENT JOURNEY

### Step 1: REGISTER

**User Action:** Farmer opens SmartProcure web app and selects "Register."

**System Action:**

- Displays registration form
- Sends OTP to entered mobile number for verification

**Required Data:**

- Full name, mobile number, email (optional), password

**Validation:**

- Mobile number uniqueness check
- OTP verification within 5 minutes

**State Transition:**

- Account status: `PENDING_VERIFICATION` → `ACTIVE` (on OTP success)

**Possible Failure:**

- OTP expired → resend OTP option
- Mobile number already registered → redirect to login

**Notification:** Registration success → welcome SMS + in-app message

---

### Step 2: CREATE / COMPLETE PROFILE

**User Action:** Farmer fills in personal details, land information, and bank details. Uploads identity documents.

**System Action:**

- Saves each section incrementally
- Calculates profile completion percentage
- Validates Aadhaar format, IFSC code format, bank account format
- Stores documents in object storage; saves reference URLs in database

**Required Data:**

- Full name, DOB, gender, address, GPS (optional), Aadhaar (last 4 masked for display), land size, bank account number, IFSC, bank name

**Validation:**

- No booking permitted until profile completion ≥ 80%

**State Transition:**

- Profile: `INCOMPLETE` → `COMPLETE` (when threshold met)

**Possible Failure:**

- Document upload fails → retry mechanism, local save of form data
- Bank account details invalid (IFSC check fails) → inline error

**Notification:** Profile complete → PROFILE_COMPLETED notification

---

### Step 3: ADD PRODUCE DETAILS

**User Action:** Farmer adds one or more produce batches (crop type, quantity, variety, harvest date).

**System Action:**

- Validates crop type against master list
- Stores produce batch linked to farmer profile
- Produce batch enters `DECLARED` state

**Required Data:**

- Crop type (from master list), estimated quantity (kg), variety, harvest date

**Validation:**

- Harvest date cannot be in the future
- Estimated quantity > 0 and ≤ maximum per batch (configurable)

**State Transition:**

- Produce batch: `DECLARED`

**Possible Failure:**

- Crop type not in master list → validation error, admin notified
- Quantity exceeds single-batch maximum → split suggestion

---

### Step 4: GET CENTRE RECOMMENDATIONS

**User Action:** Farmer selects "Book Procurement" and provides date preference, crop type, and allows location access.

**System Action:**

- Calls Recommendation Engine with: farmer location (GPS or entered address), crop type, quantity, preferred date
- Engine evaluates all active, compatible centres
- Returns ranked list of up to 5 recommendations with explanation text and slot availability

**Required Data:**

- Farmer GPS or pincode, crop type, preferred date, quantity

**Validation:**

- Preferred date must be within booking advance window
- At least one centre must be available (otherwise: "No centres available — try a different date")

**Output:**

- Ranked list: Centre name, distance, estimated wait time, available slots, recommendation reason

**Possible Failure:**

- Location unavailable → manual district entry fallback
- No available centres → earliest available date shown per centre

---

### Step 5: SELECT CENTRE AND SLOT

**User Action:** Farmer reviews recommended centres and selects a centre and specific time slot.

**System Action:**

- Displays available slots for selected centre and date
- Shows slot capacity remaining
- Locks selected slot for 5 minutes (reservation hold) to prevent race condition during booking

**Required Data:**

- Selected centre ID, selected slot ID, selected date

**Validation:**

- Slot must still be AVAILABLE at point of confirmation
- Reservation hold expires if farmer does not confirm within 5 minutes → slot released

**Possible Failure:**

- Slot becomes full during hold → "Slot no longer available" with alternative slots shown
- Farmer already has active booking → error with details of existing booking

---

### Step 6: CONFIRM BOOKING

**User Action:** Farmer reviews booking summary and clicks "Confirm Booking."

**System Action:**

- Creates booking record
- Decrements slot available count (atomic operation)
- Triggers token generation (synchronous, within same transaction)
- If token generation fails → entire booking rolled back

**Required Data:**

- Farmer ID, centre ID, slot ID, date, produce batch IDs

**State Transition:**

- Booking: `PENDING` → `CONFIRMED`
- Token: `GENERATED`
- Slot available count: decremented

**Possible Failure:**

- Race condition (slot filled between hold and confirm) → SLOT_FULL error, booking not created
- Database write failure → booking not created, farmer sees retry option

**Notification:** `BOOKING_CONFIRMED` → farmer (in-app + SMS)

---

### Step 7: RECEIVE DIGITAL TOKEN

**User Action:** Farmer views token in the app ("My Bookings" section).

**System Action:**

- Renders QR code from token data (contains: booking ID, farmer ID, centre ID, slot ID, date, cryptographic signature)
- Token downloadable or screenshottable

**Possible Failure:**

- QR render fails → text code fallback with booking reference number

---

### Step 8: RECEIVE REMINDERS

**System Action (automated, no user action required):**

- D-1 (day before slot): `BOOKING_REMINDER` notification
- H-2 (2 hours before slot): `SLOT_APPROACH_REMINDER` notification
- H-0.5 (30 minutes before slot): `SLOT_IMMINENT_REMINDER` notification (if applicable)

**Notification Channels:** SMS + in-app push

---

### Step 9: TRAVEL TO CENTRE

**User Action:** Farmer travels to the procurement centre.

**System Action:**

- No specific action; centre status is visible in real-time on farmer app
- Farmer can check live queue depth before leaving

**Possible Failure:**

- Centre displays CLOSED or SUSPENDED status → farmer notified and booking flagged for rescheduling

---

### Step 10: CHECK-IN

**User Action:** Farmer presents QR token to officer at centre entry; officer scans with centre device.

**System Action:**

- Validates token: signature, expiry, centre match, date match
- Checks for duplicate scan
- On success: creates queue entry, transitions booking to `CHECKED_IN`
- Records check-in timestamp, officer ID

**Validation:**

- Token must not be expired
- Token must match current centre
- Token must not have been previously scanned

**State Transition:**

- Booking: `CONFIRMED` → `CHECKED_IN`
- Queue Entry: `CREATED`
- Token: `USED` (invalidated)

**Possible Failure:**

- Expired token → CHECKIN_REJECTED with reason; farmer invites to regenerate
- Token–centre mismatch → CHECKIN_REJECTED; farmer directed to correct centre
- Duplicate scan → ALREADY_CHECKED_IN

**Notification:** `CHECKIN_CONFIRMED` with queue position and initial ETA

---

### Step 11: ENTER LIVE QUEUE

**System Action:**

- Queue entry created with calculated position
- Farmer dashboard shows live position

**User Action:** Farmer waits; monitors position via app

**System updates ETA every minute.**

---

### Step 12: TRACK POSITION AND ETA

**User Action:** Farmer views live queue position and ETA on dashboard.

**System Action:**

- ETA = current position × rolling average processing time
- Updates pushed via server-sent events or polling (configurable)
- Queue depth changes trigger recalculation

**Notification:** `QUEUE_APPROACHING` when N positions away from being called

---

### Step 13: WEIGHING

**User Action:** Farmer's name/token called; farmer presents produce bags to weighing station.

**System Action:**

- Officer records: gross weight, number of bags, equipment ID, timestamp
- System applies deduction percentage per crop rules
- Net weight calculated and displayed for officer confirmation

**State Transition:**

- Procurement: `INITIATED` → `WEIGHING`

**Possible Failure:**

- Equipment failure mid-weighing → EQUIPMENT_FAILURE exception raised; queue paused; farmers notified

---

### Step 14: QUALITY INSPECTION

**User Action:** Officer or inspector examines produce sample.

**System Action:**

- Officer records: moisture %, impurity %, visual grade, pass/fail
- System compares against crop-specific acceptance thresholds
- Auto-flag if parameters outside acceptable range

**State Transition:**

- Procurement: `WEIGHING` → `INSPECTING`

**Possible Failure:**

- Borderline values → officer can flag for secondary inspection by Manager
- Inspection delay beyond SLA → bottleneck alert raised

---

### Step 15: PROCUREMENT DECISION

**System Action:**

- Officer reviews weighing + quality results
- For standard cases: officer approves
- For high-value or flagged cases: Manager approval required

**State Transition:**

- Procurement: `INSPECTING` → `PENDING_DECISION` → `APPROVED` or `REJECTED` or `ON_HOLD`

**Possible Failure:**

- Manager unreachable for approval → escalation to District Admin after SLA breach

---

### Step 16: DIGITAL RECEIPT

**System Action:**

- On APPROVED status: system generates digital receipt
- Receipt contains: farmer name, centre name, crop type, gross weight, net weight, quality grade, MSP rate, total amount, date, officer ID, procurement ID

**User Action:** Farmer views receipt in app; optionally downloads PDF

**Notification:** `PROCUREMENT_COMPLETED` with receipt summary

---

### Step 17: PAYMENT PROCESSING

**System Action:**

- Payment record created in `PENDING` state
- Actioned by Manager: payment initiation via integrated payment system or manual DBT trigger
- Payment status tracked: `INITIATED` → `PROCESSING` → `COMPLETED`

**Possible Failure:**

- Payment fails → `FAILED` status; retry triggered; farmer notified

---

### Step 18: PAYMENT COMPLETED

**System Action:**

- Payment record transitions to `COMPLETED`
- UTR or transaction reference stored
- Farmer dashboard updated

**Notification:** `PAYMENT_COMPLETED` with transaction reference and amount

---

## JOURNEY 2 — FARMER CANCELLATION

| Step | Actor   | Action                                   | System Response                             |
| ---- | ------- | ---------------------------------------- | ------------------------------------------- |
| 1    | Farmer  | Selects booking, clicks Cancel           | System checks cancellation cutoff           |
| 2    | System  | If within allowed window                 | Cancellation confirmed; slot count released |
| 3    | System  | If past cutoff window                    | Farmer notified: requires Manager approval  |
| 4    | Manager | Approves or rejects cancellation request | Farmer notified of outcome                  |
| 5    | System  | On approval                              | Booking cancelled; slot released; audit log |
| 6    | System  | Notification                             | `BOOKING_CANCELLED` sent to farmer          |

---

## JOURNEY 3 — FARMER RESCHEDULING

| Step | Actor  | Action                             | System Response                                                        |
| ---- | ------ | ---------------------------------- | ---------------------------------------------------------------------- |
| 1    | Farmer | Selects booking, clicks Reschedule | System checks rescheduling limit (max 1 per booking)                   |
| 2    | Farmer | Selects new centre/date/slot       | System validates new slot availability                                 |
| 3    | System | Creates new booking                | New booking confirmed; old booking cancelled with reason `RESCHEDULED` |
| 4    | System | Old token invalidated              | New token generated for new booking                                    |
| 5    | System | Notification                       | `RESCHEDULING_CONFIRMED` → farmer                                      |

---

## JOURNEY 4 — FARMER ARRIVING EARLY

| Step | Action                                           | System Response                                                            |
| ---- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| 1    | Farmer check-in attempt before slot start        | System accepts if within early arrival window (configurable, e.g., 30 min) |
| 2    | System creates queue entry                       | Queue position assigned based on actual check-in time                      |
| 3    | Farmer enters queue earlier than same-slot peers | Queue ordering by check-in time within slot                                |

---

## JOURNEY 5 — FARMER ARRIVING LATE

| Step | Action                                                    | System Response                                               |
| ---- | --------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | Farmer checks in after slot start but within grace period | Reinstated to original queue position                         |
| 2    | Farmer checks in after grace period but before slot end   | Placed at end of queue; notified of new position and ETA      |
| 3    | Farmer checks in after slot end                           | Token expired; check-in rejected; farmer offered rescheduling |

---

## JOURNEY 6 — FARMER MISSING SLOT (NO-SHOW)

| Step | Action                                         | System Response                                      |
| ---- | ---------------------------------------------- | ---------------------------------------------------- |
| 1    | Background job runs at slot end + grace period | Identifies unconfirmed bookings                      |
| 2    | System marks booking as `NO_SHOW`              | Slot count released                                  |
| 3    | No-show counter incremented                    | Farmer notified: `NO_SHOW_RECORDED`                  |
| 4    | If N consecutive no-shows                      | Booking suspension triggered; suspension notice sent |
| 5    | Farmer disputes no-show                        | Manager reviews; may overturn with audit record      |

---

## JOURNEY 7 — CENTRE BECOMING CONGESTED

| Step | Actor          | Action                                           | System Response                                 |
| ---- | -------------- | ------------------------------------------------ | ----------------------------------------------- |
| 1    | System         | Queue depth exceeds 70% threshold                | YELLOW congestion alert → Manager               |
| 2    | System         | Queue depth exceeds 90% threshold                | RED congestion alert → Manager + District Admin |
| 3    | Manager        | Reviews alert; pauses new check-ins if necessary | Queue paused notification to waiting farmers    |
| 4    | System         | Computes cross-centre load balancing suggestion  | Suggestion sent to District Admin               |
| 5    | District Admin | Accepts balancing suggestion                     | Affected farmers receive rescheduling offer     |
| 6    | Farmer         | Accepts rescheduling                             | Booking transferred to alternative centre       |

---

## JOURNEY 8 — EQUIPMENT FAILURE

| Step | Actor              | Action                                       | System Response                                               |
| ---- | ------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| 1    | Officer            | Reports equipment failure in system          | Equipment status → `FAULTY`                                   |
| 2    | System             | Recalculates centre capacity (reduced)       | Capacity alert sent to Manager                                |
| 3    | System             | Pauses active queue                          | All waiting farmers notified: `QUEUE_PAUSED_EQUIPMENT`        |
| 4    | Manager            | Decides: wait for repair or redirect farmers | If close announced → affected bookings get rescheduling offer |
| 5    | Equipment repaired | Manager marks equipment `OPERATIONAL`        | Capacity restored; queue resumes; farmers notified            |

---

## JOURNEY 9 — WEIGHING MACHINE UNAVAILABLE

Similar to equipment failure but specific to weighing stage:

| Step | Action                                                      | System Response                              |
| ---- | ----------------------------------------------------------- | -------------------------------------------- |
| 1    | Officer reports weighing machine unavailable                | Equipment `FAULTY`; weighing stage blocked   |
| 2    | All procurements currently at WEIGHING stage placed ON_HOLD | Farmers notified                             |
| 3    | Manager decides: wait or redirect                           | Wait: farmers stay in queue with updated ETA |
| 4    | If alternative weighing machine available                   | Manager reassigns; procurements resume       |

---

## JOURNEY 10 — QUALITY INSPECTION DELAY

| Step | Action                                      | System Response                                       |
| ---- | ------------------------------------------- | ----------------------------------------------------- |
| 1    | Average inspection time exceeds 2× baseline | Bottleneck alert raised for INSPECTION stage          |
| 2    | Manager notified                            | Suggested action: add inspector or officer assistance |
| 3    | Queue ETA automatically adjusted            | Farmers notified of updated ETA                       |

---

## JOURNEY 11 — STAFF SHORTAGE

| Step | Action                                            | System Response                                 |
| ---- | ------------------------------------------------- | ----------------------------------------------- |
| 1    | Active staff count drops below configured minimum | Staff shortage alert → Manager + District Admin |
| 2    | System flags reduced effective capacity           | Slot availability reduced for remaining day     |
| 3    | Manager recruits temporary help or adjusts queue  | System updated                                  |
| 4    | New staff attendance recorded                     | Capacity restored                               |

---

## JOURNEY 12 — CENTRE TEMPORARY CLOSURE

| Step | Actor          | Action                                                                | System Response                                |
| ---- | -------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| 1    | Manager        | Marks centre as TEMPORARILY_CLOSED with reason and expected reopening | Centre status updated                          |
| 2    | System         | All today's active bookings for this centre flagged                   | Farmers notified: `CENTRE_CLOSED_RESCHEDULING` |
| 3    | System         | Rescheduling offers sent to affected farmers                          | Farmers choose new centre/slot                 |
| 4    | District Admin | Notified of closure                                                   | May approve or override if emergency closure   |

---

## JOURNEY 13 — NETWORK INTERRUPTION

| Step | Action                                           | System Response                                                               |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1    | Centre device loses network                      | PWA / offline mode activates; token validation uses cached cryptographic keys |
| 2    | Check-in continues offline with local validation | Actions queued for sync                                                       |
| 3    | Network restored                                 | Queued actions synced; conflicts detected and logged                          |
| 4    | If conflict detected                             | System flags for Manager review with before/after states                      |

---

## JOURNEY 14 — DUPLICATE BOOKING ATTEMPT

| Step | Action                                         | System Response                                                    |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------ |
| 1    | Farmer attempts a second booking for same date | System checks: farmer has active booking on requested date         |
| 2    | System detects conflict                        | Returns `DUPLICATE_BOOKING_ERROR` with details of existing booking |
| 3    | Farmer redirected                              | Options: view existing booking, reschedule, or cancel and rebook   |

---

## JOURNEY 15 — DUPLICATE CHECK-IN ATTEMPT

| Step | Action                             | System Response                           |
| ---- | ---------------------------------- | ----------------------------------------- |
| 1    | Same QR scanned a second time      | System looks up token → status `USED`     |
| 2    | Returns `ALREADY_CHECKED_IN` error | Officer verifies farmer identity manually |
| 3    | Duplicate check-in logged          | Audit alert sent to Manager               |

---

## JOURNEY 16 — QR TOKEN INVALID

| Step | Action                                         | System Response                                              |
| ---- | ---------------------------------------------- | ------------------------------------------------------------ |
| 1    | Officer scans QR; signature verification fails | `TOKEN_INVALID` error returned                               |
| 2    | Officer notified onscreen                      | Farmer asked for manual booking reference                    |
| 3    | Officer can perform manual check-in            | Requires Manager approval; audit-logged                      |
| 4    | Security event logged                          | Manager notified if multiple invalid tokens from same farmer |

---

## JOURNEY 17 — QR TOKEN EXPIRED

| Step | Action                                          | System Response                              |
| ---- | ----------------------------------------------- | -------------------------------------------- |
| 1    | Token slot end time has passed                  | `TOKEN_EXPIRED` error on scan                |
| 2    | Farmer notified                                 | Offered rescheduling for next available slot |
| 3    | Booking marked `NO_SHOW` if grace period passed | No-show counter updated                      |

---

## JOURNEY 18 — PAYMENT FAILURE

| Step | Action                                                | System Response                                |
| ---- | ----------------------------------------------------- | ---------------------------------------------- |
| 1    | Payment initiation fails (provider error)             | Payment status → `FAILED`                      |
| 2    | System retries automatically (up to max retries)      | Retry count tracked                            |
| 3    | Farmer notified: `PAYMENT_FAILED`                     | Reason shown (generic or specific if safe)     |
| 4    | Max retries exceeded                                  | Manager notified; manual intervention required |
| 5    | Manager retries manually or contacts payment provider | Status updated on resolution                   |

---

## JOURNEY 19 — PROCUREMENT REJECTION

| Step | Action                                          | System Response                                                  |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Officer/Manager selects Reject after inspection | Rejection reason required from predefined list                   |
| 2    | Procurement status → `REJECTED`                 | Produce batch status → `REJECTED`                                |
| 3    | Digital rejection notice generated              | Farmer notified: `PROCUREMENT_REJECTED` with reason              |
| 4    | Farmer can appeal                               | Manager reviews appeal; if overturned, creates correction record |

---

## JOURNEY 20 — PROCUREMENT ON HOLD

| Step | Action                                         | System Response                                |
| ---- | ---------------------------------------------- | ---------------------------------------------- |
| 1    | Officer places procurement on hold with reason | Status → `ON_HOLD`                             |
| 2    | SLA timer starts                               | Manager notified to review                     |
| 3    | Manager resolves within SLA                    | Status transitions to `APPROVED` or `REJECTED` |
| 4    | SLA breached without resolution                | Auto-escalation to District Admin; alert sent  |

---

## JOURNEY 21 — OFFICER ENTERS INCORRECT WEIGHT

| Step | Action                                                       | System Response                               |
| ---- | ------------------------------------------------------------ | --------------------------------------------- |
| 1    | Officer identifies error after submission                    | Officer requests correction                   |
| 2    | Correction form: original record ID, corrected value, reason | Requires Manager approval                     |
| 3    | Manager approves correction                                  | Correction record created; original preserved |
| 4    | Net weight recalculated based on correction                  | Payment amount updated if not yet initiated   |
| 5    | Audit log records original entry, correction, approver       | Cannot be deleted                             |

---

## JOURNEY 22 — ADMIN OVERRIDES OPERATION

| Step | Action                                                             | System Response                       |
| ---- | ------------------------------------------------------------------ | ------------------------------------- |
| 1    | System Admin or District Admin initiates override                  | Override reason required              |
| 2    | Override type logged: entity type, entity ID, old state, new state | Mandatory audit record                |
| 3    | Affected farmer notified if override impacts their record          | `ADMIN_OVERRIDE_NOTIFICATION`         |
| 4    | Override cannot be applied to immutable records                    | Audit logs, original weighing entries |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
