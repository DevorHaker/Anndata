# Final System & Infrastructure Architecture — SmartProcure

## 1. Executive Summary & Topology
The **SmartProcure (SIH26032)** platform is structured as a production-grade, modular monolith designed for scalable, resilient agricultural MSP procurement operations across rural and urban mandi centres in India.

### Logical Production Topology

```
                  INTERNET
                      │
                      ▼
               DNS / DOMAIN (e.g. smartprocure.example.org)
                      │
                      ▼
              HTTPS / TLS 1.3 Termination (Nginx Reverse Proxy)
                      │
                      ▼
              LOAD BALANCER / RATE LIMITER
                      │
             ┌────────┴────────┐
             │                 │
        FRONTEND            BACKEND
     (React 18 PWA)       (Node.js REST API)
             │                 │
             │          ┌──────┴──────┐
             │          │             │
             │       API SERVER    WEBSOCKET
             │          │             │
             │          └──────┬──────┘
             │                 │
             │       ┌─────────┼─────────┐
             │       │         │         │
             │   PostgreSQL   Redis    Workers
             │  (Primary DB) (Cache)  (Async Jobs)
             └──────────────────────────────
```

---

## 2. Subsystem Architecture
* **Frontend Tier**: React 18 SPA compiled via Vite into static assets served via Nginx with PWA IndexedDB cache for offline mandi gate operations.
* **Backend API Tier**: Node.js & Express REST API v1 operating statelessly with request correlation tracing (`x-request-id`), rate limiting, Helmet security headers, and structured JSON logging.
* **Realtime Gateway**: WebSocket connection gateway handling live mandi arrival alerts, token queue advancements, and emergency disruption announcements.
* **Database Tier**: PostgreSQL 15 authoritative relational database storing user records, land holdings, slots, tokens, weighments, quality decisions, and DBT payment logs.
* **Cache & Coordination Tier**: Redis 7 cluster managing active rate limit counters, temporary queue state, and background worker job queues.

---

## 3. External Integration Boundaries
All external integrations are strictly decoupled behind adapter interfaces (`Adapter Pattern`):
* **SMS Provider**: `SMSProviderAdapter` (Supports `mock`, `twilio`, `sns` modes).
* **Payment Provider**: `PaymentGatewayAdapter` (Supports `mock`, `pfms`, `npci` modes).
