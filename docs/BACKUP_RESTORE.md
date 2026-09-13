# Backup & Disaster Recovery Architecture — SmartProcure

## 1. Recovery Objectives
* **Recovery Point Objective (RPO)**: $< 5.0$ minutes (WAL archiving & transactional replication).
* **Recovery Time Objective (RTO)**: $< 15.0$ minutes for full service restoration.

---

## 2. PostgreSQL Backup Procedures
1. **Automated Daily Base Backup**:
   * Executed daily at 01:00 IST via `pg_dump` binary format.
   * Command:
     ```bash
     pg_dump -h localhost -U smart_procure_app -F c -b -v -f /backups/smart_procure_$(date +%Y%m%d).dump smart_procure
     ```
2. **Continuous WAL Archiving**:
   * Continuous Write-Ahead Logging (WAL) shipping enabled for Point-In-Time Recovery (PITR).

---

## 3. Disaster Recovery Restoration Procedure
1. Create target isolated PostgreSQL instance:
   ```bash
   createdb -h localhost -U postgres smart_procure_recovery
   ```
2. Restore binary dump:
   ```bash
   pg_restore -h localhost -U postgres -d smart_procure_recovery -v /backups/smart_procure_target.dump
   ```
3. Run integrity verification suite:
   ```bash
   npm run test:backend
   ```
