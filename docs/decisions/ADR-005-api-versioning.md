# ADR-005: API Versioning Strategy

## Status

Accepted

## Context

As the SmartProcure API evolves across future development phases and potential mobile app or government portal integrations, breaking changes to REST API endpoints must be prevented from breaking client applications.

## Decision

We enforce URL path-based API versioning:

- Base prefix for initial production version: `/api/v1`
- All module routers (`/auth`, `/farmers`, `/centres`, `/slots`, `/bookings`, etc.) are mounted under `/api/v1`.
- Future major revisions that break backwards compatibility will be mounted under `/api/v2` without modifying existing v1 route definitions.

## Consequences

- **Positive**: Clear, explicit versioning contract in request URLs; enables seamless co-existence of v1 and v2 routes during migrations.
- **Negative**: Requires maintaining version route prefix in client API configuration.
