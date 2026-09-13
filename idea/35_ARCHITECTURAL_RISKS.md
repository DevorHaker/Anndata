# 35 — ARCHITECTURAL RISKS & MITIGATION MATRIX

## SmartProcure: Technical, Operational, and Infrastructure Risk Register

---

## 1. Risk Evaluation Methodology

Each risk is evaluated using a standard 5x5 Risk Matrix:

- **Probability ($P$)**: 1 (Rare) to 5 (Almost Certain)
- **Impact ($I$)**: 1 (Insignificant) to 5 (Catastrophic)
- **Risk Score ($RS$)**: $P \times I$ (High: 15–25, Medium: 8–12, Low: 1–6)

---

## 2. Technical Risk Register & Mitigations

| Risk ID   | Risk Description                                                                                          | Probability | Impact |     Score     | Architectural Mitigation Strategy                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------- | :---------: | :----: | :-----------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TR-01** | **Booking Overbooking Under Heavy Surge**: Two farmers simultaneously book the last slot.                 |      4      |   5    | **20 (HIGH)** | Dual-Layer Concurrency Guard: Redis Redlock + PostgreSQL Atomic SQL Capacity Decrement (`UPDATE slots SET capacity = capacity - 1 WHERE available > 0`). |
| **TR-02** | **Redis Master Outage**: Redis container crashes, losing live queue state.                                |      3      |   4    | **12 (MED)**  | Redis Sentinel auto-failover (5s). App falls back gracefully to querying canonical queue positions directly from PostgreSQL indexes.                     |
| **TR-03** | **WebSocket Connection Drop in Rural Network**: Cellular network drops stateful WebSocket connection.     |      5      |   3    | **15 (HIGH)** | Client automatic reconnection with exponential backoff; HTTP Long-Polling fallback; TanStack Query state refetch on reconnect.                           |
| **TR-04** | **Third-Party SMS Gateway Downtime**: SMS provider fails, blocking OTP verification.                      |      3      |   4    | **12 (MED)**  | SMS Adapter Provider Manager with automatic secondary failover (Twilio -> MSG91/SNS); asynchronous job retry backoff.                                    |
| **TR-05** | **Database Pool Exhaustion**: High concurrent HTTP requests exhaust PostgreSQL connection pool.           |      3      |   4    | **12 (MED)**  | PgBouncer connection pooling; statement timeouts (10s); read-query offloading to PostgreSQL Read Replicas.                                               |
| **TR-06** | **Duplicate Payment Disbursement**: Retried HTTP request causes double payment callback.                  |      2      |   5    | **10 (MED)**  | Mandatory `Idempotency-Key` header tracking in Redis; DB unique constraint on `procurement_id` in `payments` table.                                      |
| **TR-07** | **QR Code Screenshot Fraud**: Farmer shares screenshot of QR token with another farmer.                   |      3      |   4    | **12 (MED)**  | QR contains dynamic HMAC-SHA256 signature checked against DB single-use state (`ACTIVE` -> `USED`); officer scans match farmer photo/ID.                 |
| **TR-08** | **SQL Injection / Parameter Tampering**: Malicious user injects SQL payload.                              |      2      |   5    | **10 (MED)**  | Knex parameterised queries strictly enforced; zero raw SQL concatenation permitted.                                                                      |
| **TR-09** | **Storage Bucket Bloat**: Massive upload of uncompressed images fills object storage.                     |      4      |   2    |  **8 (MED)**  | S3 Lifecycle policies; 5MB file size limit enforced via pre-signed URL header constraints; client-side image compression.                                |
| **TR-10** | **Stale ETA Computations**: Queue delays cause inaccurate ETAs, leading to farmer frustration.            |      4      |   3    | **12 (MED)**  | Dynamic ETA Engine re-calculates rolling procurement averages every 5 minutes and pushes live Socket.IO updates.                                         |
| **TR-11** | **Memory Leak in Socket.IO Gateway**: Memory leaks from uncleaned room socket listeners.                  |      2      |   4    |  **8 (MED)**  | Explicit socket disconnect cleanup handlers; container memory limits; automated node process recycling.                                                  |
| **TR-12** | **Unauthorized Cross-Tenant Access**: User manipulates URL parameters to access another centre's records. |      2      |   5    | **10 (MED)**  | Server-side `validateScope` middleware forcing `WHERE centre_id = :assignedId` parameterisation on every query.                                          |
| **TR-13** | **Slow Cold-Start on Container Autoscaling**: Spike in harvest load delays scaling up Node.js instances.  |      3      |   3    |  **9 (MED)**  | Pre-warmed container pools; health check readiness tuning; container image optimization (<150MB).                                                        |

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
