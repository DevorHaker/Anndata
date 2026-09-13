# 05 — MODULE BOUNDARIES & DEPENDENCY MAP

## SmartProcure: Backend Domain Module Boundaries and Dependency Architecture

---

## 1. Domain Module Directory (20 Modules)

SmartProcure comprises 20 discrete backend modules. Each module maintains strict isolation boundaries to enable future microservice extraction if necessary.

| Module Name     | Core Responsibility                                                      | Primary Database Entities Owned                  |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| `auth`          | User identity, password hashing, JWTs, sessions, OTPs                    | `users`, `user_sessions`, `otp_codes`            |
| `farmers`       | Farmer profile, land records, document uploads, produce batches          | `farmers`, `produce_batches`, `farmer_documents` |
| `centres`       | Procurement centre registry, operational status, location coordinates    | `procurement_centres`, `centre_operating_hours`  |
| `slots`         | Daily slot definitions, capacity allocation, slot windows                | `slots`, `slot_templates`                        |
| `bookings`      | Slot booking creation, rescheduling, cancellations, no-shows             | `bookings`                                       |
| `tokens`        | Cryptographic QR token generation, verification, anti-fraud invalidation | `tokens`                                         |
| `queue`         | Real-time queue ordering, arrival status, position assignments           | `queue_entries`, `queue_snapshots`               |
| `checkins`      | Scan gate verification, manual check-in overrides                        | `checkins`                                       |
| `weighments`    | Scale weighment records, tare weights, gross weights, corrections        | `weighment_records`                              |
| `quality`       | Crop inspection grades, moisture content, defect scores, overrides       | `quality_inspections`                            |
| `procurements`  | Core procurement transaction state machine, receipts                     | `procurements`, `procurement_receipts`           |
| `payments`      | Financial disbursement records, payment provider callback integration    | `payments`, `payment_logs`                       |
| `notifications` | Async dispatch of SMS, Email, Push, and In-App inbox notifications       | `notifications`, `notification_templates`        |
| `analytics`     | Operational metrics computation, throughput, congestion reporting        | `daily_centre_metrics`                           |
| `intelligence`  | Rule-based recommendations, ETA estimation, congestion engine            | `recommendation_logs`                            |
| `exceptions`    | Override workflows, hold resolutions, equipment fault tracking           | `equipment_faults`, `exception_logs`             |
| `audit`         | Immutably stored transactional audit logs                                | `audit_logs`                                     |
| `admin`         | System parameters, MSP rates, staff assignments, user suspensions        | `system_configurations`, `staff_assignments`     |
| `produce`       | Crop type master list, quality parameters, current MSP rates             | `crop_types`                                     |
| `equipment`     | Procurement centre scale and testing kit maintenance & status            | `equipment_registry`                             |

---

## 2. Module Dependency Graph

```
                                ┌───────────────┐
                                │     AUTH      │
                                └───────┬───────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼                             ▼
                 ┌──────────────┐              ┌──────────────┐
                 │   FARMERS    │              │   CENTRES    │
                 └───────┬──────┘              └───────┬──────┘
                         │                             │
                         │      ┌──────────────────────┼──────────────────────┐
                         ▼      ▼                      ▼                      ▼
                 ┌──────────────────┐          ┌──────────────┐       ┌──────────────┐
                 │     PRODUCE      │          │    SLOTS     │       │  EQUIPMENT   │
                 └───────┬──────────┘          └───────┬──────┘       └──────────────┘
                         │                             │
                         └──────────────┬──────────────┘
                                        ▼
                                ┌───────────────┐
                                │ RECOMMENDATION│ (Intelligence Module)
                                └───────┬───────┘
                                        ▼
                                ┌───────────────┐
                                │   BOOKINGS    │
                                └───────┬───────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼                             ▼
                 ┌──────────────┐              ┌──────────────┐
                 │    TOKENS    │              │   CHECKINS   │
                 └──────────────┘              └───────┬──────┘
                                                       │
                                                       ▼
                                               ┌──────────────┐
                                               │    QUEUE     │
                                               └───────┬──────┘
                                                       │
                         ┌─────────────────────────────┼─────────────────────────────┐
                         ▼                             ▼                             ▼
                 ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
                 │  WEIGHMENTS  │              │   QUALITY    │              │ EXCEPTIONS   │
                 └───────┬──────┘              └───────┬──────┘              └──────────────┘
                         │                             │
                         └──────────────┬──────────────┘
                                        ▼
                                ┌───────────────┐
                                │ PROCUREMENTS  │
                                └───────┬───────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼                             ▼
                 ┌──────────────┐              ┌──────────────┐
                 │   PAYMENTS   │              │NOTIFICATIONS │
                 └──────────────┘              └──────────────┘
```

---

## 3. Supporting Cross-Cutting Module Dependencies

- **AUDIT Module**: Depended upon by **ALL** modules for write actions (`bookings`, `procurements`, `weighments`, `payments`, `admin`). Audit depends on NO module to prevent circular loops.
- **NOTIFICATIONS Module**: Receives events from `bookings`, `queue`, `procurements`, `payments`, `exceptions`.
- **INTELLIGENCE Module**: Reads state from `queue`, `bookings`, `centres`, `slots`, and `daily_centre_metrics`. Computes outputs consumed by `recommendations` and `queue` (ETA).

---

## 4. Circular Dependency Prevention Rules

1. **Strict Upward Layering Prohibition**: Lower-level foundation modules (`auth`, `produce`, `centres`) MUST NEVER import or call higher-level workflow modules (`bookings`, `procurements`, `payments`).
2. **Event Bus Decoupling**: If Module A needs to trigger a secondary action in Module B, and Module B already depends on Module A, Module A MUST emit an asynchronous domain event (`eventBus.emit()`) rather than calling Module B's service directly.
3. **Repository Isolation**: A module repository must ONLY execute SQL queries against tables owned by that module. Cross-module data retrieval must occur via service interfaces or database views.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
