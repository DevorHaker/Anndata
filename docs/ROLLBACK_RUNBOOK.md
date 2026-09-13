# Rollback Runbook — SmartProcure Production Emergency Recovery

## 1. Rollback Trigger Criteria
A rollback MUST be initiated if any of the following occur within 15 minutes post-deployment:
* Unhandled 5xx error rate spikes above 2% of total traffic.
* Core procurement or DBT payment transactions fail systematically.
* Database lock contention or connection pool exhaustion causes HTTP timeouts.

---

## 2. Application Rollback Execution
1. **Identify Previous Known Good Image Tag**:
   ```bash
   export PREVIOUS_TAG=v0.9.9
   ```
2. **Revert Frontend and Backend Container Versions**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d --no-deps backend frontend
   ```
3. **Verify Restored Container Health**:
   ```bash
   curl -i http://localhost:5000/api/v1/health
   ```

---

## 3. Database Schema Rollback Policy
* **CRITICAL RULE**: NEVER execute automated destructive schema rollbacks (`DROP TABLE` / `DROP COLUMN`) on active production data.
* If a migration introduced breaking changes, execute a forward-fix migration patch or restore from the pre-deployment PostgreSQL snapshot in an isolated verification instance before applying.
