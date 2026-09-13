# 29 — SCALABILITY & EVOLUTIONARY ARCHITECTURE

## SmartProcure: Capacity Scaling Evolution from Single Centre to National Network

---

## 1. Evolutionary Growth Blueprint

SmartProcure is engineered to evolve seamlessly through 4 scaling tiers without requiring root-level software rewrites:

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│        TIER 1          │      │        TIER 2          │      │        TIER 3          │      │        TIER 4          │
│ Single Centre Pilot    │ ───> │ Multi-Centre District  │ ───> │ Multi-District State   │ ───> │ National Deployment    │
│ (1–5 Centres)          │      │ (50–200 Centres)       │      │ (1,000+ Centres)       │      │ (10,000+ Centres)      │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

---

## 2. Infrastructure Scaling Architecture Matrix

| Infrastructure Component | Tier 1: Pilot (1–5 Centres)         | Tier 2: District (50–200 Centres)       | Tier 3: State (1,000+ Centres)                           | Tier 4: National (10,000+ Centres)               |
| ------------------------ | ----------------------------------- | --------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| **API Server Instances** | 2 Node.js Monolith containers       | 6–10 Container Cluster behind NGINX     | 30+ Autoscaling Containers behind AWS ALB                | Microservice extraction for `bookings` & `queue` |
| **PostgreSQL Database**  | Single PostgreSQL Instance (8 vCPU) | Primary + 2 Read Replicas (pgpool-II)   | RDS PostgreSQL Multi-AZ + Connection Pooling (PgBouncer) | CitusDB / Sharded PostgreSQL by `district_id`    |
| **Redis Infrastructure** | Single Redis 7 Instance             | 3-Node Redis Sentinel Cluster           | 6-Node Redis Cluster (Sharded Keyspaces)                 | Distributed Redis Cluster per Region             |
| **WebSocket Real-Time**  | Single Socket.IO instance           | Socket.IO + Redis Stream Adapter        | Dedicated Stateful Real-Time Gateway Cluster             | Kafka / NATS Streaming Infrastructure            |
| **Background Workers**   | 2 Shared BullMQ processes           | 10 Specialized BullMQ Worker Containers | Multi-Node Worker Cluster                                | Kafka-based Worker Pipelines                     |

---

## 3. Sharding & Partitioning Strategy for State/National Scale

When transitioning to Tier 3/4 (National Scale):

1. **Database Sharding Key**: Data is horizontally sharded using `district_id`.
   - All centre operations (`slots`, `bookings`, `queue_entries`, `procurements`) within a district remain co-located on the same database shard.
   - Cross-shard transactions are eliminated because procurement operations are physically bound to a single district centre.
2. **CDN Static Distribution**: Web/PWA static assets (HTML/JS/CSS/Images) are offloaded to Cloudflare CDN edge nodes, reducing API server load by 80%.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
