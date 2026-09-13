# 02 — SYSTEM ARCHITECTURE

## SmartProcure: High-Level System Architecture and Component Topology

---

## 1. High-Level Architecture Diagram

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    CLIENT LAYER                        │
                               │                                                        │
                               │  ┌──────────────────────┐    ┌──────────────────────┐  │
                               │  │   Farmer Web / PWA   │    │ Officer/Manager UI   │  │
                               │  │    (React + Vite)    │    │    (React + Vite)    │  │
                               │  └──────────┬───────────┘    └──────────┬───────────┘  │
                               └─────────────┼───────────────────────────┼──────────────┘
                                             │ HTTPS / WSS               │ HTTPS / WSS
                                             ▼                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │             EDGE & LOAD BALANCING LAYER                │
                               │                                                        │
                               │  ┌──────────────────────────────────────────────────┐  │
                               │  │       NGINX Reverse Proxy / SSL Termination      │  │
                               │  │    (Rate Limiting, HSTS, Webhook Ingestion)      │  │
                               │  └──────────────────────────┬───────────────────────┘  │
                               └─────────────────────────────┼──────────────────────────┘
                                                             │ REST / WS Gateway
                                                             ▼
                               ┌────────────────────────────────────────────────────────┐
                               │               APPLICATION SERVER LAYER                 │
                               │             (Node.js + Express Monolith)               │
                               │                                                        │
                               │  ┌──────────────────────────────────────────────────┐  │
                               │  │  API Gateway & Security Middleware               │  │
                               │  │  (JWT Auth, RBAC Guard, Scope Injector, Zod)     │  │
                               │  └──────────────────────────┬───────────────────────┘  │
                               │                             │                          │
                               │  ┌──────────────────────────┴───────────────────────┐  │
                               │  │  Modular Domain Services                         │  │
                               │  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │  │
                               │  │  │ Auth & User│ │ Bookings   │ │ Live Queue   │  │  │
                               │  │  ├────────────┤ ├────────────┤ ├──────────────┤  │  │
                               │  │  │ Procurements││ Payments   │ │ Intel Engine │  │  │
                               │  │  └────────────┘ └────────────┘ └──────────────┘  │  │
                               │  └──────────────────────────┬───────────────────────┘  │
                               │                             │ Internal Events          │
                               │  ┌──────────────────────────▼───────────────────────┐  │
                               │  │  EventEmitter / Redis Event Bus                  │  │
                               │  └──────────┬───────────────────────────┬───────────┘  │
                               └─────────────┼───────────────────────────┼──────────────┘
                                             │                           │
                                             ▼                           ▼
                               ┌───────────────────────────┐ ┌───────────────────────────┐
                               │   DATA & CACHE LAYER      │ │    WORKER & JOBS LAYER    │
                               │                           │ │                           │
                               │  ┌─────────────────────┐  │ │  ┌─────────────────────┐  │
                               │  │ PostgreSQL Primary  │  │ │  │ BullMQ Job Workers  │  │
                               │  │ (Transactional DB)  │  │ │  │ (SMS, Retries, Sync) │  │
                               │  └──────────┬──────────┘  │ │  └──────────┬──────────┘  │
                               │             │ Replication │ │             │             │
                               │  ┌──────────▼──────────┐  │ │             │             │
                               │  │ Read Replica (Opt)  │  │ │             │             │
                               │  └─────────────────────┘  │ │             │             │
                               │  ┌─────────────────────┐  │ │             │             │
                               │  │ Redis Cluster       │◄─┼─┼─────────────┘             │
                               │  │ (Cache/Queue/Lock)  │  │ │                           │
                               │  └─────────────────────┘  │ │                           │
                               └───────────────────────────┘ └───────────────────────────┘
                                             │                           │
                                             ▼                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │               EXTERNAL INTEGRATION LAYER               │
                               │                                                        │
                               │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
                               │  │ SMS Gateway  │ │ Email Engine │ │ Payment Gateway│  │
                               │  │  (Twilio)    │ │  (AWS SES)   │ │ (Bank/DBT Stub)│  │
                               │  └──────────────┘ └──────────────┘ └────────────────┘  │
                               │  ┌──────────────┐ ┌──────────────┐                     │  │
                               │  │ Maps Engine  │ │ Object Store │                     │  │
                               │  │ (Haversine/S3)││ (AWS S3/MinIO)│                     │  │
                               │  └──────────────┘ └──────────────┘                     │  │
                               └────────────────────────────────────────────────────────┘
```

---

## 2. Layer Definitions and Responsibilities

### 2.1 Client Layer (React + Vite)

- **Farmer PWA / Web App**: Client-side application supporting self-registration, centre recommendations, booking, digital QR token display, and real-time queue position tracking. Optimized for low-bandwidth rural networks.
- **Officer & Manager UI**: High-density operational dashboard for QR scanning, queue management, weighing machine entry, quality recording, decision approvals, and live analytics.

### 2.2 Edge & Load Balancing Layer (NGINX)

- **SSL/TLS Termination**: Enforces HTTPS/WSS with TLS 1.3.
- **Reverse Proxying**: Routes static assets to CDN/storage and dynamic requests to backend Node.js instances.
- **Rate Limiting**: Protects authentication endpoints (`/auth/login`, `/auth/register`) and critical APIs from DDoS and brute-force attacks.

### 2.3 Application Server Layer (Modular Monolith)

- **API Gateway Middleware**: Request ID generation, CORS handling, JWT verification, RBAC authorization, tenant/scope injection, input payload sanitization (Zod).
- **Domain Modules**: Isolated business modules (`auth`, `farmers`, `centres`, `slots`, `bookings`, `tokens`, `queue`, `procurement`, `payments`, `analytics`, `intelligence`, `audit`).
- **Internal Event Bus**: In-memory `EventEmitter` for synchronous domain events, coupled with Redis pub/sub for real-time WebSocket broadcast propagation.

### 2.4 Data & Cache Layer

- **PostgreSQL 16**: Primary relational database handling transactional operations (bookings, weighments, payments, audit logs) with foreign keys, row locks, and strict constraints.
- **Redis 7**: High-performance in-memory store for session metadata, rate-limit counters, distributed locks (Redlock algorithm), real-time queue position caching, and BullMQ job queues.

### 2.5 Worker & Jobs Layer (BullMQ)

- Asynchronous background worker processes executing isolated long-running tasks (SMS notification dispatches, email delivery, automated no-show background detection, payment retries, daily analytics rollup).

### 2.6 Real-Time Gateway (Socket.IO / WebSockets)

- Stateful connection server maintaining bi-directional communication channels for live queue position updates, ETA changes, officer call alerts, and centre congestion warnings.

### 2.7 External Integration Layer

- Pluggable adapter layer isolating business logic from third-party vendor APIs (SMS providers, payment/DBT gateways, maps/geolocation, object storage).

---

## 3. Communication Protocols

| Source     | Destination      | Protocol     | Format             | Security              |
| ---------- | ---------------- | ------------ | ------------------ | --------------------- |
| Client UI  | Edge Proxy       | HTTPS / WSS  | JSON / Binary      | TLS 1.3, Bearer JWT   |
| Edge Proxy | API Server       | HTTP/1.1     | JSON               | Internal Subnet, HSTS |
| API Server | PostgreSQL       | TCP (pgpool) | Binary SQL         | TLS, Scram-SHA-256    |
| API Server | Redis            | TCP (RESP)   | Binary RESP        | TLS, Password Auth    |
| API Server | Socket.IO        | WSS / TCP    | Engine.IO JSON     | JWT Handshake Auth    |
| API Server | Workers          | TCP (Redis)  | BullMQ Job Payload | Redis Auth            |
| Workers    | External Vendors | HTTPS        | JSON / Form        | API Keys, OAuth 2.0   |

---

## 4. Scalability Topology

1. **Stateless API Tier**: API instances can be scaled horizontally from 1 to 50+ instances behind NGINX without state conflict.
2. **Database Primary/Replica**: Reads (analytics, history views) can be routed to PostgreSQL read replicas, while writes stay on Primary.
3. **Dedicated Job Workers**: Background workers scale independently from API instances to handle high notification surges without impacting HTTP response times.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
