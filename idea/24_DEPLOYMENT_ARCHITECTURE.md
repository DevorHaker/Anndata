# 24 — DEPLOYMENT ARCHITECTURE

## SmartProcure: Environment Topology, Load Balancing, and Multi-Tier Infrastructure

---

## 1. Multi-Environment Topology

SmartProcure operates four strictly isolated deployment environments:

```
[ DEVELOPMENT ]  ──(PR Commit)──>  [ TEST ]  ──(Staging Build)──>  [ STAGING ]  ──(Production Release)──>  [ PRODUCTION ]
Local Docker                       CI Test Suite                   Identical to Prod                       Multi-AZ Cloud
Compose Stack                      (Vitest/E2E)                    Single Replica                          Autoscaling Stack
```

---

## 2. Production Topology & Cloud Network Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    PUBLIC INTERNET                     │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ HTTPS (443) / WSS (443)
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                 EDGE / CDN TIER                        │
                               │  - Cloudflare / AWS CloudFront (DDoS, WAF, CDN Assets) │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ Encrypted Traffic
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │               LOAD BALANCING TIER                      │
                               │  - NGINX High-Availability Load Balancer Pair          │
                               │  - SSL Termination, HTTP/2, HSTS Headers               │
                               └──────────────┬───────────────────────────┬─────────────┘
                                              │                           │
                        ┌─────────────────────┴─────────────┐             │
                        │ Private Subnet Availability Zone A│             │ Private Subnet Availability Zone B
                        ▼                                   ▼             ▼
┌────────────────────────────────────────────────────────┐   ┌────────────────────────────────────────────────────────┐
│              APP SERVER INSTANCE A1                    │   │              APP SERVER INSTANCE B1                    │
│  - Node.js API Container (Express)                     │   │  - Node.js API Container (Express)                     │
│  - Socket.IO Gateway Container                         │   │  - Socket.IO Gateway Container                         │
└───────────────────────┬────────────────────────────────┘   └───────────────────────┬────────────────────────────────┘
                        │                                                            │
                        ├────────────────────────────────────────────────────────────┘
                        │ Internal Service Network (VPC)
                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              DATA & STORAGE TIER                                                    │
│                                                                                                                     │
│  ┌───────────────────────────┐    ┌───────────────────────────┐    ┌─────────────────────────────────────────────┐  │
│  │ Primary PostgreSQL 16     │    │ Read Replica PostgreSQL   │    │ Redis 7 Sentinel Cluster                    │  │
│  │ (Multi-AZ Write Database) │───>│ (Analytics Read DB)       │    │ (3 Nodes: Master + 2 Replicas)              │  │
│  └───────────────────────────┘    └───────────────────────────┘    └─────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│                WORKER & ASYNC TIER                     │
│  - Dedicated BullMQ Worker Instance A                  │
│  - Dedicated BullMQ Worker Instance B                  │
└────────────────────────────────────────────────────────┘
```

---

## 3. High Availability & Failover Specifications

| Layer             | High Availability Strategy                                       | RTO (Recovery Time) | RPO (Recovery Point)           |
| ----------------- | ---------------------------------------------------------------- | ------------------- | ------------------------------ |
| **Load Balancer** | Dual NGINX active/passive pair with floating IP (Keepalived)     | < 10 Seconds        | Zero data loss                 |
| **API Servers**   | Stateless Docker containers behind NGINX; autoscaling 2–20 nodes | < 30 Seconds        | Zero data loss                 |
| **Database Tier** | AWS RDS PostgreSQL Multi-AZ automated failover instance          | < 60 Seconds        | < 5 Seconds (Sync Replication) |
| **Redis Tier**    | 3-Node Redis Sentinel with automatic master election             | < 5 Seconds         | < 1 Second                     |
| **Workers Tier**  | Multiple concurrent containers consuming from shared Redis queue | Instant failover    | Zero job loss (At-least-once)  |

---

## 4. Disaster Recovery & Backup Routine

1. **PostgreSQL Backups**:
   - **Continuous WAL Archiving**: Point-in-time recovery (PITR) enabled up to 30 days.
   - **Daily Automated Snapshot**: Encrypted daily full backup stored in a geographically separate AWS S3 disaster recovery bucket.
2. **Object Storage Replication**: Cross-region bucket replication enabled for farmer uploaded documents (`farmer_documents`).

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
