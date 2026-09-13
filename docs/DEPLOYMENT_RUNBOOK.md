# Deployment Runbook — SmartProcure Production Releases

## 1. Pre-Deployment Validation Checklist
[ ] Verified release git tag (e.g. `v1.0.0`) on `main` branch.
[ ] GitHub Actions CI pipeline passed 100% on unit, integration, and build jobs.
[ ] Staging smoke tests executed successfully on `docker-compose.staging.yml`.
[ ] Pre-deployment automated snapshot backup taken of primary PostgreSQL database.

---

## 2. Deployment Execution Sequence

```
1. VERIFY RELEASE & CI
   ↓
2. CREATE DATABASE BACKUP SNAPSHOT
   ↓
3. RUN CONTROLLED BACKWARD-COMPATIBLE MIGRATIONS
   ↓
4. BUILD IMMUTABLE DOCKER IMAGES & PUSH TO REGISTRY
   ↓
5. EXECUTE ROLLING CONTAINER RESTART (Zero-Downtime)
   ↓
6. RUN /health AND /ready HEALTH CHECKS
   ↓
7. EXECUTE NON-DESTRUCTIVE SMOKE TEST
   ↓
8. MONITOR LOGS & LATENCY (15-Minute Window)
   ↓
9. DECLARE RELEASE SUCCESSFUL
```

### Execution Commands (Production Host)
1. **Pull Latest Release Stack**:
   ```bash
   docker-compose -f docker-compose.production.yml pull
   ```
2. **Execute Database Migration Verification**:
   ```bash
   docker-compose -f docker-compose.production.yml run --rm backend npm run migrate
   ```
3. **Trigger Zero-Downtime Container Rolling Update**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d --no-deps --build backend frontend
   ```
4. **Verify Container Readiness**:
   ```bash
   curl -i http://localhost:5000/api/v1/ready
   ```
