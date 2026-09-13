# 14 — NON-FUNCTIONAL REQUIREMENTS

## SmartProcure: System Quality Attributes and Technical Standards

---

## Format Conventions

- **MVP Target**: Required from day 1 of production deployment
- **Future Target**: Target as the platform scales beyond MVP
- All performance targets are for the 95th percentile unless otherwise specified

---

## 1. PERFORMANCE

| Requirement                                            | MVP Target                | Future Target |
| ------------------------------------------------------ | ------------------------- | ------------- |
| API p95 response time (read endpoints)                 | < 300ms                   | < 150ms       |
| API p95 response time (write endpoints)                | < 500ms                   | < 200ms       |
| API p99 response time (critical endpoints)             | < 1000ms                  | < 500ms       |
| Queue ETA update latency (after procurement completes) | < 60 seconds              | < 10 seconds  |
| Check-in QR validation response time                   | < 200ms                   | < 100ms       |
| Token generation time (inline with booking)            | < 200ms                   | < 100ms       |
| Recommendation computation time                        | < 2 seconds               | < 500ms       |
| Notification dispatch latency (from event to queue)    | < 1 second                | < 200ms       |
| Notification delivery (SMS)                            | < 60 seconds from trigger | < 30 seconds  |
| Report generation (daily centre report)                | < 10 seconds              | < 3 seconds   |
| Audit log write latency                                | < 100ms (in-transaction)  | < 50ms        |
| Database read query (with proper indexing)             | < 50ms p95                | < 20ms p95    |

---

## 2. SCALABILITY

| Requirement                         | MVP Assumption           | Future Target                                |
| ----------------------------------- | ------------------------ | -------------------------------------------- |
| Concurrent users                    | 5,000                    | 500,000                                      |
| Concurrent active centre operations | 50 centres               | 5,000 centres                                |
| Daily transaction volume            | 10,000 bookings/day      | 1,000,000 bookings/day                       |
| Notification throughput             | 50,000 notifications/day | 5,000,000/day                                |
| Queue entries per centre at peak    | 200 simultaneous         | 2,000 simultaneous                           |
| API request throughput              | 100 req/sec              | 10,000 req/sec                               |
| Database connections                | 50 pool size             | 500 pool size (with PgBouncer or equivalent) |
| Background job workers              | 2 worker processes       | 100+ worker processes                        |

**Scalability Design Principles:**

- Stateless API servers — can be horizontally scaled by adding instances
- Session state stored in Redis (not in-memory)
- Queue processing workers are independently scalable
- Database read replicas for analytics queries
- Rate limiting enforced at API gateway layer, not in application code

---

## 3. AVAILABILITY

| Requirement                       | MVP Target                         | Future Target                       |
| --------------------------------- | ---------------------------------- | ----------------------------------- |
| Core API availability (SLA)       | 99.5% (≈ 43.8 hours downtime/year) | 99.9% (≈ 8.7 hours/year)            |
| Planned maintenance windows       | Sundays 02:00–04:00 local time     | Rolling deployments (zero downtime) |
| Notification service availability | 99.0%                              | 99.9%                               |
| Payment processing availability   | 99.5%                              | 99.9%                               |
| Recovery Point Objective (RPO)    | 1 hour                             | 15 minutes                          |
| Recovery Time Objective (RTO)     | 4 hours                            | 1 hour                              |

**Availability Strategy:**

- Deploy with minimum 2 application server instances behind a load balancer
- PostgreSQL with automated failover replica
- Redis Sentinel or Cluster for cache/queue availability
- Health checks at 30-second intervals; automatic instance replacement

---

## 4. RELIABILITY

| Requirement               | Standard                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Database transactions     | ACID compliant; no partial state changes                                            |
| Idempotent API operations | All POST endpoints that create resources support Idempotency-Key                    |
| Payment webhooks          | Exactly-once processing guaranteed by idempotency key                               |
| Background jobs           | At-least-once delivery; job handlers are idempotent                                 |
| Token generation          | Within-booking-transaction; no booking without token                                |
| Audit log writes          | Within-operation-transaction; no state change without audit record                  |
| Race condition protection | Distributed locks (Redis) for slot booking; optimistic locking for queue operations |
| Message queue             | Persistent queues (not in-memory) with acknowledged delivery                        |

---

## 5. SECURITY (Non-Functional Targets)

| Requirement                       | Standard                                                              |
| --------------------------------- | --------------------------------------------------------------------- |
| HTTPS everywhere                  | TLS 1.2 minimum; 1.3 preferred                                        |
| Certificate management            | Automated renewal (Let's Encrypt or equivalent)                       |
| Password storage                  | bcrypt with work factor ≥ 12                                          |
| JWT signing algorithm             | HS256 minimum; RS256 for production (asymmetric)                      |
| Token HMAC algorithm              | HMAC-SHA256                                                           |
| Sensitive data encryption at rest | AES-256 (bank account, Aadhaar)                                       |
| API rate limiting                 | Per-IP and per-user limits; 429 responses with backoff                |
| Security headers                  | HSTS, CSP, X-Frame-Options, X-Content-Type-Options set                |
| Dependencies                      | Automated security scanning on every deployment (npm audit / Snyk)    |
| Secret management                 | No secrets in code or version control; environment variables or vault |
| Penetration testing               | Annual for MVP; quarterly at scale                                    |

See `15_SECURITY_REQUIREMENTS.md` for the full security specification.

---

## 6. PRIVACY

| Requirement                | Standard                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| Data minimisation          | Collect only data strictly necessary for function                         |
| Sensitive field encryption | Aadhaar, bank account stored encrypted; never returned in API plaintext   |
| PII in logs                | PII must not appear in server logs; masked or excluded                    |
| PII in notifications       | No PII in SMS or email notification bodies                                |
| Right to access            | Farmers can request export of their own data                              |
| Right to deletion          | Accounts can be deactivated; PII removed after legal retention period     |
| Data retention             | Audit logs: 7 years; Transaction data: 5 years; Notification logs: 1 year |
| Consent                    | Clear terms of service and privacy policy at registration                 |

---

## 7. ACCESSIBILITY

| Requirement           | Standard                                            |
| --------------------- | --------------------------------------------------- |
| WCAG compliance       | WCAG 2.1 Level AA                                   |
| Screen reader support | Semantic HTML; ARIA labels on interactive elements  |
| Keyboard navigation   | Full keyboard accessibility for all critical flows  |
| Colour contrast       | Minimum 4.5:1 for normal text; 3:1 for large text   |
| Text scaling          | UI functional at 200% browser zoom                  |
| Mobile responsive     | Core farmer flows functional on 320px width screens |
| Touch target size     | Minimum 44×44 pixels for interactive elements       |
| Language support      | English (Phase 1); Regional language text (Phase 2) |

---

## 8. USABILITY

| Requirement            | Standard                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| Farmer booking flow    | Must be completable in ≤ 5 steps with ≤ 3 taps per step            |
| Error messages         | Must be plain language; must suggest corrective action             |
| Loading states         | All async operations must show loading indicator                   |
| Form validation        | Real-time inline validation; not just on submit                    |
| Offline tolerance      | Farmer can view booking and token without network (cached)         |
| Officer check-in speed | QR scan to check-in confirmation in ≤ 3 seconds                    |
| Progressive disclosure | Advanced features hidden by default; not overwhelming to new users |
| Mobile-first           | All UI components designed for mobile-first; desktop is enhanced   |

---

## 9. MAINTAINABILITY

| Requirement           | Standard                                                             |
| --------------------- | -------------------------------------------------------------------- |
| Code structure        | Layered architecture: routes → controllers → services → repositories |
| Module coupling       | Loose coupling via dependency injection                              |
| API versioning        | URL-versioned from day 1 (`/api/v1/`)                                |
| Configuration         | All environment-specific values in environment variables             |
| Documentation         | All API endpoints documented in OpenAPI 3.0                          |
| Test coverage         | Minimum 80% unit test coverage on service layer                      |
| Integration tests     | All critical flows covered by integration tests                      |
| Database migrations   | All schema changes via numbered migration files; no manual changes   |
| Code review           | PR-based development; no direct commits to main                      |
| Dependency management | Lock files committed; automated dependency update PRs                |

---

## 10. OBSERVABILITY

| Requirement         | Standard                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| Structured logging  | All logs in JSON format with: timestamp, level, request_id, actor_id, message    |
| Log levels          | ERROR, WARN, INFO, DEBUG — configurable per environment                          |
| Distributed tracing | X-Request-ID propagated through all service calls                                |
| Metrics collection  | Application metrics exposed for Prometheus scraping                              |
| Key metrics tracked | API latency, error rate, active sessions, queue depths, job success/failure rate |
| Alerting            | Automated alerts for: error rate > 1%, p99 latency > 2s, job failure             |
| Dashboard           | Grafana or equivalent operational dashboard                                      |
| Log retention       | Application logs: 30 days hot; 90 days cold storage                              |
| Error tracking      | Sentry or equivalent for real-time error capture and grouping                    |
| Slow query logging  | DB queries > 500ms are logged as warnings                                        |

---

## 11. BACKUP AND RECOVERY

| Requirement               | MVP Standard                                                |
| ------------------------- | ----------------------------------------------------------- |
| Database backup frequency | Daily full backup + continuous WAL archiving                |
| Backup retention          | 30-day point-in-time recovery                               |
| Backup verification       | Weekly automated restore test                               |
| Backup storage            | Off-region (different provider region)                      |
| Object storage backup     | Daily snapshots of document storage                         |
| Redis backup              | RDB snapshots every 15 minutes; AOF persistence             |
| Restoration test          | Quarterly full disaster recovery test                       |
| Recovery documentation    | Runbook for all failure scenarios documented and accessible |

---

## 12. DISASTER RECOVERY

| Scenario                    | MVP Response                                             |
| --------------------------- | -------------------------------------------------------- |
| Application server failure  | Auto-replaced by load balancer within 60 seconds         |
| Database primary failure    | Failover to replica within 5 minutes (automated)         |
| Redis failure               | Cache miss → DB fallback; queue drained from persistence |
| Complete datacenter failure | Manual failover to DR site within 4 hours (RTO)          |
| Accidental data deletion    | Point-in-time restore within 1 hour                      |

**DR Testing:** Full DR drill conducted every 6 months.

---

## 13. DATA CONSISTENCY

| Requirement               | Standard                                                      |
| ------------------------- | ------------------------------------------------------------- |
| Database isolation level  | READ COMMITTED default; SERIALIZABLE for critical operations  |
| Booking slot count        | Atomic decrement with constraint check                        |
| Token generation          | Transactional with booking creation                           |
| Audit log writes          | Transactional with main operation                             |
| Payment event processing  | Idempotent; duplicate event detection by payment reference ID |
| Queue position assignment | Atomic; prevents two farmers receiving the same position      |
| Configuration reads       | Config values cached with 5-minute TTL in Redis               |

---

## 14. AUDITABILITY

| Requirement                   | Standard                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| Sensitive operations coverage | 100% of sensitive operations generate audit records             |
| Audit log immutability        | No UPDATE or DELETE on audit records; DB constraint enforced    |
| Log completeness              | Actor, action, entity, before-state, after-state, timestamp, IP |
| Audit log availability        | Audit logs queryable by managers and admins in real time        |
| Export capability             | Audit logs exportable as JSON or CSV for compliance review      |
| Retention                     | 7 years minimum in cold storage                                 |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
