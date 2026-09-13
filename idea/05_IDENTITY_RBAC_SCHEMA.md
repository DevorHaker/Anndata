# 05 — IDENTITY & RBAC DATABASE SCHEMA

## SmartProcure: User Authentication, Role-Based Access Control, and Sessions

---

## 1. Relational ER Diagram: Identity & RBAC

```
                          ┌──────────────────────┐
                          │        roles         │
                          └──────────┬───────────┘
                                     │ 1:N
                          ┌──────────┴───────────┐
                          │   role_permissions   │
                          └──────────┬───────────┘
                                     │ N:1
                          ┌──────────┴───────────┐
                          │     permissions      │
                          └──────────────────────┘
                                     ▲
                                     │ N:1
 ┌──────────────────────┐ 1:N ┌──────┴───────────────┐
 │    user_sessions     │◄────│        users         │
 └──────────────────────┘     └──────────────────────┘
```

---

## 2. Table Specifications

### 2.1 `roles`

Stores system security roles.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE, -- 'FARMER', 'PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN'
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 `permissions`

Defines granular permission strings.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- E.g. 'booking:create', 'weighment:approve'
  module VARCHAR(50) NOT NULL,        -- E.g. 'bookings', 'weighments'
  description TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 `role_permissions`

Junction table mapping roles to permissions.

```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);
```

### 2.4 `users`

Master identity table for all platform actors.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,       -- bcrypt hash (Cost factor 12)
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'PENDING_OTP', 'ACTIVE', 'SUSPENDED'
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_role ON users(role_id);
```

### 2.5 `user_sessions`

Active refresh token sessions backing Redis session hashes.

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_info TEXT NULL,
  ip_address VARCHAR(45) NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
