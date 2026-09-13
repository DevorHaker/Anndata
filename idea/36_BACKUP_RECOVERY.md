# 36 — DATABASE BACKUP & DISASTER RECOVERY (DR)

## SmartProcure: Continuous WAL Archiving, PITR, and Recovery Targets

---

## 1. Recovery Targets (RPO & RTO)

> **RECOVERY TARGET SPECIFICATIONS**:
> Proposed recovery targets for SmartProcure production database operations:

- **Recovery Point Objective (RPO)**: **< 5 Seconds** (Maximum acceptable data loss in catastrophic regional failure).
- **Recovery Time Objective (RTO)**: **< 1 Hour** (Maximum acceptable time to restore database operations).

---

## 2. Automated Backup Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │            POSTGRESQL PRIMARY DATABASE                 │
                                  └───────────────┬────────────────────────┬───────────────┘
                                                  │                        │
                          Continuous WAL Stream   │                        │ Daily Dump (02:00 UTC)
                                                  ▼                        ▼
                                  ┌────────────────────────┐      ┌────────────────────────┐
                                  │   AWS S3 WAL BUCKET    │      │  DAILY SNAPSHOT BUCKET │
                                  │ (Point-in-Time Restore)│      │  (Encrypted pg_dump)   │
                                  └────────────────────────┘      └────────────────────────┘
```

1. **Continuous WAL Archiving (`pgBackRest` / WAL-G)**: PostgreSQL streams Write-Ahead Logs (WAL) continuously to an encrypted S3 bucket, enabling **Point-in-Time Recovery (PITR)** to any arbitrary second within the last 30 days.
2. **Daily Automated Snapshots**: Full logical database backups (`pg_dump -Fc`) run every night at 02:00 UTC and are stored with 90-day retention in an isolated S3 DR bucket.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
