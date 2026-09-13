# 19 — PAYMENT DATABASE SCHEMA

## SmartProcure: Financial Disbursements, Payment FSM, and Event History

---

## 1. Table Specifications

### 1.1 `payments`

Financial disbursement tracking connecting Procurements to Banking Providers.

> **IDEMPOTENCY INVARIANT**: `procurement_id` is defined as a `UNIQUE` key to guarantee that duplicate payment records can **NEVER** be created for the same procurement.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference_id VARCHAR(30) NOT NULL UNIQUE, -- E.g. 'PAY-20260913-004812'
  procurement_id UUID NOT NULL UNIQUE REFERENCES procurements(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  bank_account_id UUID NOT NULL REFERENCES farmer_bank_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  provider VARCHAR(50) NOT NULL DEFAULT 'MOCK_BANK', -- 'MOCK_BANK', 'DBT_GATEWAY', 'PFMS'
  provider_transaction_ref VARCHAR(100) NULL,  -- Bank UTR Number / Gateway Reference
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'INITIATED', 'SUCCESS', 'FAILED', 'RETRY_REQUIRED'
  failure_reason TEXT NULL,
  initiated_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_farmer ON payments(farmer_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### 1.2 `payment_events`

Immutable historical event tracking for every state transition in payment processing callbacks.

```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  provider_response_code VARCHAR(50) NULL,
  provider_payload JSONB NULL,                -- Webhook payload log
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_events_payment ON payment_events(payment_id);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
