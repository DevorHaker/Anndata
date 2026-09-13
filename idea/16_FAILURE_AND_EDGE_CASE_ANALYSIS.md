# 16 — FAILURE AND EDGE-CASE ANALYSIS

## SmartProcure: Failure Mode and Edge Case Catalog

---

## Format

Each failure is documented with:

1. **Detection** — how the system knows this has happened
2. **User Experience** — what the user sees
3. **Recovery Strategy** — how the system recovers
4. **Retry Strategy** — automated retry handling
5. **Logging** — what is logged
6. **Alerting** — who is alerted

---

## CATEGORY 1: Infrastructure Failures

### F-001: Database Unavailable

**Detection:** Database connection pool exhaust; connection timeout; health check failure

**User Experience:**

- Read requests: "Service temporarily unavailable. Please try again shortly." (HTTP 503)
- Write requests: "We could not process your request. Try again shortly." (HTTP 503)
- No partial operations — transactions rollback on connection loss

**Recovery Strategy:**

- Connection pool retries with exponential backoff (3 attempts, 100ms–500ms)
- After 3 failures: HTTP 503 returned to client
- Health endpoint `/health/ready` returns `503 Not Ready`
- Load balancer stops routing to the affected instance

**Retry Strategy:** Client receives Retry-After header (30 seconds)

**Logging:** `DB_CONNECTION_FAILURE` error log with stack trace, timestamp, host

**Alerting:** PagerDuty / equivalent — immediate CRITICAL alert to System Admin and on-call engineer

---

### F-002: Redis / Cache Unavailable

**Detection:** Redis connection timeout; Sentinel failover in progress

**User Experience:**

- Caching features degrade gracefully (more DB hits; slower but functional)
- Session validation falls back to JWT-only validation (stateless — no active session check)
- Rate limiting falls back to IP-based only (DB-backed fallback)
- Queue operations may experience temporary inconsistency during recovery

**Recovery Strategy:**

- Application continues with degraded mode — cache misses fall through to DB
- Active sessions continue to work (not invalidated)
- Distributed locks (normally Redis) fall back to DB advisory locks

**Logging:** `REDIS_CONNECTION_FAILURE`, `CACHE_DEGRADED_MODE_ACTIVE`

**Alerting:** High priority alert to System Admin; not CRITICAL (system functional)

---

### F-003: Notification Provider Unavailable

**Detection:** Provider API timeout; HTTP error responses; webhook delivery failures

**User Experience:**

- In-app notifications still delivered (internal)
- SMS/email delivery delayed; user sees "Notification pending"
- Farmer booking confirmation still succeeds; notification will arrive when provider recovers

**Recovery Strategy:**

- Provider failover to secondary provider if configured
- Failed notifications queued for retry (up to 5 attempts with exponential backoff)
- If all providers fail: notifications marked `PENDING_PROVIDER_RECOVERY`

**Logging:** `NOTIFICATION_PROVIDER_FAILURE`, provider name, error response, notification_id

**Alerting:** HIGH alert to System Admin if > 10 notifications fail within 5 minutes

---

### F-004: Payment Provider Unavailable

**Detection:** Provider API timeout; circuit breaker triggered; error response codes

**User Experience:**

- Payment initiation: "Payment provider temporarily unavailable. Initiation will be retried automatically."
- Payment status shows `RETRYING`
- Farmer notified of retry status via in-app notification

**Recovery Strategy:**

- Payment attempt queued for automatic retry with exponential backoff
- Circuit breaker opens after N consecutive provider failures; halts retry attempts
- Circuit breaker half-opens after configured cooldown; resumes if provider responsive
- Manager notified to review after max retries

**Logging:** `PAYMENT_PROVIDER_FAILURE`, circuit breaker state changes, retry attempts

**Alerting:** HIGH alert to Manager; CRITICAL to System Admin if circuit breaker is open

---

### F-005: Internet Interruption at Centre (Offline Operation)

**Detection:** Centre device loses network connectivity; heartbeat to server stops

**User Experience (Officer Interface):**

- UI shows "Offline Mode Active" banner
- Check-in via QR scan continues using cached cryptographic verification key
- Queue display shows last cached state with "Last updated X minutes ago"
- New procurements can be initiated but sync required before submission

**Recovery Strategy:**

- Offline actions queued locally on device (IndexedDB or service worker cache)
- On connectivity restore: queued actions synced to server
- Conflict detection: if server state changed while offline, flag for Manager review
- Temporary offline state should not block physical operations at centre

**Logging:** `CENTRE_OFFLINE_MODE`, sync event log on reconnect, any conflict detected

**Alerting:** LOW alert logged; Manager sees offline status indicator in dashboard

---

## CATEGORY 2: Booking and Token Failures

### F-010: Duplicate Booking Attempt (User Error / Double Click)

**Detection:**

- API-level: Idempotency-Key header; same key = same result returned
- Business logic: check for active booking on same date for same farmer

**User Experience:**

- First click: booking confirmed
- Second click (with same idempotency key): same booking returned (HTTP 200, not 201)
- No duplicate booking created

**Recovery Strategy:** Idempotency key in Redis prevents double processing; Returns existing booking.

**Logging:** `DUPLICATE_BOOKING_ATTEMPT` if detected without idempotency key; idempotency resolution logged

---

### F-011: Race Condition During Slot Booking

**Scenario:** Two farmers simultaneously attempt the last slot in a slot window.

**Detection:** Optimistic lock failure on slot count decrement (UPDATE returns 0 rows)

**User Experience:**

- Farmer A (first to decrement successfully): Booking confirmed
- Farmer B (lost race): "This slot is now full. Please select another slot." Alternative slots shown.

**Recovery Strategy:**

- Database atomic decrement with WHERE available_count > 0
- If decrement fails: transaction rolled back; farmer B directed to alternatives

**Logging:** `SLOT_RACE_CONDITION_RESOLVED`, slot_id, winner and loser booking attempts

---

### F-012: Token Generation Failure (After Booking)

**Detection:** Token creation step throws exception within booking transaction

**User Experience:**

- Farmer sees "Booking could not be confirmed. Please try again." (HTTP 500)
- No partial state: booking transaction rolled back

**Recovery Strategy:**

- Entire booking transaction rolled back atomically
- Farmer's slot count is not decremented (atomicity)
- Farmer can retry immediately

**Logging:** `TOKEN_GENERATION_FAILED`, error details, booking attempt data

**Alerting:** ERROR level log; System Admin alerted if frequency > 3 in 5 minutes

---

### F-013: QR Token Invalid (Tampered or Corrupted)

**Detection:** HMAC signature verification fails during check-in scan

**User Experience (Officer):**

- Screen shows "Invalid token. Please verify farmer's identity manually."
- Manual check-in option shown (requires Manager approval)

**Recovery Strategy:**

- Farmer can regenerate their token (regeneration invalidates old token)
- Officer can perform manual check-in with Manager approval

**Logging:** `TOKEN_INVALID`, token payload (without signature), scanner IP, officer_id, centre_id

**Alerting:** If > 3 invalid token attempts from same device/IP in 10 minutes → FRAUD_ATTEMPT alert to Manager and System Admin

---

### F-014: QR Token Expired

**Detection:** `expires_at` < current UTC time

**User Experience (Officer):**

- Screen shows "Token has expired. Farmer's slot time has passed."
- If farmer is present and within officer discretion: manual check-in option shown
- Otherwise: farmer directed to reschedule

**Recovery Strategy:**

- Booking marked NO_SHOW if past grace period
- Farmer offered rescheduling via app

**Logging:** `TOKEN_EXPIRED`, booking_id, expiry_time, scan_time

---

### F-015: Fraudulent Token Reuse

**Detection:** A token with status `USED` is scanned again

**User Experience (Officer):**

- Screen shows "Token already used. This farmer is already checked in."

**Recovery Strategy:**

- No duplicate queue entry created
- Security event logged
- If farmer claims not to be checked in: Manager manually reviews queue (farmer may have been checked in fraudulently)

**Logging:** `FRAUD_FLAGGED_TOKEN`, token_id, booking_id, farmer_id, scan_time, scanner_id

**Alerting:** Immediate alert to Centre Manager and System Admin

---

### F-016: Duplicate Check-In Attempt

**Detection:** Booking already in CHECKED_IN status; queue entry already exists

**User Experience:** "This farmer has already been checked in. Queue position: [N]."

**Recovery Strategy:** No action needed; idempotent response returns existing queue entry.

**Logging:** `DUPLICATE_CHECKIN_ATTEMPT`, booking_id, officer_id

---

## CATEGORY 3: Procurement Failures

### F-020: Two Officers Editing the Same Procurement Record (Concurrent Access)

**Detection:** Optimistic locking using `version` field or `updated_at` timestamp

**User Experience:**

- Officer A saves successfully
- Officer B receives: "This record was updated by another user. Please refresh."

**Recovery Strategy:**

- Officer B's edit discarded; fresh copy of record shown
- Officer B can review and resubmit if appropriate

**Logging:** `CONCURRENT_EDIT_CONFLICT`, procurement_id, conflicting_officer_ids, timestamp

---

### F-021: Officer Enters Incorrect Weight

**Prevention:** Real-time validation: weight cannot be negative, cannot exceed maximum per crop per booking

**Detection (Post-submission):** Officer or Manager notices error

**User Experience:**

- Original weighment record preserved (read-only)
- Officer submits correction form: original_weighment_id + correction_value + reason
- Correction record created pending Manager approval

**Recovery Strategy:**

- Manager approves correction
- System recalculates net weight
- Payment amount updated if payment not yet INITIATED

**Logging:** `WEIGHMENT_CORRECTION_SUBMITTED`, `WEIGHMENT_CORRECTION_APPROVED`, original + correction values

---

### F-022: Equipment Failure During Weighing

**Detection:** Officer reports equipment as FAULTY via exception report

**User Experience (Farmer):**

- Farmer in queue: "Service temporarily paused due to equipment issue. Estimated resolution time: [X]."
- Farmer in WEIGHTING stage: "Weighing paused. Please wait."

**Recovery Strategy:**

- Queue paused
- Pending weighments moved to ON_HOLD
- If equipment cannot be repaired same day: affected bookings offered rescheduling
- Centre capacity reduced for remaining day

**Logging:** `EQUIPMENT_FAULT_REPORTED`, `QUEUE_PAUSED`, affected_booking_count

**Alerting:** Manager (immediate), District Admin (within 5 minutes)

---

### F-023: Quality Inspection Delay (Bottleneck)

**Detection:** Bottleneck detection: average inspection time > 2× baseline for 15 consecutive minutes

**User Experience:**

- ETAs extended automatically for all waiting farmers
- Farmers notified of updated ETA
- Manager receives bottleneck alert

**Recovery Strategy:**

- Manager assigns additional officer to support inspection
- ETA recalculated with new processing speed

**Logging:** `BOTTLENECK_DETECTED`, stage: INSPECTION, duration, severity

**Alerting:** MEDIUM alert to Manager; if persists > 30 min: HIGH alert to District Admin

---

### F-024: Procurement ON_HOLD SLA Breach

**Detection:** Background job checks ON_HOLD procurements every 10 minutes against SLA_HOURS

**User Experience:**

- Farmer: No visible change; already notified of hold
- Manager: Escalation notification: "Procurement [ID] has exceeded SLA. Immediate attention required."

**Recovery Strategy:**

- After SLA_HOURS: Manager alert
- After 2 × SLA_HOURS: District Admin escalation alert
- Farmer receives status update notification

**Logging:** `HOLD_SLA_BREACH`, `HOLD_ESCALATED_TO_DISTRICT_ADMIN`

---

## CATEGORY 4: Payment Failures

### F-030: Payment Callback Duplication (Webhook Replay)

**Detection:** Incoming webhook with same payment_reference_id as existing COMPLETED payment

**User Experience:** No visible effect; idempotent processing

**Recovery Strategy:**

- System checks payment_reference_id for existence
- If already processed: HTTP 200 returned with no state change
- Event logged as `DUPLICATE_PAYMENT_WEBHOOK_RECEIVED`

**Logging:** `DUPLICATE_PAYMENT_WEBHOOK_RECEIVED`, reference_id, timestamp

---

### F-031: Partial Transaction Failure (Payment Initiated but No Callback)

**Detection:** Payment is in INITIATED state for > timeout_minutes with no PROCESSING or COMPLETED transition

**User Experience:**

- Farmer sees payment as `INITIATED` with "Awaiting confirmation"
- Manager dashboard shows payment in pending review

**Recovery Strategy:**

- Background job checks for stale INITIATED payments (> 30 minutes old)
- Manager manually checks with payment provider
- Manager marks as FAILED or COMPLETED based on provider status

**Logging:** `STALE_PAYMENT_DETECTED`, payment_id, elapsed_time

**Alerting:** HIGH alert to Manager

---

### F-032: Payment Failure — Maximum Retries Exhausted

**Detection:** `retry_count` >= `payment.max_retries` configuration value

**User Experience:**

- Farmer: "Payment processing requires attention. Please contact the centre."
- Manager: "Payment for procurement [ID] requires manual intervention."

**Recovery Strategy:**

- Payment status → `INTERVENTION_REQUIRED`
- Manager contacts payment provider manually
- Manager manually triggers retry or confirms status

**Logging:** `PAYMENT_MAX_RETRIES_EXHAUSTED`, payment_id, retry history

**Alerting:** HIGH alert to Manager; MEDIUM to District Admin summary

---

## CATEGORY 5: Access and User Failures

### F-040: User Session Expired Mid-Operation

**Detection:** Access token TTL exceeded; refresh token check fails

**User Experience:**

- API returns HTTP 401 Unauthorized
- Frontend intercepts 401: redirects to login page
- In-progress form: if SSR/SPA handles it, form state preserved in session storage for post-login restoration

**Recovery Strategy:**

- Silent token refresh attempted first (using refresh token cookie)
- If refresh succeeds: operation retried transparently
- If refresh fails: user directed to login; intended action stored in URL state for post-login redirect

**Logging:** `SESSION_EXPIRED`, actor_id, endpoint attempted

---

### F-041: Account Lockout During Operations

**Detection:** Maximum failed login attempts reached

**User Experience:**

- Login page: "Account locked for 30 minutes due to multiple failed attempts. Contact support if this was not you."

**Recovery Strategy:**

- Auto-unlock after lockout_duration_minutes
- Manual unlock by System Admin

**Logging:** `ACCOUNT_LOCKED`, actor_id, attempt_count, IP, lockout_until

---

### F-042: No-Show Incorrectly Applied (System Error or Grace Period Bug)

**Detection:** Farmer disputes no-show record; Manager reviews

**User Experience:**

- Farmer submits no-show dispute via app
- Manager reviews check-in logs and timestamps
- If error confirmed: Manager overturns no-show

**Recovery Strategy:**

- Manager creates override record with reason
- No-show counter decremented
- Booking status corrected to reflect actual outcome

**Logging:** `NO_SHOW_DISPUTE_SUBMITTED`, `NO_SHOW_OVERTURNED`, actor IDs, reason

---

## CATEGORY 6: Data Consistency Failures

### F-050: Slot Count Inconsistency

**Scenario:** Slot's `confirmed_bookings` count drifts from actual confirmed bookings due to an edge case.

**Detection:** Scheduled reconciliation job compares `confirmed_bookings` counter with actual COUNT from bookings table

**Recovery Strategy:**

- Reconciliation job corrects the count
- Event logged for investigation
- Audit record of correction created

**Logging:** `SLOT_COUNT_RECONCILED`, slot_id, expected_count, actual_count, corrected_at

**Alerting:** MEDIUM alert to System Admin if frequency > 1 per day

---

### F-051: Orphaned Token (Booking Cancelled After Token Generated)

**Scenario:** Token exists but linked booking is CANCELLED.

**Detection:** Scheduled cleanup job looks for ACTIVE tokens where booking.status = CANCELLED

**Recovery Strategy:**

- Token status updated to INVALIDATED
- No check-in possible with invalidated token

**Logging:** `ORPHANED_TOKEN_CLEANUP`, token_id, booking_id

---

## CATEGORY 7: Configuration and Admin Failures

### F-060: Misconfiguration Leading to Overbooking

**Scenario:** Capacity configured at 0 due to admin error; all bookings rejected.

**Detection:** Capacity validation on booking attempt; manager notified

**Recovery Strategy:**

- Manager receives ZERO_CAPACITY_ALERT when capacity is set to 0
- System requires confirmation before saving 0-capacity configuration
- Minimum capacity floor (1) enforced at configuration save

**Logging:** `ZERO_CAPACITY_CONFIGURATION_WARNING`

---

### F-061: Admin Override Applied to Wrong Entity

**Scenario:** System Admin accidentally overrides the wrong procurement record.

**Detection:** Admin notices error; incorrect override logged

**Recovery Strategy:**

- Admin views audit log for the incorrect override
- Admin creates a corrective override (documented with reference to original error)
- No audit log entry is modifiable; both the error and correction are permanently recorded

**Logging:** Both original override and corrective override audit events

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
