# Operations Runbook — SmartProcure Platform

## 1. System Infrastructure Overview
* **Backend Application**: Express REST API service running on Node.js v18/v20.
* **Database**: PostgreSQL 15 instance (`smart_procure` database).
* **Caching & Realtime**: Redis 7 cluster & WebSocket gateway.

---

## 2. Operational Troubleshooting Procedures

### A. Database Connection Interruption / Pool Exhaustion
* **Symptom**: HTTP 500 responses with log message `PostgreSQL connection unavailable`.
* **Action**:
  1. Inspect active connection pool count: `SELECT count(*) FROM pg_stat_activity;`
  2. Verify DB host health & restart pool if frozen.
  3. Memory fallback dynamically guarantees critical API responsiveness during micro-outages.

### B. High Sync Conflict Volume
* **Symptom**: Mandi staff reporting pending conflict alerts on `/admin/sync-conflicts`.
* **Action**:
  1. Mandi officers review server state vs. offline client state on the `SyncConflictPage`.
  2. Perform staff override: click `Accept Server State` or `Overwrite Server State` based on physical weighment receipts.

### C. DBT Payment Gateway Timeout
* **Symptom**: Payment records sticking in `PROCESSING` state.
* **Action**:
  1. Check mock bank gateway endpoint readiness.
  2. Execute payment retry worker: idempotency keys guarantee zero double-disbursements.
