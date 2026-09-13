# 06 — FARMER DATABASE SCHEMA

## SmartProcure: Farmer Entities, Demographic Profiles, Encrypted Bank Data, and Documents

---

## 1. Table Specifications

### 1.1 `farmers`

Primary business entity for agricultural producers.

```sql
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  farmer_reference_id VARCHAR(30) NOT NULL UNIQUE, -- E.g. 'FRM-2026-008912'
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED', -- 'UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_farmers_user ON farmers(user_id);
CREATE INDEX idx_farmers_ref ON farmers(farmer_reference_id);
```

### 1.2 `farmer_profiles`

Detailed demographic, geographical, and preferences data.

```sql
CREATE TABLE farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL UNIQUE REFERENCES farmers(id) ON DELETE CASCADE,
  village_name VARCHAR(100) NOT NULL,
  sub_district VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  latitude NUMERIC(10, 8) NULL,               -- WGS84 Latitude
  longitude NUMERIC(11, 8) NULL,              -- WGS84 Longitude
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en', -- 'en', 'hi', 'pa', etc.
  land_holding_acres NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_profiles_district ON farmer_profiles(district);
```

### 1.3 `farmer_bank_accounts`

Encrypted bank account details for direct payment disbursements.

> **SECURITY INVARIANT**: Account number and IFSC code are encrypted using AES-256-GCM before write. Plaintext values are never stored.

```sql
CREATE TABLE farmer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  account_holder_name VARCHAR(150) NOT NULL,
  bank_name VARCHAR(150) NOT NULL,
  branch_name VARCHAR(150) NULL,
  encrypted_account_number TEXT NOT NULL,      -- AES-256-GCM Encrypted
  encrypted_ifsc_code TEXT NOT NULL,          -- AES-256-GCM Encrypted
  account_last_four VARCHAR(4) NOT NULL,       -- Masked display value (e.g. '1234')
  is_primary BOOLEAN NOT NULL DEFAULT true,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'FAILED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_farmer_primary_bank UNIQUE (farmer_id, is_primary)
);
```

### 1.4 `farmer_documents`

Metadata pointers for farmer uploaded identity and land records stored in Object Storage.

```sql
CREATE TABLE farmer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,         -- 'IDENTITY_PROOF', 'LAND_RECORD', 'BANK_PASSBOOK'
  file_key VARCHAR(255) NOT NULL UNIQUE,      -- S3 Storage Key
  file_name_original VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT NULL,
  verified_by UUID NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
