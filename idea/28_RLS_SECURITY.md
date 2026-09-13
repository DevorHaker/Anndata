# 28 — POSTGRESQL ROW-LEVEL SECURITY (RLS) & DEFENSE IN DEPTH

## SmartProcure: Database-Enforced Data Isolation and Resource Scoping

---

## 1. Security Architecture & RLS Rationale

In addition to backend Express authorization middleware (`validateScope`), SmartProcure uses **PostgreSQL Row-Level Security (RLS)** as a secondary **Defense-in-Depth** layer to ensure data isolation:

- A `PROCUREMENT_OFFICER` assigned to Centre A **CANNOT** query or modify bookings for Centre B, even if a backend developer forgets a `WHERE centre_id = :id` clause in code.

---

## 2. Session Context Injection Middleware

When an API request starts, Express executes a lightweight database session setup setting runtime session variables:

```sql
-- Executed at start of DB transaction / request context
SET LOCAL app.current_user_id = 'u123_uuid';
SET LOCAL app.current_user_role = 'PROCUREMENT_OFFICER';
SET LOCAL app.current_centre_id = 'c789_uuid';
```

---

## 3. Row-Level Security Policies Blueprint

```sql
-- Enable RLS on Sensitive Operational Tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weighment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurements ENABLE ROW LEVEL SECURITY;

-- 1. Farmer Access Policy (Farmers access ONLY their own bookings)
CREATE POLICY farmer_bookings_policy ON bookings
  FOR ALL
  TO smartprocure_app_role
  USING (
    current_setting('app.current_user_role', true) = 'FARMER'
    AND farmer_id = (SELECT id FROM farmers WHERE user_id = current_setting('app.current_user_id', true)::UUID)
  );

-- 2. Procurement Officer Access Policy (Officers access ONLY assigned centre data)
CREATE POLICY officer_bookings_policy ON bookings
  FOR ALL
  TO smartprocure_app_role
  USING (
    current_setting('app.current_user_role', true) IN ('PROCUREMENT_OFFICER', 'CENTRE_MANAGER')
    AND centre_id = current_setting('app.current_centre_id', true)::UUID
  );

-- 3. System Admin Bypass Policy (Admins access all records)
CREATE POLICY admin_bookings_policy ON bookings
  FOR ALL
  TO smartprocure_app_role
  USING (
    current_setting('app.current_user_role', true) IN ('DISTRICT_ADMIN', 'SYSTEM_ADMIN')
  );
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
