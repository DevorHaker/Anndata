# 04 — COMMON DATABASE STANDARDS

## SmartProcure: Column Naming Conventions, Timestamps, and Audit Metadata

---

## 1. Global Naming & Formatting Conventions

| Standard          | Rule                                                      | Example                                     |
| ----------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Casing**        | `snake_case` strictly enforced for all database objects   | `procurement_centres`, `net_weight_kg`      |
| **Pluralization** | Table names are **plural**; Column names are **singular** | Table: `bookings` \| Column: `booking_id`   |
| **Primary Keys**  | Named `id` of type `UUID`                                 | `id UUID DEFAULT gen_random_uuid()`         |
| **Foreign Keys**  | Named `{singular_target_table}_id`                        | `farmer_id UUID REFERENCES farmers(id)`     |
| **Booleans**      | Prefixed with `is_`, `has_`, or `can_`                    | `is_active`, `is_verified`, `has_penalty`   |
| **Timestamps**    | Suffixed with `_at` of type `TIMESTAMPTZ`                 | `created_at`, `checked_in_at`, `expires_at` |
| **Dates**         | Suffixed with `_date` of type `DATE`                      | `booking_date`, `slot_date`                 |

---

## 2. Mandatory Common Column Standard

Every operational table in SmartProcure includes the standard 8 metadata columns:

```sql
-- Standard Metadata Column Template
id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
status       VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
version      INTEGER NOT NULL DEFAULT 1,
created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
deleted_at   TIMESTAMPTZ NULL,
created_by   UUID NULL REFERENCES users(id),
updated_by   UUID NULL REFERENCES users(id)
```

### Column Responsibility Definitions

- **`status`**: String code governing entity operational state machine (e.g. `CONFIRMED`, `CANCELLED`).
- **`version`**: Monotonically increasing counter for **Optimistic Locking** protection during concurrent API updates.
- **`created_at`**: Automatic UTC timestamp set on insertion (`CURRENT_TIMESTAMP`).
- **`updated_at`**: Automatic UTC timestamp updated via database trigger (`trg_update_timestamps`).
- **`deleted_at`**: Soft deletion timestamp. If `NULL`, record is active; if populated, record is soft-deleted.
- **`created_by` / `updated_by`**: Foreign key to `users(id)` recording the invoking actor.

---

## 3. Timestamp Policy & Timezone Strategy

1. **Storage Standard**: All date/time columns store values as `TIMESTAMPTZ` (PostgreSQL Timestamp with Time Zone). All times are stored in **Coordinated Universal Time (UTC)**.
2. **Centre-Local Time Conversion**: Procurement centres operate in local timezones (e.g. `Asia/Kolkata` - UTC+5:30). Each `procurement_centres` record stores a `timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'` column.
3. **Database Date Queries**: Operational daily aggregations convert `TIMESTAMPTZ` to local date using explicit timezone parameters:
   ```sql
   -- Local Date Filtering Example
   SELECT * FROM bookings
   WHERE centre_id = :centreId
     AND (created_at AT TIME ZONE 'Asia/Kolkata')::DATE = '2026-09-13';
   ```

---

## 4. Automated `updated_at` SQL Trigger

```sql
-- Automated Timestamp Trigger Function
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.version = OLD.version + 1; -- Increment Optimistic Locking Version
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
