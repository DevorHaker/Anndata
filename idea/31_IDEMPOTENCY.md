# 31 — IDEMPOTENCY & DUPLICATE PREVENTION

## SmartProcure: Idempotency Key Storage, Request Hashing, and Safe API Retries

---

## 1. Idempotency Architecture Overview

Network timeouts in rural cellular environments often cause mobile clients or webhooks to re-transmit identical HTTP requests. SmartProcure guarantees that retried state-changing requests (`POST /bookings`, `POST /checkins`, `POST /payments`) execute **EXACTLY ONCE**.

```
[Mobile App / Webhook] ─── (Header: Idempotency-Key: idemp_abc123) ───► [API Gateway]
                                                                            │
                                                       ┌────────────────────┴────────────────────┐
                                                       ▼                                         ▼
                                            [ Check Database Table ]                  [ Key Exists? ]
                                            `idempotency_records`                     ├── YES: Return Cached Response (HTTP 201)
                                                                                      └── NO: Execute Transaction & Cache
```

---

## 2. Table Specifications (`idempotency_records`)

```sql
CREATE TABLE idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(100) NOT NULL UNIQUE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_path VARCHAR(255) NOT NULL,          -- E.g. '/api/v1/bookings'
  request_hash VARCHAR(64) NOT NULL,           -- SHA-256 hash of payload
  response_status_code INTEGER NOT NULL,       -- E.g. 201
  response_body JSONB NOT NULL,                -- Cached JSON response envelope
  expires_at TIMESTAMPTZ NOT NULL,            -- TTL (24 Hours)
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_idempotency_key ON idempotency_records(idempotency_key);
CREATE INDEX idx_idempotency_expires ON idempotency_records(expires_at);
```

---

## 3. Operations Protected by Idempotency Keys

1. **Slot Reservation** (`POST /api/v1/bookings`): Prevents duplicate booking creation on network timeout retries.
2. **QR Gate Check-In** (`POST /api/v1/checkins`): Prevents duplicate gate scan events.
3. **Procurement Submission** (`POST /api/v1/procurements`): Prevents duplicate procurement records.
4. **Payment Initiation** (`POST /api/v1/payments`): Prevents duplicate bank disbursement triggers.
5. **Payment Webhook Callback** (`POST /api/v1/payments/webhook`): Prevents duplicate banking callback processing.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
