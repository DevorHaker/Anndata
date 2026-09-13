# 08 — STATE MACHINES

## SmartProcure: Complete Entity State Machine Definitions

---

## Design Conventions

- States are written in `UPPER_SNAKE_CASE`
- Transitions show: `SOURCE_STATE --[trigger / actor]--> TARGET_STATE`
- **Auto** = system-triggered transition (event, background job, timer)
- **Manual** = human-triggered transition
- Invalid transitions return `STATE_TRANSITION_ERROR`

---

## 1. BOOKING STATE MACHINE

### States

| State         | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `DRAFT`       | Farmer has started the booking process but not confirmed                |
| `PENDING`     | Booking submitted; awaiting slot lock confirmation                      |
| `CONFIRMED`   | Booking confirmed; token generated; slot count decremented              |
| `CHECKED_IN`  | Farmer has successfully checked in at the centre                        |
| `IN_QUEUE`    | Farmer is in the live queue                                             |
| `CALLED`      | Farmer has been called for service                                      |
| `PROCESSING`  | Farmer's procurement operation is in progress                           |
| `COMPLETED`   | Procurement fully completed and payment record created                  |
| `CANCELLED`   | Booking cancelled by farmer, manager, or system                         |
| `EXPIRED`     | Slot passed without farmer action (pre-check-in)                        |
| `NO_SHOW`     | Farmer did not check in; declared no-show after slot end                |
| `RESCHEDULED` | Original booking cancelled due to rescheduling; replaced by new booking |
| `ON_HOLD`     | Booking/procurement placed on hold for exceptional reason               |

### Allowed Transitions

```
DRAFT         --[Farmer confirms / System validates]-->   CONFIRMED
DRAFT         --[Farmer abandons / timeout 10 min]-->     EXPIRED

CONFIRMED     --[Farmer checks in / Officer scans QR]--> CHECKED_IN
CONFIRMED     --[Farmer cancels (within cutoff)]-->       CANCELLED
CONFIRMED     --[Manager cancels]--> CANCELLED
CONFIRMED     --[Rescheduling initiated]-->               RESCHEDULED
CONFIRMED     --[Slot start + grace period passes / no check-in]-->  NO_SHOW
CONFIRMED     --[Centre CLOSED]--> CANCELLED (with rescheduling offer)

CHECKED_IN    --[Queue entry created]-->                  IN_QUEUE

IN_QUEUE      --[Officer calls farmer]-->                 CALLED
IN_QUEUE      --[Queue paused]-->                         IN_QUEUE (status flag: PAUSED)
IN_QUEUE      --[Centre CLOSED / exceptional closure]--> CANCELLED

CALLED        --[Procurement initiated]-->                PROCESSING
CALLED        --[Farmer does not appear within N min]--> IN_QUEUE (SKIPPED, back to end)

PROCESSING    --[Procurement APPROVED]-->                 COMPLETED
PROCESSING    --[Procurement REJECTED]-->                 COMPLETED (with rejection note)
PROCESSING    --[Manager places ON_HOLD]-->               ON_HOLD

ON_HOLD       --[Manager resolves]-->                     PROCESSING
ON_HOLD       --[SLA exceeded / District Admin closes]-->  CANCELLED

COMPLETED     --[Terminal state — no further transitions]

CANCELLED     --[Terminal state — no further transitions]
EXPIRED       --[Terminal state — no further transitions]
NO_SHOW       --[Terminal state — no further transitions] (except if disputed successfully → CONFIRMED via override)
RESCHEDULED   --[Terminal state — no further transitions]
```

### Invalid Transitions (examples)

- `COMPLETED` → any other state
- `CANCELLED` → any other state
- `CHECKED_IN` → `CONFIRMED` (cannot un-check-in)
- `NO_SHOW` → `IN_QUEUE` (without admin override + audit)

### Who Triggers Each Transition

| Transition             | Trigger Actor                         |
| ---------------------- | ------------------------------------- |
| DRAFT → CONFIRMED      | Farmer (confirm button)               |
| CONFIRMED → CHECKED_IN | Officer (QR scan) or Manager (manual) |
| CONFIRMED → CANCELLED  | Farmer (within cutoff) or Manager     |
| CONFIRMED → NO_SHOW    | System (background job)               |
| IN_QUEUE → CALLED      | Officer                               |
| CALLED → PROCESSING    | Officer                               |
| PROCESSING → COMPLETED | System (on procurement approval)      |
| PROCESSING → ON_HOLD   | Officer or Manager                    |
| ON_HOLD → PROCESSING   | Manager                               |

---

## 2. TOKEN STATE MACHINE

### States

| State           | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `GENERATED`     | Token created on booking confirmation                                  |
| `ACTIVE`        | Token is valid and not yet used                                        |
| `USED`          | Token was scanned and accepted at check-in                             |
| `EXPIRED`       | Token expiry time has passed without use                               |
| `INVALIDATED`   | Token explicitly invalidated (e.g., on regeneration or booking cancel) |
| `FRAUD_FLAGGED` | Token was used (status: USED) and scanned again — potential fraud      |

### Transitions

```
GENERATED  --[Auto, immediately]--> ACTIVE

ACTIVE     --[Successful QR scan at valid centre]--> USED
ACTIVE     --[Slot end time + grace period passes]--> EXPIRED
ACTIVE     --[Farmer regenerates token]--> INVALIDATED
ACTIVE     --[Booking cancelled]--> INVALIDATED

USED       --[Second scan attempted]--> FRAUD_FLAGGED (immutable, alert raised)

EXPIRED    --[Terminal]
INVALIDATED  --[Terminal]
FRAUD_FLAGGED  --[Terminal, logged, manager alerted]
USED       --[Terminal]
```

---

## 3. QUEUE ENTRY STATE MACHINE

### States

| State           | Description                                            |
| --------------- | ------------------------------------------------------ |
| `WAITING`       | Farmer is in queue, waiting to be called               |
| `CALLED`        | Farmer has been called to the service window           |
| `SKIPPED`       | Farmer was called but not present; temporarily skipped |
| `WAITING_AGAIN` | Farmer was skipped and placed back in queue            |
| `IN_SERVICE`    | Farmer is actively being served                        |
| `COMPLETED`     | Farmer's service is complete                           |
| `LEFT_QUEUE`    | Farmer voluntarily left the queue                      |
| `REMOVED`       | Farmer removed from queue by Manager with reason       |

### Transitions

```
WAITING         --[Officer calls next]--> CALLED
CALLED          --[Farmer presents]--> IN_SERVICE
CALLED          --[Farmer absent after N minutes]--> SKIPPED
SKIPPED         --[Manager/Officer places back]--> WAITING_AGAIN
WAITING_AGAIN   --[Officer calls again]--> CALLED
IN_SERVICE      --[Procurement completed or rejected]--> COMPLETED
WAITING         --[Farmer asks to leave]--> LEFT_QUEUE
WAITING         --[Manager removes with reason]--> REMOVED
COMPLETED       --[Terminal]
LEFT_QUEUE      --[Terminal]
REMOVED         --[Terminal]
```

---

## 4. PROCUREMENT STATE MACHINE

### States

| State              | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `INITIATED`        | Procurement record created when farmer is called           |
| `WEIGHING`         | Weighing in progress                                       |
| `INSPECTING`       | Quality inspection in progress                             |
| `PENDING_DECISION` | Weighing and inspection complete; awaiting approval        |
| `APPROVED`         | Procurement approved; payment record created               |
| `REJECTED`         | Procurement rejected; reason recorded                      |
| `ON_HOLD`          | Procurement paused for investigation or review             |
| `CANCELLED`        | Procurement cancelled before completion (exceptional case) |
| `CLOSED`           | Payment completed; fully closed                            |

### Transitions

```
INITIATED       --[Officer starts weighing]--> WEIGHING
WEIGHING        --[All weights recorded]--> INSPECTING
INSPECTING      --[Inspection complete]--> PENDING_DECISION
PENDING_DECISION --[Officer/Manager approves (within authority)]--> APPROVED
PENDING_DECISION --[Officer/Manager rejects]--> REJECTED
PENDING_DECISION --[Manager places on hold]--> ON_HOLD
ON_HOLD         --[Manager resolves]--> PENDING_DECISION
APPROVED        --[Payment COMPLETED]--> CLOSED
REJECTED        --[Terminal unless successfully appealed → PENDING_DECISION via override]
CANCELLED       --[Terminal]
CLOSED          --[Terminal]
```

---

## 5. QUALITY INSPECTION STATE MACHINE

### States

| State         | Description                               |
| ------------- | ----------------------------------------- |
| `PENDING`     | Inspection not yet started                |
| `IN_PROGRESS` | Officer actively recording inspection     |
| `PASSED`      | All parameters meet thresholds            |
| `FAILED`      | One or more parameters outside thresholds |
| `OVERRIDDEN`  | Failed inspection overridden by Manager   |
| `REJECTED`    | Final rejection after inspection          |

### Transitions

```
PENDING      --[Officer starts inspection]--> IN_PROGRESS
IN_PROGRESS  --[All params within threshold]--> PASSED
IN_PROGRESS  --[Any param outside threshold]--> FAILED
FAILED       --[Manager overrides with reason]--> OVERRIDDEN
FAILED       --[Officer confirms rejection]--> REJECTED
PASSED       --[Feeds into PENDING_DECISION]
OVERRIDDEN   --[Feeds into PENDING_DECISION as PASSED]
REJECTED     --[Feeds into procurement REJECTED]
```

---

## 6. PAYMENT STATE MACHINE

### States

| State                   | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `PENDING`               | Payment record created; not yet initiated              |
| `INITIATED`             | Payment instruction sent to payment provider           |
| `PROCESSING`            | Payment provider confirmed receipt; processing ongoing |
| `COMPLETED`             | Payment confirmed by provider                          |
| `FAILED`                | Payment attempt failed                                 |
| `RETRYING`              | Auto-retry in progress                                 |
| `INTERVENTION_REQUIRED` | Max retries exhausted; manual action needed            |

### Transitions

```
PENDING         --[Manager initiates payment]--> INITIATED
INITIATED       --[Provider acknowledges]--> PROCESSING
PROCESSING      --[Provider confirms success]--> COMPLETED
PROCESSING      --[Provider reports failure]--> FAILED
FAILED          --[Auto-retry within limit]--> RETRYING
RETRYING        --[Retry succeeds]--> PROCESSING
RETRYING        --[Retry fails]--> FAILED
FAILED          --[Max retries exceeded]--> INTERVENTION_REQUIRED
INTERVENTION_REQUIRED --[Manager manually resolves]--> INITIATED (re-attempt) or CANCELLED
COMPLETED       --[Terminal]
```

---

## 7. EQUIPMENT STATE MACHINE

### States

| State               | Description                                    |
| ------------------- | ---------------------------------------------- |
| `OPERATIONAL`       | Equipment working normally                     |
| `FAULTY`            | Equipment non-functional; needs repair         |
| `UNDER_MAINTENANCE` | Equipment in scheduled/unscheduled maintenance |
| `DECOMMISSIONED`    | Equipment permanently retired                  |

### Transitions

```
OPERATIONAL     --[Fault reported]--> FAULTY
OPERATIONAL     --[Scheduled maintenance started]--> UNDER_MAINTENANCE
FAULTY          --[Repair completed / functional]--> OPERATIONAL
FAULTY          --[Maintenance begins]--> UNDER_MAINTENANCE
UNDER_MAINTENANCE --[Maintenance complete]--> OPERATIONAL
UNDER_MAINTENANCE --[Equipment beyond repair]--> DECOMMISSIONED
OPERATIONAL     --[Retired]--> DECOMMISSIONED
DECOMMISSIONED  --[Terminal]
```

**Side Effects on Transitions:**

- Any `OPERATIONAL` → `FAULTY` or `UNDER_MAINTENANCE`: triggers capacity recalculation, Manager and District Admin alert
- `FAULTY` / `UNDER_MAINTENANCE` → `OPERATIONAL`: triggers capacity restoration, Manager notified

---

## 8. CENTRE OPERATIONAL STATUS STATE MACHINE

### States

| State                | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `ACTIVE`             | Centre operating normally; accepting bookings              |
| `REDUCED_CAPACITY`   | Operating but at reduced capacity (equipment/staff issues) |
| `CONGESTED`          | Queue significantly above normal levels                    |
| `TEMPORARILY_CLOSED` | Closed for a defined period (emergency, holiday)           |
| `SUSPENDED`          | Suspended by District Admin or System Admin                |
| `PERMANENTLY_CLOSED` | Centre will not reopen                                     |

### Transitions

```
ACTIVE              --[Capacity drops]--> REDUCED_CAPACITY
ACTIVE              --[Queue exceeds RED threshold]--> CONGESTED
ACTIVE              --[Manager closes temporarily]--> TEMPORARILY_CLOSED
ACTIVE              --[Admin suspends]--> SUSPENDED
REDUCED_CAPACITY    --[Capacity restored]--> ACTIVE
REDUCED_CAPACITY    --[Queue grows further]--> CONGESTED
CONGESTED           --[Queue normalises]--> ACTIVE
CONGESTED           --[Manager closes]--> TEMPORARILY_CLOSED
TEMPORARILY_CLOSED  --[Manager reopens]--> ACTIVE (or REDUCED_CAPACITY if issues persist)
SUSPENDED           --[Admin reinstates]--> ACTIVE
ACTIVE / any        --[Admin permanently closes]--> PERMANENTLY_CLOSED
PERMANENTLY_CLOSED  --[Terminal]
```

---

## 9. NOTIFICATION DELIVERY STATE MACHINE

### States

| State                | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `QUEUED`             | Notification event created and placed in delivery queue |
| `SENDING`            | Notification dispatched to provider                     |
| `DELIVERED`          | Provider confirms delivery                              |
| `FAILED`             | Provider reports failure or timeout                     |
| `RETRYING`           | Scheduled for retry                                     |
| `PERMANENTLY_FAILED` | Max retries exhausted                                   |

### Transitions

```
QUEUED       --[Worker picks up]--> SENDING
SENDING      --[Provider success]--> DELIVERED
SENDING      --[Provider failure / timeout]--> FAILED
FAILED       --[Within retry limit]--> RETRYING
RETRYING     --[Next retry sent]--> SENDING
FAILED       --[Max retries exceeded]--> PERMANENTLY_FAILED
DELIVERED    --[Terminal]
PERMANENTLY_FAILED --[Admin alerted for HIGH priority; low priority logged only]
```

---

## 10. USER ACCOUNT STATE MACHINE

### States

| State                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `PENDING_VERIFICATION` | Account registered; OTP not yet verified        |
| `ACTIVE`               | Account fully active                            |
| `LOCKED`               | Temporarily locked due to failed login attempts |
| `SUSPENDED`            | Manually suspended by admin                     |
| `DEACTIVATED`          | Account deactivated (soft delete)               |

### Transitions

```
PENDING_VERIFICATION --[OTP verified]--> ACTIVE
PENDING_VERIFICATION --[OTP expires without verification / N days]-->  DEACTIVATED
ACTIVE  --[N failed logins]--> LOCKED
LOCKED  --[Lockout period expires or admin unlocks]--> ACTIVE
ACTIVE  --[Admin suspends]--> SUSPENDED
SUSPENDED --[Admin reinstates]--> ACTIVE
ACTIVE / LOCKED / SUSPENDED --[Admin deactivates]--> DEACTIVATED
DEACTIVATED --[Soft-delete terminal; data retained for audit]
```

---

## 11. PRODUCE BATCH STATE MACHINE

### States

| State                | Description                                   |
| -------------------- | --------------------------------------------- |
| `DECLARED`           | Farmer declared produce in profile            |
| `BOOKED`             | Produce batch linked to a confirmed booking   |
| `IN_PROCUREMENT`     | Produce batch currently in active procurement |
| `APPROVED`           | Produce accepted after quality inspection     |
| `REJECTED`           | Produce rejected after quality inspection     |
| `PARTIALLY_ACCEPTED` | Part of batch accepted; remainder rejected    |
| `PAID`               | Payment completed for this produce batch      |

### Transitions

```
DECLARED       --[Booking confirmed with this batch]--> BOOKED
BOOKED         --[Procurement initiated]--> IN_PROCUREMENT
BOOKED         --[Booking cancelled]--> DECLARED (released back for re-booking)
IN_PROCUREMENT --[Quality passes; procurement approved]--> APPROVED
IN_PROCUREMENT --[Partial acceptance]--> PARTIALLY_ACCEPTED
IN_PROCUREMENT --[Quality fails]--> REJECTED
APPROVED / PARTIALLY_ACCEPTED --[Payment COMPLETED]--> PAID
PAID           --[Terminal]
REJECTED       --[Terminal for this booking; can be re-declared for new booking]
```

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
