# 14 — TOKEN & CHECK-IN DATABASE SCHEMA

## SmartProcure: Cryptographic QR Tokens and Scan Gate Verification

---

## 1. Table Specifications

### 1.1 `tokens`

Public cryptographic QR tokens issued upon booking confirmation.

> **SECURITY INVARIANT**: Tokens contain no PII. The QR code encodes `token_code` signed with an HMAC key.

```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_code VARCHAR(50) NOT NULL UNIQUE,     -- Public reference e.g. 'SP-9821-XK'
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  hmac_signature VARCHAR(255) NOT NULL,       -- Cryptographic HMAC-SHA256 signature
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'USED', 'EXPIRED', 'REVOKED'
  expires_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_code ON tokens(token_code);
CREATE INDEX idx_tokens_booking ON tokens(booking_id);
```

### 1.2 `checkins`

Gate scan records created when a farmer arrives at the procurement centre.

```sql
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  checked_in_by UUID NOT NULL REFERENCES users(id), -- Officer who scanned the QR
  verification_method VARCHAR(50) NOT NULL DEFAULT 'QR_SCAN', -- 'QR_SCAN', 'MANUAL_OVERRIDE'
  checkin_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  device_metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checkins_centre_time ON checkins(centre_id, checkin_timestamp);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
