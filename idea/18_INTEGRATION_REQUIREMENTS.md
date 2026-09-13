# 18 — INTEGRATION REQUIREMENTS

## SmartProcure: External Integration Boundaries and Interface Specifications

---

## 1. Integration Design Principles

1. **Provider Agnostic:** No external provider is hardcoded. All integrations are accessed through internal adapter interfaces. Switching providers requires configuration changes, not code changes.
2. **Mock-First Development:** All external integrations begin as mock/stub implementations. Real provider connections are added in Phase 2+.
3. **Graceful Degradation:** If any external integration fails, the core system continues operating in degraded mode with appropriate user communication.
4. **Webhook Security:** All inbound webhooks are authenticated using HMAC signatures, timestamps, and idempotency keys.
5. **No Assumed Access:** No government API is documented as "available" unless formally authorised. Government integrations are designed as interface definitions to be connected when APIs become available.
6. **Event-Driven Outbound:** Outbound API calls to external providers are triggered by internal events, not polling.

---

## 2. SMS Provider Integration

**Purpose:** Deliver OTP, booking confirmations, queue alerts, and payment notifications via SMS.

**Direction:** Outbound from SmartProcure to SMS provider

**Data Exchanged:**

```json
{
  "to": "+91XXXXXXXXXX",
  "message": "plain text SMS content (max 160 chars per segment)",
  "sender_id": "SMPRC",
  "priority": "HIGH | NORMAL",
  "reference_id": "notification_id (for status tracking)"
}
```

**Authentication:** API Key in request header (provider-specific)

**Providers (pluggable):**

- Primary: Twilio / AWS SNS / MSG91 (configurable)
- Secondary: Failover provider

**Failure Handling:**

- Retry with exponential backoff (as defined in notification module)
- Failover to secondary provider after 3 primary failures
- If both fail: mark PERMANENTLY_FAILED; alert System Admin

**Mock Strategy (MVP):** Stub SMS provider that logs messages to console/file instead of delivering via real API. Real provider connected in Phase 2.

**Delivery Status Callback (optional):** Webhook from provider confirming delivery status — stored in notification delivery log.

**Interface Definition:**

```typescript
interface SMSProvider {
  send(to: string, message: string, ref: string): Promise<SMSSendResult>;
  getStatus(messageId: string): Promise<SMSStatusResult>;
}
```

---

## 3. Email Provider Integration

**Purpose:** Deliver reports, digital receipts, and account-related emails.

**Direction:** Outbound from SmartProcure

**Data Exchanged:**

```json
{
  "to": ["farmer@email.com"],
  "from": "noreply@smartprocure.in",
  "subject": "string",
  "html_body": "HTML string",
  "text_body": "plain text fallback",
  "attachments": [{ "filename": "string", "content_base64": "string" }],
  "reference_id": "notification_id"
}
```

**Authentication:** API Key or SMTP credentials (provider-specific)

**Providers (pluggable):**

- AWS SES / SendGrid / Mailgun

**Failure Handling:**

- Retry up to 5 times with exponential backoff
- Email failures are non-critical for most events; logged accordingly

**Mock Strategy (MVP):** Ethereal Email (test SMTP) or file-based mock; real provider in Phase 2.

**Interface Definition:**

```typescript
interface EmailProvider {
  send(
    to: string[],
    subject: string,
    html: string,
    text: string,
  ): Promise<EmailSendResult>;
}
```

---

## 4. Push Notification Integration

**Purpose:** Deliver real-time alerts to farmers and staff on web-enabled devices.

**Direction:** Outbound from SmartProcure to Web Push / Firebase

**Data Exchanged:**

```json
{
  "subscription": {
    "endpoint": "url",
    "keys": { "p256dh": "key", "auth": "key" }
  },
  "title": "string",
  "body": "string",
  "icon": "url",
  "click_action": { "screen": "string", "id": "uuid" }
}
```

**Provider:** Web Push API (RFC 8030) via `web-push` npm library; or Firebase Cloud Messaging (FCM)

**Authentication:** VAPID keys (for web push); Service Account (for FCM)

**Failure Handling:**

- Push failures are non-blocking; SMS/in-app provide fallback
- If device token is invalid/expired: token removed from user record

**Mock Strategy (MVP):** Console log push payload during development.

---

## 5. Geolocation / Maps Integration

**Purpose:** Calculate distance and travel time between farmer location and procurement centres for recommendation engine.

**Direction:** Outbound API calls from SmartProcure to maps provider

**Data Required:**

- Farmer lat/long (or district centroid as fallback)
- List of centre lat/long coordinates

**Operations Required:**

- Distance calculation (straight-line approximation acceptable for MVP)
- Travel time estimation (future Phase 2; requires routing API)

**MVP Implementation:**

- Haversine formula for straight-line distance (no external API required for MVP)
- No external maps API dependency in MVP
- Real travel time API integration (Google Maps / OSRM) in Phase 2

**Mock Strategy (MVP):** Haversine formula implementation — no external dependency.

**Future Interface Definition:**

```typescript
interface MapsProvider {
  getDistance(from: LatLong, to: LatLong): Promise<DistanceResult>;
  getTravelTime(
    from: LatLong,
    to: LatLong,
    mode: "driving",
  ): Promise<TravelTimeResult>;
}
```

---

## 6. Payment Integration (DBT / Bank Transfer)

**Purpose:** Trigger payment disbursement to farmer's bank account after procurement approval.

**Direction:** Outbound from SmartProcure to payment provider; Inbound webhook for status

**Data Exchanged (Outbound — Payment Request):**

```json
{
  "payment_id": "uuid (idempotency key)",
  "beneficiary_account": "encrypted at transmission",
  "beneficiary_ifsc": "string",
  "beneficiary_name": "string",
  "amount": 12500.0,
  "currency": "INR",
  "remarks": "SmartProcure Procurement ID: {id}",
  "reference": "procurement_id"
}
```

**Data Exchanged (Inbound — Webhook Callback):**

```json
{
  "payment_id": "uuid",
  "status": "SUCCESS | FAILED | PENDING",
  "transaction_reference": "UTR/bank reference",
  "timestamp": "ISO8601",
  "failure_reason": "string (if FAILED)"
}
```

**Authentication (Outbound):** Bearer token / OAuth (provider-specific)
**Authentication (Inbound webhook):** HMAC-SHA256 signature verification with shared secret

**Failure Handling:**

- Provider unavailable: retry with exponential backoff; circuit breaker
- Provider reports FAILED: payment FAILED; retry scheduled
- Webhook not received: background job checks stale INITIATED payments after 30 minutes

**Mock Strategy (MVP):**

- Payment provider is fully mocked
- Admin panel "Simulate Payment" button triggers mock COMPLETED callback
- Real provider integration in Phase 2

**Security Note:** Full bank account number is never stored in payment records. Retrieved from encrypted farmer profile only at moment of payment initiation, passed to provider over TLS, then immediately discarded from memory.

**Interface Definition:**

```typescript
interface PaymentProvider {
  initiatePayment(request: PaymentRequest): Promise<PaymentInitiateResult>;
  getStatus(paymentId: string): Promise<PaymentStatusResult>;
}
```

---

## 7. Government Farmer Identity Database (Future Integration)

**Purpose:** Cross-validate farmer identity and land records against official government databases.

**Status:** Integration interface defined; no live API access currently authorised.

**Data This Would Exchange:**

- Input: Farmer's Aadhaar number or farmer registration number
- Output: Name, father's name, land records, crop registration

**Current MVP Strategy:**

- Farmer uploads physical documents (scanned copies)
- System Admin manually reviews and verifies
- Document status tracked as VERIFIED / REJECTED

**Future Integration Design:**

```typescript
interface FarmerVerificationService {
  verifyIdentity(aadhaar: string, name: string): Promise<VerificationResult>;
  getLandRecords(farmerId: string): Promise<LandRecordResult[]>;
}
```

**Security Note:** If this integration becomes available, Aadhaar verification must use the government's officially authorised Aadhaar Authentication API with legal authorization. No Aadhaar sharing without consent and legal basis.

---

## 8. Government Procurement Reporting (Future Integration)

**Purpose:** Submit procurement data to state/national agriculture authority for compliance and MSP tracking.

**Status:** Interface designed; no live API authorised.

**Data Direction:** Outbound from SmartProcure to government portal

**Data Format:** Government-defined standard procurement report format (XML or JSON as specified by authority)

**Current MVP Strategy:**

- Monthly report generated as spreadsheet (CSV/Excel) by District Admin
- Manually submitted to authority portal by admin

**Mock Strategy:** No mock needed; CSV export is the MVP replacement.

---

## 9. Internal Integration Touchpoints

### 9.1 Queue Module ↔ Notification Module

When queue state changes, QueueModule emits an internal event. NotificationModule subscribes and dispatches appropriate notifications.

```
Event: QUEUE_FARMER_APPROACHING
Payload: { queue_entry_id, farmer_id, position, eta_minutes }
Handler: Dispatch QUEUE_APPROACHING notification to farmer
```

### 9.2 Booking Module ↔ Token Module

Token generation is called synchronously within the booking transaction:

```
BookingService.createBooking()
  → TokenService.generateToken(bookingId)
  → [If token fails] → Transaction rolled back
```

### 9.3 Equipment Module ↔ Capacity Module

Equipment status changes emit events:

```
Event: EQUIPMENT_STATUS_CHANGED
Payload: { equipment_id, centre_id, old_status, new_status }
Handler: CapacityService.recalculateEffectiveCapacity(centreId)
```

### 9.4 Procurement Module ↔ Payment Module

Procurement approval emits an event:

```
Event: PROCUREMENT_APPROVED
Payload: { procurement_id, farmer_id, centre_id, amount }
Handler: PaymentService.createPaymentRecord(procurement_id)
```

---

## 10. Integration Testing Strategy

| Integration          | MVP Testing Strategy                                                           |
| -------------------- | ------------------------------------------------------------------------------ |
| SMS Provider         | Mock provider with console output; test with real credentials in staging       |
| Email Provider       | Ethereal Email (catches outgoing emails for inspection)                        |
| Push Notification    | Log push payload to file; test with real FCM in staging                        |
| Maps / Geolocation   | Unit test Haversine formula; add real API in staging                           |
| Payment Provider     | Full mock with simulated success/failure webhooks; real credentials in staging |
| Govt Farmer Database | No integration; manual verification process tested as-is                       |
| Govt Reporting       | CSV export tested; no API integration needed                                   |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
