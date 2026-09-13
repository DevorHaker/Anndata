# 09 — MODULE SPECIFICATIONS

## SmartProcure: Detailed Module-Level Specification Reference

_This document provides expanded detail for key modules. Functional requirements are in 05_FUNCTIONAL_REQUIREMENTS.md. This document adds implementation-critical specifications._

---

## MODULE SPEC 1 — Booking Module

### Booking Uniqueness Enforcement

The system must prevent duplicate bookings using a unique constraint:

```
UNIQUE (farmer_id, slot_id, date)
```

At the API layer, a distributed lock (Redis-based) with key `booking_lock:{farmer_id}:{date}` must be acquired before slot count decrement to prevent race conditions on concurrent booking attempts.

Lock TTL: 10 seconds. If lock cannot be acquired within 2 seconds, return `SLOT_TEMPORARILY_UNAVAILABLE`.

### Slot Count Atomicity

Slot capacity is managed using an optimistic lock or database-level atomic decrement:

```sql
UPDATE slots
SET available_count = available_count - 1
WHERE slot_id = $1 AND available_count > 0
RETURNING available_count;
```

If 0 rows returned → slot is full; the booking is rejected.

### Cancellation Policy Enforcement

```
cancellation_allowed = NOW() < (slot_start_time - cancellation_cutoff_hours)
```

If `cancellation_allowed = false`, the cancellation event is placed into a `PENDING_MANAGER_APPROVAL` queue.

---

## MODULE SPEC 2 — Token Module

### Token Payload Structure

```json
{
  "version": 1,
  "booking_id": "uuid",
  "farmer_id": "uuid",
  "centre_id": "uuid",
  "slot_id": "uuid",
  "date": "YYYY-MM-DD",
  "issued_at": "ISO8601 UTC",
  "expires_at": "ISO8601 UTC",
  "nonce": "random 16-byte hex"
}
```

### Signature

`HMAC-SHA256(JSON.stringify(payload), SERVER_TOKEN_SECRET)`

The signature is appended to the QR payload and verified on every scan.

### QR Code Format

The QR code encodes a URL-safe base64 representation of the signed payload, which can also be verified offline using cached public key / HMAC as appropriate.

### Offline Tolerance

For offline verification, the officer device caches the centre's verification key (symmetric HMAC key, refreshed daily) at session start. This allows check-in to proceed without network connectivity. Offline check-ins are queued for server sync.

---

## MODULE SPEC 3 — Queue Module

### Queue Position Assignment

Position is determined at check-in time:

```
NEW_POSITION = MAX(position) + 1 WHERE centre_id = $1 AND slot_date = $2 AND slot_id = $3 AND status = WAITING
```

Late arrivals within grace period retain their original slot-ordered position.

### ETA Calculation Algorithm (MVP)

```
rolling_avg_processing_time = AVG(processing_time)
                               FROM last 10 completed procurements
                               WHERE centre_id = $1

ETA = current_queue_position × rolling_avg_processing_time
```

If `rolling_avg_processing_time` has no data (first farmers of the day), use centre's configured default processing time.

### Queue Pause Behavior

When queue is paused:

1. No new CALLED transitions allowed
2. ETA displays "Service temporarily paused — please wait"
3. All waiting farmers receive `QUEUE_PAUSED` push notification
4. On resume: resume notification + recalculated ETA

---

## MODULE SPEC 4 — Recommendation Engine

### Scoring Algorithm (Rule-Based MVP)

For each eligible centre `c`:

```
score(c) = (w1 × distance_score)
         + (w2 × queue_score)
         + (w3 × slot_availability_score)
         + (w4 × equipment_score)
         + (w5 × historical_congestion_score)
         + (w6 × predicted_queue_score)
```

**Weights (configurable, defaults):**

```
w1 = 0.30  (distance — lower distance = higher score)
w2 = 0.25  (current queue — lower queue = higher score)
w3 = 0.20  (slot availability — more slots = higher score)
w4 = 0.15  (equipment operational ratio)
w5 = 0.10  (historical congestion — lower historical = higher score)
w6 = 0.00  (predicted queue — enabled once historical data available)
```

**Score Normalisation:**
Each factor is normalised to [0, 1] before applying weights.

**Distance Score:**

```
distance_score = 1 - (distance / max_radius)
```

Centres beyond `max_radius` are excluded entirely.

**Queue Score:**

```
queue_score = 1 - (current_queue_depth / centre_daily_capacity)
```

**Slot Availability Score:**

```
slot_availability_score = available_slots_for_date / total_slots_for_date
```

**Equipment Score:**

```
equipment_score = operational_equipment_count / total_equipment_count
```

### Recommendation Output

```json
{
  "recommendations": [
    {
      "rank": 1,
      "centre_id": "uuid",
      "centre_name": "string",
      "distance_km": 5.2,
      "estimated_wait_minutes": 35,
      "available_slots": 8,
      "score": 0.872,
      "explanation": "Closest centre with low current queue and full equipment availability.",
      "available_slot_times": ["09:00-11:00", "11:00-13:00"]
    }
  ],
  "computed_at": "ISO8601",
  "engine_version": "rule-based-v1"
}
```

### Pluggable Engine Design

```javascript
// Interface definition (TypeScript-style pseudocode)
interface RecommendationEngine {
  recommend(input: RecommendationInput): Promise<RecommendationResult>;
  getEngineVersion(): string;
}

// Implementations
class RuleBasedEngine implements RecommendationEngine { ... }
class StatisticalEngine implements RecommendationEngine { ... }
class MLModelEngine implements RecommendationEngine { ... }

// Factory
function getRecommendationEngine(config: Config): RecommendationEngine {
  switch (config.RECOMMENDATION_ENGINE_TYPE) {
    case 'rule-based': return new RuleBasedEngine(config);
    case 'statistical': return new StatisticalEngine(config);
    case 'ml': return new MLModelEngine(config);
  }
}
```

---

## MODULE SPEC 5 — Audit Module

### Audit Event Schema

```json
{
  "audit_id": "uuid",
  "request_id": "uuid (from X-Request-ID header)",
  "actor_id": "uuid",
  "actor_role": "FARMER | OFFICER | MANAGER | DISTRICT_ADMIN | SYSTEM_ADMIN | SYSTEM",
  "action": "BOOKING_CREATED | BOOKING_CANCELLED | TOKEN_GENERATED | ...",
  "entity_type": "BOOKING | TOKEN | PROCUREMENT | PAYMENT | ...",
  "entity_id": "uuid",
  "before_state": {/* JSON snapshot of entity before change */},
  "after_state": {/* JSON snapshot of entity after change */},
  "timestamp": "ISO8601 UTC",
  "ip_address": "string",
  "user_agent": "string",
  "metadata": {/* additional context */}
}
```

### Audit Service Integration

AuditService is called synchronously before the main database commit, within the same transaction. If AuditService fails to write, the entire transaction is rolled back. This ensures no state change can exist without an audit record.

```javascript
// Pseudocode pattern
async function createBooking(data, actor) {
  return await db.transaction(async (trx) => {
    const booking = await BookingRepository.create(data, trx);
    await AuditService.log(
      {
        actor,
        action: "BOOKING_CREATED",
        entity_type: "BOOKING",
        entity_id: booking.id,
        before_state: null,
        after_state: booking,
      },
      trx,
    );
    return booking;
  });
}
```

---

## MODULE SPEC 6 — Notification Module

### Notification Event Registry

| Event Type             | Priority | Default Channels    |
| ---------------------- | -------- | ------------------- |
| BOOKING_CONFIRMED      | HIGH     | SMS + Push + In-App |
| BOOKING_CANCELLED      | HIGH     | SMS + Push + In-App |
| SLOT_REMINDER_24H      | MEDIUM   | Push + In-App       |
| SLOT_REMINDER_2H       | HIGH     | SMS + Push          |
| CHECKIN_CONFIRMED      | HIGH     | Push + In-App       |
| QUEUE_APPROACHING      | HIGH     | Push + SMS          |
| QUEUE_PAUSED           | HIGH     | Push + SMS          |
| QUEUE_RESUMED          | MEDIUM   | Push                |
| PROCUREMENT_COMPLETED  | HIGH     | Push + SMS + In-App |
| QUALITY_REJECTED       | HIGH     | Push + SMS          |
| PAYMENT_INITIATED      | MEDIUM   | In-App              |
| PAYMENT_COMPLETED      | HIGH     | SMS + Push + In-App |
| PAYMENT_FAILED         | HIGH     | SMS + Push          |
| NO_SHOW_RECORDED       | MEDIUM   | Push + In-App       |
| BOOKING_SUSPENDED      | HIGH     | SMS + Push          |
| CENTRE_CLOSED          | HIGH     | SMS + Push          |
| RESCHEDULING_CONFIRMED | HIGH     | SMS + Push + In-App |

### Template Engine

Templates support variable interpolation:

```
"Dear {{farmer_name}}, your booking at {{centre_name}} on {{booking_date}} at {{slot_time}} is confirmed. Token: {{token_code}}."
```

Templates are stored in the database and editable by System Admin.

---

## MODULE SPEC 7 — Payment Module

### Payment Amount Calculation

```
payment_amount = net_weight_kg × MSP_rate_per_kg × quality_grade_modifier
```

Where:

- `net_weight_kg`: from approved weighing record
- `MSP_rate_per_kg`: the MSP for the crop type at the district level, effective on the booking date (stored snapshot)
- `quality_grade_modifier`: configured per grade (e.g., Grade A = 1.0, Grade B = 0.95, Grade C = 0.90)

### Payment Record Creation

Created atomically on procurement APPROVED transition:

```json
{
  "payment_id": "uuid",
  "procurement_id": "uuid",
  "farmer_id": "uuid",
  "amount": 12500.0,
  "currency": "INR",
  "bank_account_snapshot": {
    "account_number_masked": "XXXXXX1234",
    "ifsc": "SBIN0001234",
    "bank_name": "State Bank of India"
  },
  "status": "PENDING",
  "created_at": "ISO8601"
}
```

Note: Full bank account number is retrieved from the encrypted field only at payment initiation time, passed to payment provider, never stored in payment record in plaintext.

---

## MODULE SPEC 8 — Congestion Detection Module

### Detection Logic

Run every 5 minutes (configurable) as a background job:

```
For each ACTIVE centre c:
  current_queue_depth = COUNT(*) WHERE centre_id = c.id AND queue_status IN ('WAITING', 'CALLED')
  congestion_ratio = current_queue_depth / c.daily_capacity

  If congestion_ratio >= RED_THRESHOLD (default: 0.90):
    Create CONGESTION_EVENT(severity: RED)
    Alert Manager + District Admin
    Suggest load balancing

  Else if congestion_ratio >= YELLOW_THRESHOLD (default: 0.70):
    Create CONGESTION_EVENT(severity: YELLOW)
    Alert Manager

  Update centre.congestion_status accordingly
```

### Congestion Event Schema

```json
{
  "event_id": "uuid",
  "centre_id": "uuid",
  "timestamp": "ISO8601",
  "congestion_ratio": 0.87,
  "severity": "YELLOW | RED",
  "current_queue_depth": 43,
  "daily_capacity": 50,
  "contributing_factors": ["EQUIPMENT_REDUCED", "STAFF_SHORTAGE"]
}
```

---

## MODULE SPEC 9 — Cross-Centre Load Balancing Module

### Imbalance Detection Logic

```
For each district d:
  For each pair (centre_a, centre_b) in d.centres:
    if centre_a.congestion_ratio > HIGH_THRESHOLD (0.85)
    AND centre_b.congestion_ratio < LOW_THRESHOLD (0.40):
      generate_balancing_suggestion(overloaded: centre_a, underloaded: centre_b)
```

### Balancing Suggestion Schema

```json
{
  "suggestion_id": "uuid",
  "district_id": "uuid",
  "generated_at": "ISO8601",
  "overloaded_centre": {
    "centre_id": "uuid",
    "name": "string",
    "congestion_ratio": 0.91,
    "current_queue": 45
  },
  "underloaded_centre": {
    "centre_id": "uuid",
    "name": "string",
    "congestion_ratio": 0.35,
    "available_slots": 20
  },
  "recommended_transfer_count": 10,
  "eligible_bookings": ["booking_id_1", "booking_id_2", "..."],
  "status": "PENDING | ACCEPTED | REJECTED | APPLIED"
}
```

When District Admin accepts a suggestion, the system sends rescheduling offers to farmers with bookings at the overloaded centre. Farmer acceptance is required before their booking is transferred.

---

## MODULE SPEC 10 — Configuration Module

### Configuration Hierarchy

```
System-level config (System Admin)
  └── District-level config overrides (District Admin, within system bounds)
        └── Centre-level config overrides (Centre Manager, within district bounds)
```

### Key Configuration Parameters

| Config Key                               | Default Value | Who Can Change | Level    |
| ---------------------------------------- | ------------- | -------------- | -------- |
| `booking.advance_days`                   | 7             | System Admin   | System   |
| `booking.cancellation_cutoff_hours`      | 4             | Centre Manager | Centre   |
| `booking.max_active_bookings_per_farmer` | 1             | District Admin | District |
| `booking.reschedule_limit`               | 1             | System Admin   | System   |
| `auth.otp_ttl_seconds`                   | 300           | System Admin   | System   |
| `auth.max_login_attempts`                | 5             | System Admin   | System   |
| `auth.lockout_duration_minutes`          | 30            | System Admin   | System   |
| `queue.grace_period_minutes`             | 30            | Centre Manager | Centre   |
| `queue.skip_timeout_minutes`             | 5             | Centre Manager | Centre   |
| `noshow.suspension_threshold`            | 3             | District Admin | District |
| `noshow.grace_period_minutes`            | 30            | Centre Manager | Centre   |
| `congestion.yellow_threshold`            | 0.70          | District Admin | District |
| `congestion.red_threshold`               | 0.90          | District Admin | District |
| `payment.max_retries`                    | 3             | System Admin   | System   |
| `procurement.hold_sla_hours`             | 2             | Centre Manager | Centre   |
| `recommendation.max_radius_km`           | 50            | District Admin | District |
| `recommendation.engine_type`             | `rule-based`  | System Admin   | System   |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
