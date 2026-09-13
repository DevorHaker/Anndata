# 19 — MVP AND FUTURE ROADMAP

## SmartProcure: Feature Priority Classification and Development Roadmap

---

## 1. Priority Classification

| Priority | Label            | Definition                                                                                                      |
| -------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| P0       | **Critical MVP** | Required for a production-ready MVP. System cannot go live without these features.                              |
| P1       | **Important**    | Significantly improves the product but not blocking for initial deployment. Required within 3 months of launch. |
| P2       | **Advanced**     | Valuable features that require more development effort or data prerequisites. 3–9 months post-launch.           |
| P3       | **Future**       | Strategic features for scale, ML maturity, or external integration. 9+ months post-launch.                      |

---

## 2. Feature Priority Matrix

### 2.1 Authentication and Account Management

| Feature                                 | Priority | Rationale                 |
| --------------------------------------- | -------- | ------------------------- |
| Farmer self-registration                | P0       | Core entry point          |
| OTP-based verification                  | P0       | Identity assurance        |
| Password-based login                    | P0       | Standard authentication   |
| JWT access + refresh tokens             | P0       | Session management        |
| Forgot password / reset                 | P0       | Essential UX              |
| Account lockout                         | P0       | Security                  |
| Logout / logout-all                     | P0       | Security                  |
| Staff account creation by admin         | P0       | Operational requirement   |
| Role assignment                         | P0       | Access control foundation |
| Multi-language support for auth screens | P2       | After core stabilisation  |

---

### 2.2 Farmer Profile and Produce Management

| Feature                               | Priority | Rationale                  |
| ------------------------------------- | -------- | -------------------------- |
| Profile creation with required fields | P0       | Gateway to booking         |
| Profile completion enforcement        | P0       | Data quality gate          |
| Document upload                       | P0       | Identity verification      |
| Bank details capture (encrypted)      | P0       | Payment prerequisite       |
| Produce batch declaration             | P0       | Booking prerequisite       |
| Profile verification by admin         | P0       | Trust and compliance       |
| Farmer data export (self-service)     | P1       | Right-to-access compliance |
| Profile completeness gamification     | P3       | User engagement            |

---

### 2.3 Procurement Centre Management

| Feature                               | Priority | Rationale                   |
| ------------------------------------- | -------- | --------------------------- |
| Centre creation and management        | P0       | Core infrastructure         |
| Centre accepted crop management       | P0       | Booking filter prerequisite |
| Centre operational status management  | P0       | Live status required        |
| Centre GPS coordinates                | P0       | Recommendation engine input |
| Centre contact information (public)   | P0       | Farmer visibility           |
| Centre-level crop-price configuration | P1       | MSP enforcement             |
| Multi-language centre description     | P2       | Accessibility               |

---

### 2.4 Slot Management

| Feature                               | Priority | Rationale              |
| ------------------------------------- | -------- | ---------------------- |
| Slot definition and configuration     | P0       | Booking prerequisite   |
| Slot availability tracking            | P0       | Core capacity feature  |
| Slot cancellation                     | P0       | Exception handling     |
| Slot template reuse (recurring)       | P1       | Operational efficiency |
| Dynamic slot creation based on demand | P2       | Intelligent scheduling |
| Waitlist for full slots               | P2       | Farmer retention       |

---

### 2.5 Booking Management

| Feature                                  | Priority | Rationale                |
| ---------------------------------------- | -------- | ------------------------ |
| Create booking                           | P0       | Core feature             |
| View booking                             | P0       | Core feature             |
| Cancel booking (within cutoff)           | P0       | Farmer control           |
| Reschedule booking                       | P0       | Farmer control           |
| Duplicate booking prevention             | P0       | Data integrity           |
| Race condition protection (slot locking) | P0       | Correctness              |
| Idempotency key support                  | P0       | Double-click protection  |
| Manager cancel booking                   | P0       | Operational control      |
| No-show detection (background job)       | P0       | Operational housekeeping |
| Booking suspension after N no-shows      | P0       | Fairness enforcement     |
| No-show dispute                          | P1       | Farmer protection        |
| Booking cancellation waiting list notify | P2       | Occupancy optimisation   |

---

### 2.6 Digital Token and Check-In

| Feature                                   | Priority | Rationale                      |
| ----------------------------------------- | -------- | ------------------------------ |
| Token generation on booking               | P0       | Core feature                   |
| Token QR code display                     | P0       | Check-in mechanism             |
| QR scan validation (online)               | P0       | Core check-in                  |
| Offline QR validation (cached key)        | P0       | Centre connectivity resilience |
| Token regeneration                        | P0       | Lost token recovery            |
| Fraud detection on token reuse            | P0       | Security                       |
| Manual check-in override (manager)        | P0       | Exception handling             |
| Token sharing prevention (device binding) | P2       | Advanced anti-fraud            |

---

### 2.7 Live Queue Management

| Feature                                    | Priority | Rationale               |
| ------------------------------------------ | -------- | ----------------------- |
| Queue entry creation on check-in           | P0       | Core feature            |
| Live queue display (officer/manager)       | P0       | Operational necessity   |
| Queue ordering (FIFO within slot)          | P0       | Fairness                |
| Call next farmer                           | P0       | Operational flow        |
| Skip farmer                                | P0       | Operational flexibility |
| Queue pause / resume                       | P0       | Exception handling      |
| Late arrival grace period                  | P0       | Fairness                |
| Live farmer's queue position (farmer app)  | P0       | Core farmer value       |
| SSE-based live queue push                  | P1       | Better than polling     |
| Priority queue for medical/emergency cases | P1       | Accessibility           |

---

### 2.8 ETA and Waiting Time

| Feature                                     | Priority | Rationale                  |
| ------------------------------------------- | -------- | -------------------------- |
| Rule-based ETA calculation                  | P0       | Core farmer value          |
| ETA display on farmer dashboard             | P0       | Core farmer value          |
| ETA update on each procurement completion   | P0       | Accuracy                   |
| ETA pause on queue pause                    | P0       | Correctness                |
| Crop-type-specific processing time baseline | P1       | ETA accuracy improvement   |
| Time-of-day ETA adjustment                  | P2       | Statistical model          |
| ML-enhanced ETA model                       | P3       | Requires 6+ months of data |

---

### 2.9 Procurement Operations

| Feature                                        | Priority | Rationale            |
| ---------------------------------------------- | -------- | -------------------- |
| Procurement record creation                    | P0       | Core feature         |
| Weighing recording                             | P0       | Core feature         |
| Quality inspection recording                   | P0       | Core feature         |
| Procurement approval (standard)                | P0       | Core feature         |
| Procurement rejection with reason              | P0       | Core feature         |
| Procurement ON_HOLD                            | P0       | Exception handling   |
| High-value approval escalation                 | P0       | Control              |
| Procurement correction (weighing / inspection) | P0       | Data integrity       |
| Digital receipt generation                     | P0       | Farmer value         |
| Receipt PDF download                           | P1       | Convenience          |
| IoT weighing machine integration               | P3       | Hardware integration |

---

### 2.10 Payment

| Feature                                               | Priority | Rationale                        |
| ----------------------------------------------------- | -------- | -------------------------------- |
| Payment record creation on approval                   | P0       | Core feature                     |
| Payment status tracking                               | P0       | Core farmer value                |
| Payment notification (initiated / completed / failed) | P0       | Transparency                     |
| Payment retry mechanism                               | P0       | Reliability                      |
| Mock payment provider (development/MVP)               | P0       | Testing without real integration |
| Real payment provider integration (DBT/NEFT)          | P1       | Production payment               |
| Payment idempotency (webhook de-duplication)          | P0       | Correctness                      |
| Batch payment export                                  | P1       | Admin efficiency                 |

---

### 2.11 Notifications

| Feature                                 | Priority | Rationale                        |
| --------------------------------------- | -------- | -------------------------------- |
| In-app notification inbox               | P0       | Universal delivery               |
| SMS notifications (critical events)     | P0       | Farmer reach (SMS most reliable) |
| Email notifications (receipts, reports) | P0       | Documentation channel            |
| Push notifications                      | P1       | Real-time experience             |
| Async notification delivery (queued)    | P0       | Non-blocking                     |
| Notification retry with backoff         | P0       | Reliability                      |
| Notification templates (admin-editable) | P0       | Customisation                    |
| Provider failover                       | P1       | Resilience                       |
| User notification preferences           | P1       | UX control                       |
| Multi-language notifications            | P2       | Accessibility                    |

---

### 2.12 Recommendation Engine

| Feature                            | Priority | Rationale                        |
| ---------------------------------- | -------- | -------------------------------- |
| Rule-based recommendation engine   | P0       | Core feature                     |
| Distance scoring                   | P0       | Fundamental factor               |
| Queue depth scoring                | P0       | Fundamental factor               |
| Slot availability scoring          | P0       | Fundamental factor               |
| Equipment availability scoring     | P0       | Operational input                |
| Recommendation explanation text    | P0       | Transparency                     |
| Farmer location via GPS or pincode | P0       | Input requirement                |
| Historical congestion scoring      | P1       | Available after 14+ days of data |
| No-show-adjusted capacity scoring  | P2       | Statistical model                |
| ML-enhanced recommendation         | P3       | 6+ months of data                |

---

### 2.13 Congestion and Intelligence

| Feature                                      | Priority | Rationale                           |
| -------------------------------------------- | -------- | ----------------------------------- |
| Congestion detection (real-time)             | P0       | Manager safety net                  |
| Congestion alerts (yellow/red)               | P0       | Manager and District Admin alerting |
| Bottleneck detection                         | P1       | Operational efficiency              |
| Cross-centre load balancing suggestions      | P1       | District-level efficiency           |
| Congestion prediction (rule-based hints)     | P1       | Proactive management                |
| Statistical congestion prediction            | P2       | Requires 90+ days of data           |
| No-show risk scoring                         | P2       | Requires 60+ days of data           |
| ML-based congestion prediction               | P3       | Production ML pipeline              |
| Dynamic capacity auto-adjustment (ML-driven) | P3       | Mature ML phase                     |

---

### 2.14 Equipment and Staff Management

| Feature                                    | Priority | Rationale                      |
| ------------------------------------------ | -------- | ------------------------------ |
| Equipment registry                         | P0       | Operational requirement        |
| Equipment status management                | P0       | Operational necessity          |
| Equipment downtime tracking                | P0       | Analytics input                |
| Equipment failure → capacity recalculation | P0       | Correctness                    |
| Maintenance records                        | P1       | Long-term equipment management |
| Staff assignment to centre                 | P0       | Operational access control     |
| Staff attendance recording                 | P1       | Capacity and analytics         |
| Staff performance metrics                  | P2       | Advanced analytics             |

---

### 2.15 Audit and Administration

| Feature                                | Priority | Rationale               |
| -------------------------------------- | -------- | ----------------------- |
| Audit log for all sensitive operations | P0       | Compliance and security |
| Audit log immutability                 | P0       | Tamper-evidence         |
| Audit log query and export             | P0       | Usability               |
| System configuration management        | P0       | Operational flexibility |
| Background job management              | P0       | Reliability             |
| System health dashboard (admin)        | P1       | Observability           |
| Security event dashboard               | P1       | Security operations     |

---

## 3. MVP Scope Summary

**The production-ready MVP must include the complete core journey:**

```
REGISTER → PROFILE → PRODUCE → RECOMMEND → BOOK → TOKEN → CHECK-IN → QUEUE → WEIGH → INSPECT → DECIDE → RECEIPT → PAYMENT_TRACK
```

With supporting:

- 5 user roles fully implemented
- Congestion detection
- No-show management
- Audit logging
- In-app + SMS notifications
- Equipment and staff management (basic)
- Rule-based recommendation engine
- Mock payment (real integration Phase 2)
- Basic analytics dashboards (all roles)

---

## 4. Development Phase Roadmap

### Phase 1 (Current): Requirements and Architecture

- **Duration:** 2–4 weeks
- **Output:** All 22 Phase 1 documents; architecture decision records; Phase 2 planning

### Phase 2: MVP Development

- **Duration:** 12–16 weeks
- **Includes:** All P0 features; basic analytics; mock integrations; deployed to staging

### Phase 3: MVP Hardening and P1 Features

- **Duration:** 6–8 weeks
- **Includes:** All P1 features; real SMS and email providers; real payment integration; pilot with 1–2 centres

### Phase 4: Statistical Intelligence + P2 Features

- **Duration:** 8–12 weeks
- **Trigger:** 90+ days of production data available
- **Includes:** Statistical models for ETA, congestion, no-show; multi-language; full load balancing

### Phase 5: ML Intelligence + P3 Features

- **Duration:** 12+ weeks
- **Trigger:** 6+ months of data; validated model baselines
- **Includes:** ML recommendation engine; ML congestion prediction; IoT weighing integration; government database integration (if authorised)

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
