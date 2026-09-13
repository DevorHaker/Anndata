# 38 — ANALYTICS DATA STRATEGY & READ REPLICAS

## SmartProcure: Materialized Views, Read-Only Replicas, and Aggregation Pipeline

---

## 1. Analytics & Reporting Architecture Strategy

Heavy administrative reports and analytics dashboards **MUST NEVER** execute long-running analytical aggregation queries directly against primary transactional tables.

```
┌─────────────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│ PRIMARY DB (WRITES/TX)  │ ──WAL──► │ READ REPLICA (ANALYTICS)│ ──CRON─► │ MATERIALIZED VIEWS      │
│ - Bookings, Queue, Pay  │          │ - Reporting Queries     │          │ - Daily Centre Summaries│
└─────────────────────────┘          └─────────────────────────┘          └─────────────────────────┘
```

---

## 2. Materialized View Blueprint (`mv_daily_centre_procurement_summary`)

```sql
CREATE MATERIALIZED VIEW mv_daily_centre_procurement_summary AS
SELECT
  p.centre_id,
  c.district,
  (p.created_at AT TIME ZONE 'Asia/Kolkata')::DATE AS procurement_date,
  p.crop_type_id,
  COUNT(p.id) AS total_procurements_count,
  SUM(p.final_accepted_weight_kg) AS total_weight_kg,
  SUM(p.net_payable_amount) AS total_payout_amount,
  AVG(qi.moisture_percentage) AS avg_moisture_pct
FROM procurements p
JOIN procurement_centres c ON p.centre_id = c.id
JOIN quality_inspections qi ON p.quality_inspection_id = qi.id
WHERE p.status = 'APPROVED'
GROUP BY p.centre_id, c.district, (p.created_at AT TIME ZONE 'Asia/Kolkata')::DATE, p.crop_type_id;

-- Unique Index for Concurrent Refresh
CREATE UNIQUE INDEX idx_mv_daily_summary ON mv_daily_centre_procurement_summary(centre_id, procurement_date, crop_type_id);

-- Scheduled Refresh Command (Executed Nightly off-peak via Cron/Worker)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_centre_procurement_summary;
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
