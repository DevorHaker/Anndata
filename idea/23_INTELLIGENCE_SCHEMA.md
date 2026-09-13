# 23 — INTELLIGENCE & PREDICTION DATABASE SCHEMA

## SmartProcure: Recommendation Factors, Congestion Logs, and Prediction Records

---

## 1. Table Specifications

### 1.1 `recommendation_logs`

Logs of generated centre recommendations, scoring factors, and user selection outcomes for ML training.

```sql
CREATE TABLE recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_type_id UUID NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
  request_latitude NUMERIC(10, 8) NOT NULL,
  request_longitude NUMERIC(11, 8) NOT NULL,
  recommended_centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
  score NUMERIC(5, 2) NOT NULL,              -- Calculated suitability score (0–100)
  distance_km NUMERIC(6, 2) NOT NULL,
  capacity_factor NUMERIC(5, 2) NOT NULL,
  congestion_factor NUMERIC(5, 2) NOT NULL,
  engine_version VARCHAR(30) NOT NULL DEFAULT 'v1_rule_based',
  selected_by_farmer BOOLEAN NULL,            -- True if farmer booked recommended centre
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_farmer ON recommendation_logs(farmer_id);
```

### 1.2 `centre_congestion_snapshots`

Periodic operational snapshots (every 5 minutes) measuring queue congestion and processing throughput.

```sql
CREATE TABLE centre_congestion_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waiting_queue_count INTEGER NOT NULL,
  processing_count INTEGER NOT NULL,
  average_wait_minutes INTEGER NOT NULL,
  congestion_index NUMERIC(5, 2) NOT NULL,   -- Congestion metric (0.00 = Clear, 1.00 = Congested)
  operational_status VARCHAR(30) NOT NULL,   -- 'NORMAL', 'BUSY', 'CONGESTED', 'CRITICAL'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_congestion_centre_time ON centre_congestion_snapshots(centre_id, snapshot_timestamp);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
