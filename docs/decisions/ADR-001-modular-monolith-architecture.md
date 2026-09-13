# ADR-001: Modular Monolith Architecture

## Status

Accepted

## Context

SmartProcure handles the agricultural procurement lifecycle (registration, slot booking, gate check-in, priority queueing, weighment, quality testing, payment disbursement). While microservices are popular for large enterprise applications, premature microservices introduce distributed transaction failures, network latency, complex deployment overhead, and debugging friction for a team building SIH 2026.

## Decision

We adopt a **Modular Monolith Architecture**:

- Single deployment unit for backend.
- Strictly isolated internal domain boundaries (`auth`, `farmers`, `centres`, `slots`, `bookings`, `queue`, `procurements`, `payments`).
- Clear dependency hierarchy: `Route -> Controller -> Service -> Repository -> Database`.

## Consequences

- **Positive**: Simplified local development, atomic database transactions across domains, easier testing, zero microservice network latency.
- **Negative**: Requires strict discipline to prevent domain modules from importing each other's repositories directly.
