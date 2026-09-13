# 33 — DATABASE MIGRATION STRATEGY & LIFECYCLE

## SmartProcure: Version-Controlled Migrations, Rollback Engineering, and Zero-Downtime Releases

---

## 1. Migration Engineering Principles

1. **Version-Controlled Tooling**: Database migrations are managed via **Knex.js Migration Scripts** stored in `backend/src/database/migrations/`.
2. **Sequential Filename Convention**: Files use UTC timestamp prefixes: `YYYYMMDDHHMMSS_description.js` (e.g. `20260913120000_create_users_and_roles.js`).
3. **Strict Bidirectional Support**: Every migration file must export both `up()` (forward migration) and `down()` (rollback migration) functions.
4. **Zero Manual Schema Editing**: Direct manual `ALTER TABLE` execution in staging or production is strictly forbidden.

---

## 2. Backward-Compatible Zero-Downtime Migration Pattern

When modifying table structures in production without taking system downtime:

```
[ PHASE 1: EXPAND ]                [ PHASE 2: MIGRATE DATA ]          [ PHASE 3: CONTRACT ]
- Add new nullable column          - Application worker backfills     - Deprecate old column
- Update API code to write to both   old values to new column          - Drop old column in next release
```

---

## 3. Migration Pipeline Automation in CI/CD

```bash
# Production Deployment Migration Execution Command
npm run db:migrate -- --env production
```

- **Pre-Flight Lock**: Knex automatically acquires a database migration lock table (`knex_migrations_lock`) during execution to prevent concurrent migration attempts across multiple API instance containers.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
