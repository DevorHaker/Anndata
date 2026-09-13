# 13 — NOTIFICATION REQUIREMENTS

## SmartProcure: Complete Notification Event Catalog and Delivery Specification

---

## 1. Notification Architecture Overview

**Design Principles:**

- Notifications are delivered **asynchronously** via a message queue (e.g., Bull/Redis)
- Notification service is a **separate logical module** from the main API
- Notification **providers are pluggable** — switching from Provider A to Provider B requires only configuration changes
- All notification deliveries are **logged** with status tracking
- **No PII** (bank account, full Aadhaar) may appear in SMS or email notifications
- Notification templates are stored in the database and editable by System Admin

**Channels Available:**

| Channel | Description                                  | Use Cases                                    |
| ------- | -------------------------------------------- | -------------------------------------------- |
| IN_APP  | In-application notification inbox            | All events                                   |
| SMS     | Short Message Service via pluggable provider | High priority, farmer-facing critical events |
| EMAIL   | Email via pluggable provider                 | Reports, receipts, payment summaries         |
| PUSH    | Web push / FCM mobile push notification      | Real-time alerts                             |

---

## 2. Complete Notification Event Registry

### 2.1 Farmer Notifications

| Event Code                        | Description                                                  | Priority | Channels                             | Trigger                                         |
| --------------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------ | ----------------------------------------------- |
| `REGISTRATION_SUCCESS`            | Account created successfully                                 | MEDIUM   | In-App, SMS                          | User account creation                           |
| `PROFILE_COMPLETION_REMINDER`     | Profile incomplete; booking blocked                          | LOW      | In-App                               | Profile completion < 80% when booking attempted |
| `BOOKING_CONFIRMED`               | Booking confirmed with token                                 | HIGH     | In-App, SMS, Push                    | Booking CONFIRMED state                         |
| `BOOKING_CANCELLED_SELF`          | Farmer's self-cancellation confirmed                         | HIGH     | In-App, SMS                          | Booking cancelled by farmer                     |
| `BOOKING_CANCELLED_BY_MANAGER`    | Manager cancelled farmer's booking                           | HIGH     | In-App, SMS                          | Manager cancels booking                         |
| `BOOKING_CANCELLED_CENTRE_CLOSED` | Booking cancelled due to centre closure                      | HIGH     | In-App, SMS                          | Centre status = CLOSED affecting booking        |
| `SLOT_REMINDER_24H`               | Reminder 24 hours before slot                                | MEDIUM   | In-App, Push                         | Background job: 24h before slot start           |
| `SLOT_REMINDER_2H`                | Reminder 2 hours before slot                                 | HIGH     | In-App, SMS                          | Background job: 2h before slot start            |
| `RESCHEDULING_OFFER`              | Offer to reschedule (due to centre change or load balancing) | HIGH     | In-App, SMS                          | Load balancing / closure event                  |
| `RESCHEDULING_CONFIRMED`          | Rescheduling completed                                       | HIGH     | In-App, SMS                          | New booking confirmed on reschedule             |
| `CENTRE_CLOSURE_NOTICE`           | Centre unexpectedly closed                                   | HIGH     | In-App, SMS                          | Centre status change to CLOSED                  |
| `CHECKIN_CONFIRMED`               | Check-in successful; queue position shown                    | HIGH     | In-App, Push                         | Check-in CONFIRMED                              |
| `QUEUE_POSITION_UPDATE`           | Queue position or ETA updated significantly                  | LOW      | In-App, Push (on significant change) | ETA change > 10 minutes                         |
| `QUEUE_APPROACHING`               | Farmer approaching the front (N positions away)              | HIGH     | In-App, SMS, Push                    | Queue position = APPROACHING_THRESHOLD          |
| `QUEUE_CALLED`                    | Farmer is now being called                                   | HIGH     | In-App, SMS, Push                    | Queue entry status = CALLED                     |
| `QUEUE_PAUSED`                    | Queue paused (equipment/emergency)                           | HIGH     | In-App, SMS                          | Queue paused by Manager                         |
| `QUEUE_RESUMED`                   | Queue has resumed                                            | MEDIUM   | In-App, Push                         | Queue resumed by Manager                        |
| `QUEUE_SKIPPED`                   | Farmer was skipped; placed at end                            | HIGH     | In-App, Push                         | Queue status = SKIPPED                          |
| `PROCUREMENT_STARTED`             | Officer has started the procurement process                  | LOW      | In-App                               | Procurement INITIATED                           |
| `PROCUREMENT_COMPLETED`           | Procurement approved; receipt available                      | HIGH     | In-App, SMS, Push                    | Procurement APPROVED                            |
| `PROCUREMENT_REJECTED`            | Produce rejected with reason                                 | HIGH     | In-App, SMS                          | Procurement REJECTED                            |
| `PROCUREMENT_ON_HOLD`             | Procurement placed on hold                                   | HIGH     | In-App, Push                         | Procurement ON_HOLD                             |
| `PROCUREMENT_HOLD_RESOLVED`       | Hold resolved; decision communicated                         | HIGH     | In-App, Push                         | ON_HOLD resolved                                |
| `PAYMENT_INITIATED`               | Payment process started                                      | MEDIUM   | In-App                               | Payment INITIATED                               |
| `PAYMENT_COMPLETED`               | Payment successfully sent                                    | HIGH     | In-App, SMS, Push                    | Payment COMPLETED                               |
| `PAYMENT_FAILED`                  | Payment attempt failed                                       | HIGH     | In-App, SMS                          | Payment FAILED                                  |
| `PAYMENT_RETRYING`                | System retrying payment                                      | LOW      | In-App                               | Payment RETRYING                                |
| `NO_SHOW_RECORDED`                | Booking marked as no-show                                    | MEDIUM   | In-App, Push                         | No-show background job                          |
| `NO_SHOW_WARNING`                 | Warning: N-1 consecutive no-shows                            | HIGH     | In-App, SMS                          | No-show counter = threshold - 1                 |
| `BOOKING_SUSPENDED`               | Booking privileges suspended                                 | HIGH     | In-App, SMS                          | Suspension triggered                            |
| `TOKEN_EXPIRY_WARNING`            | Token approaching expiry                                     | MEDIUM   | In-App, Push                         | 30 min before token expiry                      |
| `ADMIN_OVERRIDE_NOTICE`           | Admin action affected farmer's record                        | MEDIUM   | In-App                               | Admin override on farmer's entity               |

---

### 2.2 Procurement Officer Notifications

| Event Code                      | Description                                   | Priority | Channels     | Trigger                     |
| ------------------------------- | --------------------------------------------- | -------- | ------------ | --------------------------- |
| `FARMER_CHECKED_IN`             | New farmer checked in; queue updated          | LOW      | In-App       | Check-in confirmed          |
| `PROCUREMENT_APPROVAL_REQUIRED` | High-value procurement needs manager approval | HIGH     | In-App, Push | Approval threshold exceeded |
| `HOLD_SLA_WARNING`              | ON_HOLD procurement approaching SLA breach    | HIGH     | In-App, Push | SLA - 30 minutes            |
| `CORRECTION_APPROVED`           | Weight/quality correction approved by manager | MEDIUM   | In-App       | Correction approved         |
| `CORRECTION_REJECTED`           | Correction request rejected                   | MEDIUM   | In-App       | Correction rejected         |

---

### 2.3 Centre Manager Notifications

| Event Code                      | Description                              | Priority | Channels                 | Trigger                        |
| ------------------------------- | ---------------------------------------- | -------- | ------------------------ | ------------------------------ |
| `CONGESTION_YELLOW`             | Queue at 70%+ capacity                   | HIGH     | In-App, Email, Push      | Congestion detection job       |
| `CONGESTION_RED`                | Queue at 90%+ capacity                   | CRITICAL | In-App, SMS, Email, Push | Congestion detection job       |
| `EQUIPMENT_FAULT_REPORTED`      | Equipment reported as faulty             | HIGH     | In-App, Push             | Equipment status = FAULTY      |
| `EQUIPMENT_DOWNTIME_THRESHOLD`  | Equipment downtime exceeds daily limit   | HIGH     | In-App, Push             | Downtime threshold exceeded    |
| `STAFF_SHORTAGE`                | Active staff count below minimum         | HIGH     | In-App, Push             | Staff count check              |
| `BOTTLENECK_DETECTED`           | Processing bottleneck at a stage         | MEDIUM   | In-App, Push             | Bottleneck detection           |
| `HOLD_SLA_BREACH`               | ON_HOLD procurement SLA breached         | CRITICAL | In-App, SMS              | SLA timer expired              |
| `APPROVAL_WAITING`              | Procurement waiting for manager approval | HIGH     | In-App, Push             | Procurement pending manager    |
| `CORRECTION_REQUEST`            | Officer submitted a correction request   | HIGH     | In-App, Push             | Correction submitted           |
| `NO_SHOW_BATCH_REPORT`          | Daily no-show summary                    | LOW      | Email                    | End of operating day job       |
| `LOAD_BALANCING_SUGGESTION`     | Cross-centre balancing opportunity       | MEDIUM   | In-App, Push             | Balancing suggestion generated |
| `CANCELLATION_PENDING_APPROVAL` | Late cancellation request from farmer    | HIGH     | In-App, Push             | Late cancellation attempt      |
| `PAYMENT_INTERVENTION_REQUIRED` | Payment requires manual action           | HIGH     | In-App, Push, Email      | Payment max retries exceeded   |

---

### 2.4 District Administrator Notifications

| Event Code                | Description                            | Priority | Channels            | Trigger                        |
| ------------------------- | -------------------------------------- | -------- | ------------------- | ------------------------------ |
| `CENTRE_CONGESTION_RED`   | A centre is RED congested              | HIGH     | In-App, Email, Push | Centre congestion RED          |
| `CENTRE_CLOSED_EMERGENCY` | A centre closed unexpectedly           | CRITICAL | In-App, SMS, Email  | Centre TEMPORARILY_CLOSED      |
| `HOLD_SLA_ESCALATION`     | ON_HOLD escalated from centre          | HIGH     | In-App, Push        | Escalation from manager        |
| `DISTRICT_DAILY_REPORT`   | Daily cross-centre performance summary | LOW      | Email               | End-of-day job                 |
| `IMBALANCE_DETECTED`      | Cross-centre load imbalance            | HIGH     | In-App, Push        | Balancing suggestion generated |
| `PAYMENT_BATCH_ALERT`     | Multiple payment failures in a period  | HIGH     | In-App, Email       | Payment failure threshold      |

---

### 2.5 System Administrator Notifications

| Event Code                      | Description                                   | Priority | Channels      | Trigger                        |
| ------------------------------- | --------------------------------------------- | -------- | ------------- | ------------------------------ |
| `SECURITY_ACCOUNT_LOCKED`       | Account locked due to failed attempts         | HIGH     | In-App, Email | Account lockout                |
| `SECURITY_FRAUD_TOKEN`          | Token fraud attempt detected                  | CRITICAL | In-App, Email | FRAUD_FLAGGED token event      |
| `SECURITY_SUSPICIOUS_LOGIN`     | Multiple failed logins from same IP           | HIGH     | In-App, Email | Rate of failed logins          |
| `NOTIFICATION_DELIVERY_FAILURE` | HIGH priority notification permanently failed | HIGH     | In-App, Email | Permanent notification failure |
| `BACKGROUND_JOB_FAILURE`        | A scheduled background job failed             | CRITICAL | In-App, Email | Job error                      |
| `SYSTEM_ERROR_RATE_HIGH`        | API error rate exceeds threshold              | CRITICAL | In-App, Email | Monitoring alert               |
| `DATABASE_HEALTH_ALERT`         | Database response time / connection issue     | CRITICAL | Email         | Infrastructure monitoring      |

---

## 3. Notification Template Specifications

### 3.1 Template Format

Templates are stored in the database. Variables use `{{double_brace}}` interpolation:

```
BOOKING_CONFIRMED (SMS):
"Dear {{farmer_name}}, your booking at {{centre_name}} for {{crop_name}} on {{booking_date}} ({{slot_time}}) is confirmed. Token: {{short_token_code}}. Keep this token for check-in."

BOOKING_CONFIRMED (In-App):
Title: "Booking Confirmed"
Body: "Your booking at {{centre_name}} is confirmed for {{booking_date}}, {{slot_time}}. Your QR token is ready. Tap to view."
Action: { "screen": "BookingDetail", "booking_id": "{{booking_id}}" }

PAYMENT_COMPLETED (SMS):
"Dear {{farmer_name}}, payment of Rs.{{amount}} for your crop ({{crop_name}}, {{net_weight_kg}} kg) at {{centre_name}} has been processed. Ref: {{payment_reference}}."
```

### 3.2 Template Management Rules

- All templates editable by System Admin via admin panel
- Template changes are audit-logged
- Templates support variable validation at save time (undefined variables flagged)
- No PII fields (full account number, Aadhaar) permitted in SMS templates (enforced at template editor level)

---

## 4. Delivery Behavior

### 4.1 Channel Priority per Notification Priority

| Notification Priority | Required Channels                                    |
| --------------------- | ---------------------------------------------------- |
| CRITICAL              | All available channels (In-App + SMS + Email + Push) |
| HIGH                  | SMS + Push + In-App                                  |
| MEDIUM                | Push + In-App                                        |
| LOW                   | In-App only                                          |

### 4.2 Retry Policy

| Attempt           | Delay                    |
| ----------------- | ------------------------ |
| 1st retry         | 1 minute after failure   |
| 2nd retry         | 5 minutes after failure  |
| 3rd retry         | 30 minutes after failure |
| 4th retry         | 2 hours after failure    |
| 5th retry (final) | 24 hours after failure   |

After 5 failed attempts: status = `PERMANENTLY_FAILED`. System Admin alerted for CRITICAL and HIGH priority notifications.

### 4.3 Provider Failover

SMS Provider failover chain (configurable in admin):

1. Primary Provider (e.g., Twilio / AWS SNS)
2. Secondary Provider (e.g., MSG91)
3. If both fail: delivery marked FAILED; retry scheduled

### 4.4 Rate Limiting

- Maximum 10 notifications per farmer per hour to prevent spam
- Notifications above limit are queued for the next available window
- CRITICAL priority notifications bypass the rate limit

---

## 5. Notification Delivery Log

Every notification delivery attempt is logged:

```json
{
  "log_id": "uuid",
  "notification_id": "uuid",
  "channel": "SMS",
  "provider": "twilio",
  "attempt_number": 1,
  "status": "DELIVERED",
  "provider_message_id": "SM1234567890",
  "attempted_at": "ISO8601",
  "delivered_at": "ISO8601",
  "error_message": null
}
```

---

## 6. User Notification Preferences

Farmers can configure their notification preferences:

| Setting                          | Options                                     |
| -------------------------------- | ------------------------------------------- |
| Preferred channels               | SMS / Push / Email (select any combination) |
| Queue approaching alert distance | 1 / 3 / 5 positions before                  |
| Reminder timing                  | 24h / 2h / 30min (select combinations)      |
| Language                         | English / Regional language (Phase 2)       |

Notification preferences are stored per user and respected at dispatch time. CRITICAL notifications bypass preference settings.

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
