# 37 — DATABASE PERFORMANCE & CONNECTION POOLING

## SmartProcure: PgBouncer, Memory Tuning, and Query Performance Architecture

---

## 1. Connection Pooling Architecture (PgBouncer)

To prevent PostgreSQL process exhaustion during peak harvest booking spikes:

- Node.js API containers connect to **PgBouncer** running in **Transaction Pooling Mode**.
- PgBouncer maintains 200 backend PostgreSQL connections while serving up to 5,000 concurrent Node.js client connections.

```
[ 20 API Server Instances ] ─── (5,000 Client Connections) ───► [ PgBouncer Pooler ]
                                                                      │ (200 Transaction Connections)
                                                                      ▼
                                                        [ PostgreSQL Primary Engine ]
```

---

## 2. PostgreSQL Memory Configuration Guidelines

```ini
# Recommended PostgreSQL 16 Memory Parameters (16GB RAM Node)
shared_buffers = 4GB                  # 25% of total RAM for shared buffer cache
effective_cache_size = 12GB           # 75% of total RAM estimated query cache
work_mem = 32MB                       # Memory per sort/hash operation
maintenance_work_mem = 512MB          # Memory for VACUUM and index creation
random_page_cost = 1.1                # Optimized for SSD / NVMe storage
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
