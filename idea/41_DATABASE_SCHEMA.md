# 41 — COMPLETE PHYSICAL DATABASE SCHEMA CATALOG

## SmartProcure: Master Physical Column Definitions, Nullability, Defaults, and FK Constraints

---

## 1. Master Table Physical Summary (38 Tables)

Below is the complete physical table catalog detailing column specifications across the 38 production entities:

### 1. `roles`

- `id` UUID PK NOT NULL DEFAULT `gen_random_uuid()`
- `code` VARCHAR(50) UNIQUE NOT NULL
- `name` VARCHAR(100) NOT NULL
- `description` TEXT NULL
- `is_system` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`

### 2. `permissions`

- `id` UUID PK NOT NULL DEFAULT `gen_random_uuid()`
- `code` VARCHAR(100) UNIQUE NOT NULL
- `module` VARCHAR(50) NOT NULL
- `description` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`

### 3. `role_permissions`

- `role_id` UUID NOT NULL FK -> `roles(id)` ON DELETE CASCADE
- `permission_id` UUID NOT NULL FK -> `permissions(id)` ON DELETE CASCADE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- PK: `(role_id, permission_id)`

### 4. `users`

- `id` UUID PK NOT NULL DEFAULT `gen_random_uuid()`
- `mobile_number` VARCHAR(15) UNIQUE NOT NULL
- `password_hash` VARCHAR(255) NOT NULL
- `role_id` UUID NOT NULL FK -> `roles(id)` ON DELETE RESTRICT
- `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
- `failed_login_attempts` INTEGER NOT NULL DEFAULT 0
- `locked_until` TIMESTAMPTZ NULL
- `last_login_at` TIMESTAMPTZ NULL
- `version` INTEGER NOT NULL DEFAULT 1
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- `deleted_at` TIMESTAMPTZ NULL

### 5. `user_sessions`

- `id` UUID PK NOT NULL DEFAULT `gen_random_uuid()`
- `user_id` UUID NOT NULL FK -> `users(id)` ON DELETE CASCADE
- `refresh_token_hash` VARCHAR(255) UNIQUE NOT NULL
- `device_info` TEXT NULL
- `ip_address` VARCHAR(45) NOT NULL
- `is_revoked` BOOLEAN NOT NULL DEFAULT false
- `expires_at` TIMESTAMPTZ NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`

### 6. `farmers`

- `id` UUID PK NOT NULL DEFAULT `gen_random_uuid()`
- `user_id` UUID UNIQUE NOT NULL FK -> `users(id)` ON DELETE RESTRICT
- `farmer_reference_id` VARCHAR(30) UNIQUE NOT NULL
- `first_name` VARCHAR(100) NOT NULL
- `last_name` VARCHAR(100) NOT NULL
- `gender` VARCHAR(20) NULL
- `verification_status` VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED'
- `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
- `version` INTEGER NOT NULL DEFAULT 1
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT `CURRENT_TIMESTAMP`
- `deleted_at` TIMESTAMPTZ NULL

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
