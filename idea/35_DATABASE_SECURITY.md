# 35 — DATABASE SECURITY & ACCESS CONTROL

## SmartProcure: PostgreSQL Role Hardening, Least Privilege, and Encryption

---

## 1. PostgreSQL User & Role Privileges Architecture

The application **MUST NEVER** connect to PostgreSQL using the `postgres` superuser account. SmartProcure defines 3 distinct database roles:

```sql
-- 1. Migration Role (Used strictly during CI/CD deployment migrations)
CREATE ROLE smartprocure_migrator WITH LOGIN PASSWORD 'strong_migrator_pass';
GRANT ALL PRIVILEGES ON DATABASE smartprocure_prod TO smartprocure_migrator;

-- 2. Application Runtime Role (Used by API backend Node.js connection pool)
CREATE ROLE smartprocure_app WITH LOGIN PASSWORD 'strong_app_pass';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO smartprocure_app;
-- Explicit Security Revocations for Application Role:
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM smartprocure_app;
REVOKE UPDATE, DELETE ON TABLE audit_logs FROM smartprocure_app;

-- 3. Read-Only Reporting Role (Used for analytics/bi tools)
CREATE ROLE smartprocure_readonly WITH LOGIN PASSWORD 'strong_ro_pass';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO smartprocure_readonly;
REVOKE SELECT ON TABLE farmer_bank_accounts FROM smartprocure_readonly; -- Block financial PII
```

---

## 2. Transport & Rest Encryption Hardening

1. **TLS 1.3 Transport Encryption**: PostgreSQL config forces `ssl = on` and `ssl_min_protocol_version = 'TLSv1.3'`. Unencrypted plain TCP connections are rejected.
2. **Column Data Encryption**: Sensitive columns (`encrypted_account_number`, `encrypted_ifsc_code`) use **AES-256-GCM** encryption before write. The encryption key is held in server memory environment variables (`ENCRYPTION_KEY_32_BYTES`) and is never accessible to database users.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
