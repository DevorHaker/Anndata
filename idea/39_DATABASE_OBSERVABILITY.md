# 39 — DATABASE OBSERVABILITY & MONITORING

## SmartProcure: Query Metrics, Slow Query Tracking, Deadlocks, and Alert Rules

---

## 1. PostgreSQL Observability Configuration

SmartProcure enables `pg_stat_statements` to track query execution latencies, cache hit ratios, and index scans:

```ini
# postgresql.conf Observability Settings
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = top
log_min_duration_statement = 500      # Log queries taking longer than 500ms
log_line_prefix = '%m [%p] %q%u@%d '
log_lock_waits = on                   # Log queries waiting on locks longer than lock_timeout
log_deadlocks = on                    # Log deadlock occurrences
```

---

## 2. Key Database Metrics & Alert Thresholds

| Metric Name                  | Threshold              | Action / Alert Rule                                             |
| ---------------------------- | ---------------------- | --------------------------------------------------------------- |
| **Slow Queries (>500ms)**    | > 5 queries / minute   | Trigger PagerDuty alert; inspect `pg_stat_statements`.          |
| **Connection Pool Usage**    | > 80% capacity         | Trigger warning alert; scale API PgBouncer connection limit.    |
| **Replication Lag**          | > 10 MB or > 5 seconds | Trigger warning alert for Read Replica lag.                     |
| **Deadlock Rate**            | > 0 deadlocks          | Critical alert; review transaction lock acquisition order.      |
| **Database Disk Free Space** | < 20% remaining        | Trigger urgent infrastructure alert; expand EBS storage volume. |

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
