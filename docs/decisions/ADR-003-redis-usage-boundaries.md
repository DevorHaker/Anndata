# ADR-003: Redis Usage Boundaries

## Status

Accepted

## Context

Redis is an in-memory datastore suited for high-speed caching, rate limiting, and queue coordination. However, using Redis as a primary source of transactional data risks data loss during unexpected crashes or failover events.

## Decision

Redis is strictly restricted to **Auxiliary Infrastructure**:

- **Allowed Uses**: OTP rate limiting, JWT token revocation blacklists, real-time queue cache, dynamic congestion metrics snapshotting, background job queueing.
- **Prohibited Uses**: Storing authoritative slot booking counts, procurement records, or payment state as primary storage without PostgreSQL backing.
- **Degraded State**: The application backend MUST support graceful degradation if Redis becomes temporarily unreachable.

## Consequences

- **Positive**: High speed for transient operations without risking loss of business-critical data.
- **Negative**: Auxiliary synchronization logic required between cache and database when caching volatile data.
