# 01 — ARCHITECTURAL PRINCIPLES

## SmartProcure: Foundational Architecture Engineering Principles

---

## 1. Executive Summary & Context

SmartProcure is an end-to-end, high-concurrency agricultural procurement platform designed to digitize, streamline, and optimize crop procurement operations across distributed procurement centres. This document establishes the 16 core engineering and architectural principles that govern every technical decision, module boundary, data flow, and infrastructure design choice across the SmartProcure ecosystem.

---

## 2. Core Architectural Principles

### 1. Security by Design

- **Definition**: Security controls (authentication, authorization, data isolation, encryption, input validation) are embedded into every layer of the architecture, from frontend state management to database row-level filters.
- **Rationale**: SmartProcure handles sensitive financial transactions (disbursements), personal farmer identity records (Aadhaar, phone numbers, bank details), and critical agricultural trade data. A breach compromises food supply chain operations and financial trust.
- **Enforcement**: Zero-trust internal module assumptions; OWASP Top 10 defenses enforced at API Gateway and Middleware; strict data scope parameters on every database query.

### 2. API-First Development

- **Definition**: The REST API contract (`/api/v1/`) is fully specified, versioned, and mockable before any frontend or backend module implementation begins.
- **Rationale**: Decouples web frontend, mobile UI, and third-party integration development teams, enabling parallel execution without integration gridlock.
- **Enforcement**: OpenAPI 3.0 specs define request/response schemas; strict API versioning (`/v1/`); typed API response wrappers (`{ success, data, error, meta }`).

### 3. Separation of Concerns

- **Definition**: Every component, layer, and module has a single, well-defined responsibility. Frontend components handle UI/UX; Express controllers handle HTTP parsing; Domain services handle business rules; Repositories handle database I/O.
- **Rationale**: Eliminates spaghetti code, simplifies automated testing, and allows individual components to be modified or refactored without cascading regressions.
- **Enforcement**: Strict prohibition of SQL queries in controllers, prohibition of business logic in React components, and strict layered boundaries.

### 4. Modular Monolith Architecture

- **Definition**: The backend is architected as a single deployable Node.js application composed of strictly isolated, domain-bounded modules (`auth`, `bookings`, `queue`, `procurement`, etc.).
- **Rationale**: Avoids the premature operational complexity, distributed transaction overhead, and network latency of microservices while providing clean domain boundaries that allow future microservice extraction if required by scale.
- **Enforcement**: In-memory event bus for inter-module events; no cross-module database table joins without explicit repository interface abstractions.

### 5. Database as Source of Truth

- **Definition**: PostgreSQL serves as the single, canonical, transactional source of truth for all persistent state. Redis and client caches are strictly transient derivatives.
- **Rationale**: Agricultural procurement requires ACID guarantees for slot bookings, weighments, quality grades, and financial disbursements. Cache invalidation errors must never corrupt financial or queue state.
- **Enforcement**: Foreign key constraints, atomic SQL operations, transactional boundaries (`BEGIN...COMMIT`), and optimistic/pessimistic row locking.

### 6. Backend-Authoritative Business Rules

- **Definition**: All business validation, state machines, eligibility rules, and authorization checks are executed and enforced exclusively by the backend. Frontend validations exist solely for user experience.
- **Rationale**: Frontend code can be bypassed, tampered with, or spoofed via HTTP clients (Postman, curl, scripts). Security and data integrity must never depend on client compliance.
- **Enforcement**: Server-side schema validation (Zod/Joi) on every incoming payload; backend state machine transition guards.

### 7. Explicit State Transitions

- **Definition**: All entity lifecycle changes (Bookings, Tokens, Queue Entries, Procurements, Payments) are governed by strict, finite state machines (FSMs) with deterministic legal transitions.
- **Rationale**: Prevents illegal operational states (e.g., weighing a crop before QR check-in, or disbursing payment before procurement approval).
- **Enforcement**: Declarative FSM guards in domain services; rejection of invalid transitions with explicit `STATE_TRANSITION_ERROR` codes.

### 8. Idempotent Critical Operations

- **Definition**: Critical state-changing operations (booking creation, payment callbacks, check-ins, queue calls) are designed to produce the exact same outcome regardless of how many times they are invoked with the same request parameters.
- **Rationale**: Flaky rural cellular connectivity causes retries and duplicate HTTP requests. Double bookings or duplicate payment disbursements are catastrophic.
- **Enforcement**: `Idempotency-Key` HTTP header handling via Redis key tracking; database unique constraints on business keys.

### 9. Auditability by Design

- **Definition**: Every state change, authorization override, weight correction, and administrative action emits an immutable, tamper-evident audit record within the same database transaction.
- **Rationale**: Ensures complete regulatory compliance, fraud prevention, dispute resolution capability, and administrative accountability across all procurement centres.
- **Enforcement**: Audit log writes executed inside DB transactions; no database `UPDATE` or `DELETE` permissions on audit tables.

### 10. Observability & Correlation

- **Definition**: Every request is assigned a unique `X-Request-ID` correlation token at entry, which is propagated through log entries, database queries, background jobs, and real-time events.
- **Rationale**: Enables rapid root-cause diagnosis in distributed operational environments across thousands of simultaneous farmer interactions.
- **Enforcement**: Structured JSON logging (Pino/Winston); request tracing middleware; centralized metrics endpoints (`/health`, `/ready`).

### 11. Fault Tolerance & Graceful Degradation

- **Definition**: External integration failures (SMS gateway down, payment provider delayed, maps offline) or cache outages must not crash the core application or block essential physical centre workflows.
- **Rationale**: Rural procurement centres cannot halt physical crop collection due to a third-party SMS or mapping API outage.
- **Enforcement**: Pluggable provider fallback chains; circuit breakers; asynchronous job retries with exponential backoff; local offline token verification.

### 12. Evolutionary Horizontal Scalability

- **Definition**: The backend API servers are completely stateless, storing session state in Redis and persistent data in PostgreSQL, enabling effortless horizontal autoscaling.
- **Rationale**: Procurement demand spikes dramatically during harvest seasons. System capacity must scale out horizontally behind load balancers without architectural re-engineering.
- **Enforcement**: Zero local disk state on API containers; Redis-backed sessions and job queues.

### 13. Configuration Over Hardcoding

- **Definition**: Operational parameters (slot capacities, grace periods, SLA limits, rejection thresholds, notification retries) are dynamically managed via system configuration tables and cached in Redis.
- **Rationale**: Allows administrators to adjust operational policies per centre or district in real time without code deployments.
- **Enforcement**: SystemConfiguration module with Redis pub/sub cache invalidation.

### 14. External Integration Isolation

- **Definition**: All external systems (SMS gateways, payment processors, government identity databases, maps providers) are hidden behind abstract interface adapters.
- **Rationale**: Protects core domain logic from external vendor locking, API breaking changes, and facilitates seamless mock/stub testing during development.
- **Enforcement**: Adapter pattern; mock implementations enabled by default in local/staging environments.

### 15. Testability at Every Layer

- **Definition**: The architecture supports automated testing across the entire testing pyramid (Unit, Integration, API, Component, E2E, Load).
- **Rationale**: High code quality and regression prevention are mandatory for a production platform serving public agricultural infrastructure.
- **Enforcement**: Dependency injection pattern in domain services; Vitest for backend/frontend unit tests; Supertest for API integration tests; Playwright for E2E flows.

### 16. Maintainability & Clean Architecture

- **Definition**: Strict directory conventions, uniform error handling, standardized response payloads, and clean domain boundaries are maintained across both frontend and backend repositories.
- **Rationale**: Reduces cognitive load for developers, accelerates onboarding, and ensures long-term codebase health.
- **Enforcement**: Automated ESLint/Prettier rules, TypeScript/Zod boundary enforcement, and mandatory architectural PR reviews.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
