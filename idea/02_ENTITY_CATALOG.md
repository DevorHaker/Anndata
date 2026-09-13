# 02 — MASTER ENTITY CATALOG

## SmartProcure: Comprehensive Relational Domain Entity Inventory

---

## 1. Domain Entity Inventory (38 Core Entities)

SmartProcure organizes its database design into 13 logical domain modules comprising 38 production entities:

| Domain            | Entity Name              | Purpose / Primary Responsibility                                 | Ownership            |
| ----------------- | ------------------------ | ---------------------------------------------------------------- | -------------------- |
| **IDENTITY**      | `users`                  | Core user identity, credentials, role reference, active status   | Auth Service         |
| **IDENTITY**      | `roles`                  | Master system roles (`FARMER`, `OFFICER`, `MANAGER`, etc.)       | System Admin         |
| **IDENTITY**      | `permissions`            | Granular permission strings (`booking:create`, `weighment:edit`) | System Admin         |
| **IDENTITY**      | `role_permissions`       | Junction mapping roles to granular permissions                   | System Admin         |
| **IDENTITY**      | `user_sessions`          | Active JWT refresh session tracking & device metadata            | Auth Service         |
| **FARMER**        | `farmers`                | Farmer business entity, reference ID, verification status        | Farmer / Admin       |
| **FARMER**        | `farmer_profiles`        | Personal profile details, address, village, district             | Farmer               |
| **FARMER**        | `farmer_bank_accounts`   | Encrypted bank disbursement details (Account, IFSC)              | Farmer / Manager     |
| **FARMER**        | `farmer_documents`       | Verification document metadata (S3 key, verification status)     | Farmer / Manager     |
| **PRODUCE**       | `crop_types`             | Master list of agricultural commodities (Wheat, Paddy, Maize)    | System Admin         |
| **PRODUCE**       | `crop_varieties`         | Sub-varieties per crop type with quality threshold defaults      | System Admin         |
| **PRODUCE**       | `msp_rates`              | Minimum Support Price history per crop type and harvest season   | System Admin         |
| **PRODUCE**       | `farmer_produce`         | Farmer declared crop holdings, estimated yield, acreage          | Farmer               |
| **CENTRE**        | `procurement_centres`    | Procurement centre registry, location coordinates, status        | District / Sys Admin |
| **CENTRE**        | `centre_operating_hours` | Weekly schedule, daily opening/closing times per centre          | Centre Manager       |
| **CENTRE**        | `centre_supported_crops` | Supported crops and daily intake quotas per centre               | Centre Manager       |
| **CENTRE**        | `centre_staff`           | Staff assignment junction linking users to centres               | District / Sys Admin |
| **CENTRE**        | `equipment_registry`     | Weighbridge, moisture meters, scanner devices per centre         | Centre Manager       |
| **SCHEDULING**    | `slots`                  | Time windows, daily slot definitions, booking capacity           | Centre Manager       |
| **SCHEDULING**    | `bookings`               | Slot reservation records, declared weight, booking state         | Farmer               |
| **SCHEDULING**    | `booking_events`         | Immutable historical state transition log for bookings           | System Event         |
| **TOKEN / QUEUE** | `tokens`                 | Cryptographic QR token definitions & validation state            | Token Service        |
| **TOKEN / QUEUE** | `checkins`               | Scan gate verification records & arrival metadata                | Officer / Gate       |
| **TOKEN / QUEUE** | `queue_entries`          | Active live queue position, status (`WAITING`, `CALLED`)         | Queue Engine         |
| **TOKEN / QUEUE** | `queue_events`           | Immutable historical log of queue state transitions              | Queue Engine         |
| **PROCUREMENT**   | `weighment_records`      | Scale tare, gross, net weight readings & corrections             | Officer / Manager    |
| **PROCUREMENT**   | `quality_inspections`    | Moisture %, defect scores, quality grade, override logs          | Officer / Manager    |
| **PROCUREMENT**   | `procurements`           | Core procurement transaction, final weight, payable amount       | Manager              |
| **PAYMENT**       | `payments`               | Financial disbursement records, payment status, UTR              | Payment Engine       |
| **PAYMENT**       | `payment_events`         | Immutable payment state transition history & callbacks           | Payment Engine       |
| **NOTIFICATION**  | `notifications`          | In-app inbox messages & notification history                     | Notification Engine  |
| **NOTIFICATION**  | `notification_logs`      | Provider dispatch attempts (SMS, Email) & delivery status        | Async Worker         |
| **INTELLIGENCE**  | `recommendation_logs`    | Generated centre recommendations, scoring factors, choices       | Intel Engine         |
| **INTELLIGENCE**  | `centre_congestion_logs` | Periodic congestion index snapshots & alert triggers             | Intel Engine         |
| **EXCEPTIONS**    | `operational_exceptions` | Holds, equipment failures, manual override requests              | Manager / Officer    |
| **AUDIT**         | `audit_logs`             | Immutable transactional audit records for sensitive actions      | All Services         |
| **SYSTEM**        | `system_configurations`  | Dynamic system parameters (grace periods, MSP, retries)          | System Admin         |
| **SYSTEM**        | `idempotency_records`    | Storage for API idempotency keys & cached responses              | API Gateway          |

---

## 2. Combined / Streamlined Entities Rationale

1. **Combined `farmers` + `farmer_profiles`**: Splitting identity (`users`), business reference (`farmers`), and extended demographic profiles (`farmer_profiles`) ensures clean RBAC authorization without loading heavy text metadata during simple JWT checks.
2. **Unified `procurements` Hub**: Connects `weighment_records` and `quality_inspections` into a single canonical procurement transaction rather than duplicating commodity values across separate tables.
3. **Dedicated Event History Tables**: Separating active transactional tables (`bookings`, `queue_entries`, `payments`) from their event history tables (`booking_events`, `queue_events`, `payment_events`) maintains sub-millisecond query performance on active operational queries.

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
