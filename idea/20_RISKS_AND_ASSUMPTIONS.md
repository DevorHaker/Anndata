# 20 — RISKS AND ASSUMPTIONS

## SmartProcure: Risk Register and Explicit Assumption Catalog

---

## 1. Risk Register

### Risk Rating Scale

| Probability | Description                        |
| ----------- | ---------------------------------- |
| LOW         | Unlikely in normal operations      |
| MEDIUM      | Possible; requires monitoring      |
| HIGH        | Likely without specific mitigation |

| Impact   | Description                                       |
| -------- | ------------------------------------------------- |
| LOW      | Minor inconvenience; recoverable                  |
| MEDIUM   | Significant operational disruption                |
| HIGH     | Critical feature failure or data compromise       |
| CRITICAL | Platform failure, data loss, or regulatory action |

---

## 2. Technical Risks

| Risk ID    | Risk Description                                                       | Probability | Impact   | Mitigation Strategy                                                                                                       |
| ---------- | ---------------------------------------------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| RISK-T-001 | Race condition during slot booking causes overbooking                  | MEDIUM      | HIGH     | Atomic decrement query with row-level lock; distributed Redis lock at booking creation; reconciliation job                |
| RISK-T-002 | Token HMAC secret is compromised, allowing fake token generation       | LOW         | CRITICAL | Rotate secrets quarterly; store in secrets manager; audit all token validations; detect mass check-in anomalies           |
| RISK-T-003 | Database performance degrades at scale due to missing indices          | MEDIUM      | HIGH     | Identify all query patterns in Phase 1; create indices as part of migration files; load test in staging                   |
| RISK-T-004 | Notification service bottleneck during peak operations                 | MEDIUM      | MEDIUM   | Async queue-based delivery; horizontal scaling of notification workers; batch delivery for low-priority notifications     |
| RISK-T-005 | Redis unavailability breaks distributed locking and session management | MEDIUM      | MEDIUM   | Graceful degradation to DB-backed locks; session validation falls back to JWT-only; Redis HA via Sentinel                 |
| RISK-T-006 | Large audit log growth causes storage and query slowness               | HIGH        | MEDIUM   | Partition audit log table by month; archive cold logs to object storage; create covering indices on common query patterns |
| RISK-T-007 | JWT secret rotation breaks active user sessions                        | LOW         | MEDIUM   | Grace period for old JWT keys during rotation; proactive rotation schedule communicated                                   |
| RISK-T-008 | Background jobs fail silently without detection                        | MEDIUM      | HIGH     | Job failure monitoring with alerting; idempotent job design; dead-letter queue for failed jobs                            |
| RISK-T-009 | API memory/CPU leak under sustained load                               | MEDIUM      | HIGH     | Load testing before production deployment; memory leak detection in monitoring; auto-restart on memory threshold          |
| RISK-T-010 | QR code rendering fails on older Android browsers                      | MEDIUM      | MEDIUM   | Use widely supported QR library; test on target devices; text code fallback with booking reference                        |

---

## 3. Operational Risks

| Risk ID    | Risk Description                                                                             | Probability | Impact | Mitigation Strategy                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| RISK-O-001 | Centre managers do not use the system consistently, creating data gaps                       | HIGH        | HIGH   | Training programme; simple UI; offline mode support; support desk in early rollout                                                    |
| RISK-O-002 | Procurement officers revert to paper-based records alongside digital, creating inconsistency | HIGH        | HIGH   | Design system so paper is unnecessary; role-based training; audit log inconsistency detection                                         |
| RISK-O-003 | Equipment failures are not reported in the system (officers ignore the module)               | HIGH        | MEDIUM | Make equipment reporting mandatory before next farmer can be called; simple one-tap reporting                                         |
| RISK-O-004 | No-show marking incorrectly applied due to grace period misconfiguration                     | MEDIUM      | HIGH   | Default safe grace period (30 min); configurable with bounds; dispute mechanism; reconciliation job                                   |
| RISK-O-005 | Centre capacity configured incorrectly (too high) leading to operational overload            | MEDIUM      | HIGH   | Capacity bounds validation; changes require reason field; District Admin can override                                                 |
| RISK-O-006 | Payment provider delays are blamed on SmartProcure, eroding trust                            | HIGH        | MEDIUM | Real-time payment status visible to farmers; clear messaging that payment is processed by external provider; contact info for queries |
| RISK-O-007 | System clock differences between centre devices cause timing issues (check-in, token expiry) | MEDIUM      | HIGH   | All timestamps server-generated; NTP synchronisation on all servers; client clock not trusted                                         |
| RISK-O-008 | Staff turnover creates training gaps and reduced platform effectiveness                      | HIGH        | MEDIUM | Training materials in system; in-app help tooltips; supervisor-level oversight                                                        |

---

## 4. Adoption Risks

| Risk ID    | Risk Description                                                         | Probability | Impact   | Mitigation Strategy                                                                                                       |
| ---------- | ------------------------------------------------------------------------ | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| RISK-A-001 | Low smartphone penetration among farmers prevents adoption               | HIGH        | CRITICAL | Operator-assisted registration via kiosk; SMS-based minimal interaction (OTP + confirmations); digital literacy awareness |
| RISK-A-002 | Farmers distrust a digital system they cannot understand                 | HIGH        | HIGH     | Transparent, plain-language notifications; local-language support (Phase 2); field officers to support onboarding         |
| RISK-A-003 | Farmers resist pre-booking; prefer walk-in                               | HIGH        | HIGH     | Incentivise booking with confirmed slot priority; walk-ins can be handled but put in queue behind booked farmers          |
| RISK-A-004 | Procurement officers feel their authority is reduced by digital workflow | MEDIUM      | MEDIUM   | Design system to assist, not replace; officers retain approval authority; digital records protect officers from disputes  |
| RISK-A-005 | Farmers in areas with no mobile internet cannot use the app              | HIGH        | HIGH     | SMS-only fallback for critical notifications; offline QR token viewing (cached in browser); kiosk model                   |

---

## 5. Data Availability Risks

| Risk ID    | Risk Description                                                                            | Probability | Impact | Mitigation Strategy                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| RISK-D-001 | Insufficient data in early phase makes recommendation engine inaccurate                     | HIGH        | MEDIUM | Rule-based engine works without historical data; accuracy improves over time; clear explanation of recommendation basis               |
| RISK-D-002 | ETA predictions are inaccurate in early operation (no historical processing time baseline)  | HIGH        | MEDIUM | Default processing time from centre configuration; explicit caveat to farmers; accuracy improves after 14+ days                       |
| RISK-D-003 | Crop MSP rate data not consistently maintained, leading to incorrect payment calculations   | MEDIUM      | HIGH   | MSP rates require explicit admin configuration; payment calculation is transparent and audited; discrepancy report for district admin |
| RISK-D-004 | Farmer GPS location data not available (farmer denies permission or device doesn't support) | HIGH        | MEDIUM | Fallback to district entry; recommendation still works with reduced accuracy                                                          |
| RISK-D-005 | Historical no-show data insufficient to trigger suspension mechanism fairly                 | MEDIUM      | HIGH   | Suspension requires N consecutive no-shows (not just count); dispute mechanism; manual admin review                                   |

---

## 6. Integration Risks

| Risk ID    | Risk Description                                              | Probability | Impact | Mitigation Strategy                                                                                                          |
| ---------- | ------------------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| RISK-I-001 | SMS provider rate limits hit during peak notification periods | MEDIUM      | HIGH   | Multi-provider failover; batch non-critical notifications; pre-negotiate rate limits                                         |
| RISK-I-002 | Payment provider integration delayed, blocking real payments  | HIGH        | MEDIUM | Mock payment in MVP; real integration as P1; manual payment confirmation as interim                                          |
| RISK-I-003 | Government farmer identity API never made available           | HIGH        | MEDIUM | Manual document verification is the permanent MVP fallback; system designed to add API when available                        |
| RISK-I-004 | Payment provider changes API without notice                   | LOW         | HIGH   | Provider contract with change notification clause; version-pinned API integration; monitoring of provider changelog          |
| RISK-I-005 | Maps API costs exceed budget at scale                         | MEDIUM      | MEDIUM | Haversine formula for MVP (no cost); Google Maps API with request caching in Phase 2; OSRM (self-hosted) as free alternative |

---

## 7. Security Risks

| Risk ID    | Risk Description                                                      | Probability | Impact   | Mitigation Strategy                                                                                   |
| ---------- | --------------------------------------------------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------- |
| RISK-S-001 | SQL injection vulnerability in query construction                     | LOW         | CRITICAL | Parameterised queries only; regular security audits; automated SAST scanning                          |
| RISK-S-002 | Insider admin misuse of privileged access                             | LOW         | HIGH     | All admin actions logged; no single admin can modify audit logs; regular review of admin action logs  |
| RISK-S-003 | Farmer account takeover via weak OTP or guessing                      | LOW         | HIGH     | Rate-limited OTPs; 6-digit cryptographically random OTPs; account lockout                             |
| RISK-S-004 | Sensitive data (Aadhaar, bank account) leaks via API misconfiguration | MEDIUM      | CRITICAL | Encrypted at rest; masked in API responses; strict output filtering tests; automated PII detection    |
| RISK-S-005 | Token fraud via QR code photo copying                                 | MEDIUM      | HIGH     | Single-use token invalidated on first scan; timestamp-based expiry; fraud detection on duplicate scan |

---

## 8. Scalability Risks

| Risk ID     | Risk Description                                                  | Probability | Impact          | Mitigation Strategy                                                                             |
| ----------- | ----------------------------------------------------------------- | ----------- | --------------- | ----------------------------------------------------------------------------------------------- |
| RISK-SC-001 | Database becomes bottleneck at high read volume during peak hours | MEDIUM      | HIGH            | Read replicas for analytics queries; Redis caching for frequently-read data; connection pooling |
| RISK-SC-002 | Background job queue overloads at peak no-show detection time     | MEDIUM      | MEDIUM          | Distribute job execution time; horizontal worker scaling; job priority queuing                  |
| RISK-SC-003 | Single region deployment cannot handle national rollout           | LOW (MVP)   | HIGH (at scale) | Design for multi-region from the start; stateless servers; no local filesystem state            |

---

## 9. Explicit Assumptions

| Assumption ID | Category    | Assumption Statement                                                                                                                        | If Wrong: Consequence and Mitigation                                                           |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ASS-001       | Technology  | Farmers have access to either a smartphone or an operator-assisted kiosk for registration and booking                                       | If wrong: SMS-only minimal mode must be developed as P0 alternative                            |
| ASS-002       | Technology  | Procurement centres have reliable internet connectivity during operating hours                                                              | If wrong: Offline mode capability must be expanded to full procurement recording               |
| ASS-003       | Technology  | Centre devices support a modern web browser capable of QR scanning                                                                          | If wrong: External QR scanner hardware may be needed; manual lookup fallback must always exist |
| ASS-004       | Operations  | A designated officer with digital literacy can operate the centre-facing interface                                                          | If wrong: Further UI simplification and local training are required                            |
| ASS-005       | Operations  | Procurement centres will configure their slots and capacity data before going live                                                          | If wrong: System Admin must be able to bulk-import initial configuration                       |
| ASS-006       | Technology  | SMS delivery is reliable enough for time-sensitive notifications                                                                            | If wrong: Push notifications become primary; SMS becomes secondary                             |
| ASS-007       | Integration | Payment is handled via an external DBT or bank transfer system that can accept API triggers                                                 | If wrong: Manual payment initiation and tracking remain the permanent model                    |
| ASS-008       | Operations  | Minimum Support Price (MSP) rates are provided and maintained by District Admin                                                             | If wrong: Default rates or manual payment calculation needed; audit trail still required       |
| ASS-009       | Integration | Government farmer identity databases are not available for system integration in Phase 1                                                    | If assumption changes: Integration layer exists and ready for connection                       |
| ASS-010       | Technology  | Weighing machines are operated manually by officers who enter weights digitally                                                             | If wrong: IoT integration must be added; accuracy issues with manual entry must be accepted    |
| ASS-011       | Adoption    | Farmers are wiling to pre-register and book in advance if the benefit is clear                                                              | If wrong: Walk-in handling must be expanded; recommendation engine adjusted                    |
| ASS-012       | Data        | The system will have sufficient data (14+ days) to establish baselines for ETA and bottleneck detection within the first month of operation | If wrong: Default configuration values must be extended; manual configuration required         |
| ASS-013       | Operations  | District Admins have sufficient digital literacy to use the analytics dashboards                                                            | If wrong: Simplified reporting exports (Excel) may need to be the primary interface            |
| ASS-014       | Technology  | Node.js + PostgreSQL + Redis on a cloud platform is an acceptable technology stack                                                          | If wrong: Stack changes would require Phase 2 re-architecture                                  |
| ASS-015       | Business    | Crop types eligible for procurement are well-defined and stable within a season                                                             | If wrong: Crop type management must support mid-season updates with impact analysis            |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
