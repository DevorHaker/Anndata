# 32 — ARCHITECTURAL DECISION RECORDS (ADRs)

## SmartProcure: Formal Engineering Architectural Decisions (ADR 001 – ADR 010)

---

## ADR-001: Modular Monolith vs. Microservices Architecture

- **Context**: SmartProcure requires rapid initial phase deployment, domain boundary clarity, and high reliability across 20 modules without immense operational overhead.
- **Decision**: Adopt a **Modular Monolith** architecture in Node.js/Express. Domain modules (`bookings`, `queue`, `payments`) are strictly isolated via directory conventions and internal event buses.
- **Alternatives Evaluated**: Microservices Architecture (Rejected due to premature distributed transaction management overhead, network latency, and deployment complexity).
- **Consequences**: Fast local development, simple CI/CD deployment, single database transaction capability, with clear paths to extract modules into microservices later if scaling demands it.

---

## ADR-002: PostgreSQL 16 as Single Primary Source of Truth

- **Context**: Agricultural procurement requires ACID transactional safety for slot capacity, weighments, quality grades, and financial disbursements.
- **Decision**: Use **PostgreSQL 16** as the sole primary, canonical transactional data store.
- **Alternatives Evaluated**: NoSQL (MongoDB) or dual-primary setups.
- **Consequences**: Guaranteed consistency, rich relational integrity constraints (`FOREIGN KEY`, `CHECK`), SQL index optimization, and reliable point-in-time recovery.

---

## ADR-003: Redis 7 as Ephemeral Cache, Queue Engine & Locking Store

- **Context**: High-concurrency slot bookings, real-time queue position lookups, and background jobs require sub-millisecond operational performance.
- **Decision**: Deploy **Redis 7** strictly for caching, Redlock distributed locking, BullMQ queues, and rate-limiting. **Redis is NEVER the primary source of truth.**
- **Alternatives Evaluated**: Using PostgreSQL for background queues and locking.
- **Consequences**: Sub-millisecond queue lookups; if Redis crashes, the application degrades gracefully to PostgreSQL without data loss.

---

## ADR-004: Versioned REST API with Standard JSON Envelope

- **Context**: Frontend client applications, mobile PWAs, and third-party integrations require a predictable, versioned interface contract.
- **Decision**: Expose a **Versioned REST API** (`/api/v1/`) returning a uniform JSON envelope (`{ success, data, meta, error }`).
- **Alternatives Evaluated**: GraphQL (Rejected due to caching complexity, authorization overhead, and steeper learning curve for integration partners).
- **Consequences**: Simple integration, standard HTTP status mapping, transparent rate limiting, and easy OpenAPI 3.0 documentation.

---

## ADR-005: Hybrid WebSocket (Socket.IO) & HTTP Polling Gateway

- **Context**: Farmers and centre managers require real-time updates for live queue positions, call notifications, and congestion alerts across erratic rural networks.
- **Decision**: Use **Socket.IO** (WebSockets primary) with automatic fallback to HTTP Long-Polling and TanStack Query refetch synchronization on reconnect.
- **Alternatives Evaluated**: Pure Server-Sent Events (SSE) or HTTP Polling only.
- **Consequences**: Instant UI updates when connectivity is good; seamless fallback for restrictive rural firewalls.

---

## ADR-006: Hybrid Dual-Token JWT System backed by Redis Sessions

- **Context**: Need fast stateless verification for API routes while retaining instant session revocation (logout, account suspension).
- **Decision**: Combine **15-minute RS256 Signed Access Tokens (JWT)** with **7-day Refresh Tokens** stored in HttpOnly cookies and checked against Redis session hashes.
- **Alternatives Evaluated**: Pure Server Sessions or Pure Stateless JWT without revocation.
- **Consequences**: Zero DB lookup for 99% of API calls; instant session revocation capability.

---

## ADR-007: Backend-Authoritative Role-Based Access Control (RBAC) with Resource Scoping

- **Context**: Five distinct user roles require strict isolation of operational and financial records.
- **Decision**: Enforce **Backend Authorization Middleware** (`authorizeRole`, `validateScope`) on every API endpoint. Data queries are automatically parameterized by user scope.
- **Alternatives Evaluated**: Client-side UI route protection only (Unsafe).
- **Consequences**: Guarantees zero cross-tenant or unauthorized data leaks; frontend UI exists strictly for user experience.

---

## 32.8 ADR-008: Phased Intelligence Engine (Rule-Based Launch)

- **Context**: System needs centre recommendations and congestion alerts on Day 1 without initial machine learning datasets.
- **Decision**: Implement a **Pluggable Recommendation Engine Interface**, launching Day 1 with a **Rule-Based Mathematical Model** (Distance, Capacity %, Congestion Index) before migrating to Statistical/ML models in later phases.
- **Alternatives Evaluated**: ML-first model (Rejected due to cold-start data absence).
- **Consequences**: Immediate, deterministic, lightweight execution at launch; clean interface abstraction for future ML model drop-in.

---

## ADR-009: Pluggable Integration Adapter Pattern for Third-Party Vendors

- **Context**: External services (SMS gateways, payment processors, maps) are subject to vendor lock-in, API changes, and environment availability.
- **Decision**: Wrap all external vendors behind **Abstract Adapter Interfaces** (`ISmsAdapter`, `IPaymentAdapter`). Provide mock implementations by default for local/staging environments.
- **Alternatives Evaluated**: Direct SDK calls inside domain controllers/services.
- **Consequences**: Complete vendor independence, seamless unit testing, zero external API costs during development.

---

## ADR-010: Asynchronous BullMQ Worker Queues for Heavy & Retryable Tasks

- **Context**: SMS notifications, email dispatches, report rollups, and payment retries must not block HTTP request/response execution.
- **Decision**: Utilize **BullMQ** (Redis-backed) for asynchronous background job execution with exponential backoff retries and Dead-Letter Queue (DLQ) tracking.
- **Alternatives Evaluated**: Inline asynchronous execution (`Promise.then()`) without persistence (Unsafe - lost on process crash).
- **Consequences**: High HTTP API throughput; resilient background job processing with manual DLQ recovery tools.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
