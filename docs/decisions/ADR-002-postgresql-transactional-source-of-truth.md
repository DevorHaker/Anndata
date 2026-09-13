# ADR-002: PostgreSQL as Transactional Source of Truth

## Status

Accepted

## Context

Agricultural procurement requires strict ACID transactional guarantees for slot booking capacity, weighbridge measurements, and direct benefit transfer (DBT) payment processing. Data corruption or race conditions in booking capacity or payment records could lead to financial losses or farmer dissatisfaction.

## Decision

PostgreSQL 16 is established as the sole primary transactional source of truth for all persistent state in SmartProcure.

- All slot reservations, token issuances, weighment records, and payment records MUST be committed to PostgreSQL via parameterized queries or ORM transactions.
- Foreign keys, check constraints, unique constraints, and optimistic locking (`version` column) enforce integrity at the database layer.

## Consequences

- **Positive**: Strict ACID guarantees, row-level locking for concurrency, rich query capability, auditable partitioning.
- **Negative**: Requires careful index optimization and connection pooling under extreme concurrent booking spikes.
