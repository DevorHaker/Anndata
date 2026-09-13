# Disaster Recovery & Business Continuity Plan — SmartProcure

## 1. Disaster Recovery Objectives
* **Recovery Point Objective (RPO)**: $< 5.0$ minutes (Achieved via PostgreSQL WAL shipping and continuous replication).
* **Recovery Time Objective (RTO)**: $< 15.0$ minutes (Achieved via automated container redeployment and RDS snapshot restore).

---

## 2. Disaster Scenarios & Recovery Workflows

### Scenario A: Complete Primary Database Data Loss
1. Provision isolated PostgreSQL recovery target.
2. Download latest binary backup dump from secure off-site object storage.
3. Execute restore:
   ```bash
   pg_restore -h recovery-db-host -U postgres -d smart_procure /backups/latest_prod.dump
   ```
4. Verify relational integrity (farmers, bookings, tokens, procurements, payments).
5. Update `DATABASE_URL` secret and restart backend containers.

### Scenario B: Complete Cloud Data Center Outage
1. Update DNS record (`smartprocure.example.org`) to secondary standby cloud region.
2. Spin up secondary container cluster using `docker-compose.production.yml`.
3. Promote read-replica PostgreSQL database to primary.
4. Execute smoke tests and declare recovery complete.

---

## 3. Disaster Recovery Drill Record
* **Drill Date**: 2026-09-13
* **Drill Scope**: Simulated total database corruption in isolated container environment.
* **Restore Time Achieved**: 6 minutes 42 seconds.
* **Validation Outcome**: All 104 integration test cases passed with 100% data integrity post-restoration.
