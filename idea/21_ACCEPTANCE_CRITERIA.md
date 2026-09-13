# 21 — ACCEPTANCE CRITERIA

## SmartProcure: Feature-Level Acceptance Criteria

---

## Format

Acceptance criteria use the **Given / When / Then** (GWT) format where appropriate, supplemented with explicit test conditions, boundary conditions, and negative test cases.

---

## AC-AUTH: Authentication and Account Management

### AC-AUTH-001: Farmer Registration

```gherkin
Given an unregistered user visits the registration page,
When they provide a valid name, unique mobile number, and password meeting complexity rules,
And they verify their mobile via OTP within 5 minutes,
Then an active FARMER account must be created,
And a welcome notification must be sent to the mobile number.

Negative: Same mobile number → DUPLICATE_IDENTIFIER error.
Negative: OTP expired → TOKEN_EXPIRED error; resend option shown.
Negative: Password fails complexity → inline validation error before submit.
```

### AC-AUTH-002: Account Lockout

```gherkin
Given a user has 4 consecutive failed login attempts within 60 minutes,
When they make a 5th failed attempt,
Then the account status must transition to LOCKED,
And the user must receive a lockout notification,
And the System Admin must receive a SECURITY_ACCOUNT_LOCKED alert,
And all further login attempts must be rejected with ACCOUNT_LOCKED error until lockout expires.

Boundary: Successful login resets the consecutive failure counter.
Negative: Manual admin unlock before timer expires → account becomes ACTIVE immediately.
```

---

## AC-PROFILE: Farmer Profile

### AC-PROFILE-001: Profile Completion Gate

```gherkin
Given a farmer has completed less than 80% of required profile fields,
When they attempt to create a booking,
Then the system must reject the booking with PROFILE_INCOMPLETE error,
And return a list of the missing required fields.

Positive: Profile at exactly 80% or above → booking creation allowed.
```

### AC-PROFILE-002: Bank Detail Encryption

```gherkin
Given a farmer submits their bank account details,
When the profile is saved,
Then the bank account number must be stored in encrypted form (AES-256),
And the API response must return only the last 4 digits (masked: XXXXXX1234),
And the full account number must never appear in any API response or server log.
```

---

## AC-BOOKING: Booking Management

### AC-BOOK-001: Booking Confirmation and Token Generation

```gherkin
Given a farmer has a complete profile with a declared produce batch,
When they select a centre, date, and available slot and confirm the booking,
Then a booking record must be created in CONFIRMED status,
And a digital token must be generated in the same transaction,
And the slot's available_count must be decremented by 1,
And a BOOKING_CONFIRMED notification must be sent to the farmer,
And the farmer's booking list must show the new booking.

Negative: If token generation fails → entire booking is rolled back; no booking in CONFIRMED state.
```

### AC-BOOK-002: Slot Full — Race Condition Handling

```gherkin
Given a slot has exactly 1 available seat,
When two farmers simultaneously attempt to book that slot,
Then exactly one farmer receives a CONFIRMED booking,
And the other receives a SLOT_FULL error,
And the slot's available_count must be 0 (never negative),
And no overbooking must occur.
```

### AC-BOOK-003: Duplicate Booking Prevention

```gherkin
Given a farmer has an active CONFIRMED booking for date D at centre C,
When they attempt a second booking for date D (any centre),
Then the system must return ACTIVE_BOOKING_EXISTS error,
And the second booking must not be created.

Configurable exception: If max_active_bookings_per_farmer > 1, allow additional bookings.
```

### AC-BOOK-004: Cancellation within Cutoff

```gherkin
Given a farmer has a CONFIRMED booking at slot starting in 5 hours,
And the cancellation cutoff is configured to 4 hours,
When the farmer cancels the booking,
Then the booking must transition to CANCELLED status,
And the slot available_count must be incremented by 1,
And a BOOKING_CANCELLED_SELF notification must be sent,
And the associated token must be INVALIDATED.
```

### AC-BOOK-005: No-Show Detection

```gherkin
Given a farmer has a CONFIRMED booking for slot S,
When slot S end time + grace period passes and the booking is still in CONFIRMED status (not CHECKED_IN),
Then the booking must be automatically transitioned to NO_SHOW status,
And the farmer's no_show_count must be incremented,
And a NO_SHOW_RECORDED notification must be sent to the farmer,
And the slot available_count must be incremented (capacity released).
```

---

## AC-TOKEN: Digital Token

### AC-TOKEN-001: Token Validation at Check-In

```gherkin
Given an officer scans a farmer's valid QR token at the correct centre on the correct date,
When the token signature is verified and expiry is valid,
Then a check-in record must be created,
And the booking must transition to CHECKED_IN,
And a queue entry must be created for the farmer,
And the token must transition to USED (single-use),
And a CHECKIN_CONFIRMED notification must be sent to the farmer with queue position and ETA.

Negative: Expired token → TOKEN_EXPIRED error; manual check-in option shown.
Negative: Wrong centre → TOKEN_MISMATCH error.
Negative: Already USED token → ALREADY_CHECKED_IN error; FRAUD_FLAGGED event logged.
Negative: Invalid signature → TOKEN_INVALID error; security event logged.
```

---

## AC-QUEUE: Queue Management

### AC-QUEUE-001: Queue Position Assignment

```gherkin
Given farmer A checks in at 09:05 and farmer B checks in at 09:10 for the same slot,
When both check-ins are successful,
Then farmer A must have a lower queue position number than farmer B,
And both ETAs must reflect their respective positions.
```

### AC-QUEUE-002: Late Arrival Within Grace Period

```gherkin
Given a slot starts at 09:00 and the grace period is 30 minutes,
When a farmer checks in at 09:25,
Then they must be assigned their original slot-ordered position (not end of queue),
And they must receive their ETA based on that position.
```

### AC-QUEUE-003: Late Arrival Past Grace Period

```gherkin
Given a slot starts at 09:00 and grace period is 30 minutes,
When a farmer checks in at 10:00,
Then they must be placed at the end of the current queue,
And they must receive a notification that they have been placed at the end due to late arrival.
```

### AC-QUEUE-004: Queue Pause

```gherkin
Given a manager pauses the queue due to equipment failure,
When the queue is paused,
Then no CALLED transitions may occur,
And all waiting farmers must receive a QUEUE_PAUSED notification,
And farmer ETAs must display "Service temporarily paused",
And the pause must be logged with actor ID and timestamp.
```

---

## AC-PROCUREMENT: Procurement Operations

### AC-PROC-001: Complete Procurement Flow

```gherkin
Given a farmer is in IN_SERVICE state (called from queue),
When the officer records a valid weighment followed by a quality inspection with passing grades,
And the officer submits for approval (within threshold),
Then the procurement must be APPROVED,
And a digital receipt must be generated with all details,
And a payment record must be created in PENDING status,
And the farmer must receive PROCUREMENT_COMPLETED notification.
```

### AC-PROC-002: Weight Correction Immutability

```gherkin
Given an officer has recorded a weighment with an error,
When the officer submits a correction request with original_weighment_id, corrected value, and reason,
Then a new CORRECTION weighment record must be created,
And the original weighment record must remain unchanged in the database,
And the correction must be pending Manager approval,
And both records must be queryable for audit purposes.

Negative: Attempting to update the original weighment record directly → IMMUTABLE_RECORD_ERROR.
```

### AC-PROC-003: High-Value Approval Escalation

```gherkin
Given the approval threshold is configured at 100 quintals,
When a procurement with net weight > 100 quintals is submitted for approval by an officer,
Then the procurement must NOT be auto-approved,
And it must transition to PENDING_DECISION awaiting Manager action,
And the Manager must receive an APPROVAL_WAITING notification.
```

### AC-PROC-004: Quality Inspection Override

```gherkin
Given a quality inspection resulted in INSPECTION_FAIL due to moisture content exceeding threshold,
When a Manager approves an override with a documented reason,
Then the inspection status must transition to OVERRIDDEN,
And the override reason must be stored,
And the audit log must record the Manager ID, reason, original result, and override result.

Negative: Officer attempting to override without Manager role → AUTHORIZATION_DENIED.
```

---

## AC-PAYMENT: Payment Tracking

### AC-PAY-001: Payment Record on Approval

```gherkin
Given a procurement transitions to APPROVED status,
When the approval is committed,
Then a payment record must be created in PENDING status in the same transaction,
And the payment record must contain: procurement_id, farmer_id, calculated_amount, bank_account_snapshot,
And the farmer must see the payment in their dashboard as PENDING.

Negative: If payment record creation fails → procurement approval transaction is rolled back.
```

### AC-PAY-002: Payment Idempotency

```gherkin
Given a payment webhook is received from the provider confirming COMPLETED for payment_id X,
When the same webhook is received a second time (duplicate),
Then the payment status must remain COMPLETED (no state change),
And the response must be HTTP 200,
And the duplicate event must be logged,
And no duplicate payment must be initiated.
```

### AC-PAY-003: Payment Failure and Retry

```gherkin
Given a payment is in INITIATED state and the provider returns a failure,
When the failure event is processed,
Then the payment status must transition to FAILED,
And an automatic retry must be scheduled based on retry policy,
And the farmer must receive a PAYMENT_FAILED notification,
And the retry count must be tracked.

When max retries are exhausted:
Then the status must transition to INTERVENTION_REQUIRED,
And the Manager must receive PAYMENT_INTERVENTION_REQUIRED notification.
```

---

## AC-NOTIF: Notifications

### AC-NOTIF-001: Booking Confirmation Notification

```gherkin
Given a booking transitions to CONFIRMED status,
When the notification event is emitted,
Then a BOOKING_CONFIRMED in-app notification must appear in the farmer's inbox,
And an SMS must be sent to the farmer's mobile number within 60 seconds,
And the notification delivery status must be tracked.

Negative: If SMS fails → retry policy applies; in-app notification is always delivered.
```

### AC-NOTIF-002: Notification Retry

```gherkin
Given a notification delivery attempt to SMS provider fails,
When the failure is received,
Then the notification must be rescheduled for retry at 1 minute, 5 minutes, 30 minutes, 2 hours, 24 hours,
And the delivery status must show RETRYING,
And after 5 failures the status must be PERMANENTLY_FAILED,
And a System Admin alert must be raised for HIGH priority notifications.
```

---

## AC-AUDIT: Audit Logging

### AC-AUDIT-001: Audit Log Completeness

```gherkin
Given any sensitive operation is performed (booking/cancel/approve/reject/correct/override),
When the operation is committed,
Then an audit log entry must be created within the same transaction,
And the entry must contain: actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, timestamp, ip_address,
And if the audit log creation fails → the main operation must be rolled back.

Verification: 100% of sensitive operations in production must have corresponding audit records with no gaps.
```

### AC-AUDIT-002: Audit Log Immutability

```gherkin
Given any user (including System Admin) sends a DELETE or UPDATE request to an audit record,
Then the request must return METHOD_NOT_ALLOWED (405) or IMMUTABLE_RECORD_ERROR (403),
And the audit record must remain unchanged,
And the attempt must itself be logged.
```

---

## AC-SEC: Security Acceptance Criteria

### AC-SEC-001: SQL Injection Prevention

```gherkin
Given an attacker sends a booking request with SQL injection in the crop_name field (e.g., "'; DROP TABLE bookings; --"),
When the request is processed,
Then the query must execute safely using parameterised inputs,
And no SQL error must be exposed in the response,
And the malicious string must be stored as literal text (not executed).
```

### AC-SEC-002: JWT Expiry Enforcement

```gherkin
Given a farmer received a JWT access token with 15-minute TTL,
When they make an API request with this token after 16 minutes,
Then the response must be HTTP 401 Unauthorized,
And the response body must indicate TOKEN_EXPIRED,
And no data must be returned.
```

### AC-SEC-003: Role Boundary Enforcement

```gherkin
Given a FARMER user's JWT is used to call GET /api/v1/analytics/district/:id/overview,
When the request is processed,
Then the response must be HTTP 403 Forbidden,
And no district data must be returned,
And the access attempt must be logged.
```

---

## AC-RECM: Recommendation Engine

### AC-RECM-001: Basic Recommendation Output

```gherkin
Given a farmer requests recommendations with a valid location, crop type, and preferred date,
When the recommendation engine is invoked,
Then the response must return at least 1 recommendation if any eligible centre exists within radius,
And each recommendation must include: centre_id, distance_km, estimated_wait_minutes, available_slots, score, explanation text.
```

### AC-RECM-002: No Available Centres Fallback

```gherkin
Given no centres within the configured radius accept the farmer's crop for the requested date,
When the recommendation engine expands the radius and still finds no results,
Then the response must indicate NO_CENTRES_AVAILABLE,
And return the nearest 3 centres with their next available date,
And suggest alternative dates.
```

---

## AC-ANALYTICS: Analytics and Dashboards

### AC-ANALYTICS-001: Centre Manager Live Dashboard

```gherkin
Given a Centre Manager is logged in and viewing their centre's dashboard,
When a new farmer checks in,
Then the queue depth counter on the dashboard must reflect the updated count within 60 seconds,
And the ETA for the last farmer in queue must be recalculated and displayed.
```

### AC-ANALYTICS-002: Cross-Centre District View

```gherkin
Given a District Admin views the district overview,
Then they must see all centres assigned to their district,
And each centre must show: name, operational status, congestion level, current queue depth, and today's throughput,
And no centres from other districts must appear in the view.
```

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
