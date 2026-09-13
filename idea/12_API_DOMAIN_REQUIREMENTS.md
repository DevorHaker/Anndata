# 12 — API DOMAIN REQUIREMENTS

## SmartProcure: Preliminary API Structure and Domain Specifications

_Phase 1 defines API domains, resources, operations, and access control. Full API specification (OpenAPI) is a Phase 2 deliverable._

---

## 1. Global API Conventions

| Convention     | Definition                                                              |
| -------------- | ----------------------------------------------------------------------- |
| Base URL       | `/api/v1/`                                                              |
| Authentication | Bearer JWT token in `Authorization` header                              |
| Versioning     | URL path versioning (`/v1/`, `/v2/`)                                    |
| Format         | JSON request/response bodies                                            |
| Date/Time      | ISO 8601 UTC throughout                                                 |
| Error Format   | `{ "error": { "code": "string", "message": "string", "details": {} } }` |
| Pagination     | Cursor-based for large collections; `?cursor=X&limit=Y`                 |
| Rate Limiting  | HTTP 429 with `Retry-After` header                                      |
| Request ID     | Every request assigned `X-Request-ID` header; echoed in response        |
| Idempotency    | POST endpoints accept `Idempotency-Key` header for safe retries         |

---

## 2. Authentication Domain — `/api/v1/auth`

**Purpose:** User authentication, session management, and password operations.

| Endpoint                  | Method | Description                     | Auth Required           | Roles             |
| ------------------------- | ------ | ------------------------------- | ----------------------- | ----------------- |
| `/auth/register`          | POST   | Farmer self-registration        | No                      | Public            |
| `/auth/verify-otp`        | POST   | Verify registration/login OTP   | No                      | Public            |
| `/auth/login`             | POST   | Password-based login            | No                      | Public            |
| `/auth/login/otp-request` | POST   | Request OTP for login           | No                      | Public            |
| `/auth/refresh`           | POST   | Refresh access token            | No (uses refresh token) | Authenticated     |
| `/auth/logout`            | POST   | Invalidate current session      | Yes                     | All               |
| `/auth/logout-all`        | POST   | Invalidate all sessions         | Yes                     | All               |
| `/auth/forgot-password`   | POST   | Initiate password reset         | No                      | Public            |
| `/auth/reset-password`    | POST   | Complete password reset         | No                      | Public (with OTP) |
| `/auth/change-password`   | POST   | Change password (authenticated) | Yes                     | All               |

**Security Notes:**

- Login failure responses must be identical in timing and content for existing vs non-existing accounts (timing attack prevention)
- OTP endpoints are rate-limited to 3 requests per phone per 10 minutes

---

## 3. Farmer Domain — `/api/v1/farmers`

**Purpose:** Farmer profile management, produce declaration, and document handling.

| Endpoint                      | Method | Description                                            | Auth Required | Roles                                          |
| ----------------------------- | ------ | ------------------------------------------------------ | ------------- | ---------------------------------------------- |
| `/farmers/profile`            | GET    | Get own profile                                        | Yes           | FARMER                                         |
| `/farmers/profile`            | PUT    | Update own profile                                     | Yes           | FARMER                                         |
| `/farmers/profile/completion` | GET    | Get profile completion status                          | Yes           | FARMER                                         |
| `/farmers/documents`          | POST   | Upload identity document                               | Yes           | FARMER                                         |
| `/farmers/documents/:id`      | DELETE | Remove a document                                      | Yes           | FARMER                                         |
| `/farmers/produce`            | GET    | List own produce batches                               | Yes           | FARMER                                         |
| `/farmers/produce`            | POST   | Add produce batch                                      | Yes           | FARMER                                         |
| `/farmers/produce/:id`        | PUT    | Update produce batch                                   | Yes           | FARMER                                         |
| `/farmers/produce/:id`        | DELETE | Remove produce batch (if not linked to active booking) | Yes           | FARMER                                         |
| `/farmers/:id`                | GET    | Get farmer details (officer/manager view)              | Yes           | OFFICER, MANAGER, DISTRICT_ADMIN, SYSTEM_ADMIN |
| `/farmers`                    | GET    | List all farmers (admin view, paginated)               | Yes           | SYSTEM_ADMIN                                   |

---

## 4. Centres Domain — `/api/v1/centres`

**Purpose:** Procurement centre registry and status management.

| Endpoint                | Method | Description                             | Auth Required | Roles                                 |
| ----------------------- | ------ | --------------------------------------- | ------------- | ------------------------------------- |
| `/centres`              | GET    | List all active centres (public filter) | No            | Public (limited fields)               |
| `/centres/:id`          | GET    | Get centre details                      | No            | Public                                |
| `/centres/:id/status`   | GET    | Get real-time centre status             | No            | Public                                |
| `/centres/:id/capacity` | GET    | Get capacity and availability           | No            | Public                                |
| `/centres`              | POST   | Create new centre                       | Yes           | SYSTEM_ADMIN                          |
| `/centres/:id`          | PUT    | Update centre details                   | Yes           | MANAGER (own centre), SYSTEM_ADMIN    |
| `/centres/:id/status`   | PATCH  | Update operational status               | Yes           | MANAGER, DISTRICT_ADMIN, SYSTEM_ADMIN |
| `/centres/:id/crops`    | GET    | List accepted crops                     | No            | Public                                |
| `/centres/:id/crops`    | PUT    | Update accepted crops list              | Yes           | MANAGER, SYSTEM_ADMIN                 |

---

## 5. Produce / Crops Domain — `/api/v1/produce`

**Purpose:** System crop type master list management.

| Endpoint                  | Method | Description             | Auth Required | Roles        |
| ------------------------- | ------ | ----------------------- | ------------- | ------------ |
| `/produce/crop-types`     | GET    | List all crop types     | No            | Public       |
| `/produce/crop-types/:id` | GET    | Single crop type detail | No            | Public       |
| `/produce/crop-types`     | POST   | Create crop type        | Yes           | SYSTEM_ADMIN |
| `/produce/crop-types/:id` | PUT    | Update crop type        | Yes           | SYSTEM_ADMIN |
| `/produce/crop-types/:id` | DELETE | Deactivate crop type    | Yes           | SYSTEM_ADMIN |

---

## 6. Recommendations Domain — `/api/v1/recommendations`

**Purpose:** Centre and slot recommendation generation.

| Endpoint                      | Method | Description                           | Auth Required | Roles  |
| ----------------------------- | ------ | ------------------------------------- | ------------- | ------ |
| `/recommendations`            | POST   | Request recommendations               | Yes           | FARMER |
| `/recommendations/:id`        | GET    | Get specific recommendation result    | Yes           | FARMER |
| `/recommendations/:id/accept` | POST   | Record farmer accepted recommendation | Yes           | FARMER |

**Input for POST `/recommendations`:**

```json
{
  "crop_type_id": "uuid",
  "produce_batch_id": "uuid",
  "preferred_date": "YYYY-MM-DD",
  "location": {
    "latitude": 22.3,
    "longitude": 77.4
  },
  "fallback_district": "string (if location not available)"
}
```

---

## 7. Slots Domain — `/api/v1/slots`

**Purpose:** Slot definition, availability, and management.

| Endpoint     | Method | Description                          | Auth Required | Roles   |
| ------------ | ------ | ------------------------------------ | ------------- | ------- |
| `/slots`     | GET    | List slots (filter by centre, date)  | No            | Public  |
| `/slots/:id` | GET    | Single slot detail with availability | No            | Public  |
| `/slots`     | POST   | Create slot definition               | Yes           | MANAGER |
| `/slots/:id` | PUT    | Update slot                          | Yes           | MANAGER |
| `/slots/:id` | DELETE | Cancel slot                          | Yes           | MANAGER |

---

## 8. Bookings Domain — `/api/v1/bookings`

**Purpose:** Booking creation, retrieval, cancellation, and rescheduling.

| Endpoint                         | Method | Description                          | Auth Required | Roles                                  |
| -------------------------------- | ------ | ------------------------------------ | ------------- | -------------------------------------- |
| `/bookings`                      | POST   | Create new booking                   | Yes           | FARMER                                 |
| `/bookings`                      | GET    | List own bookings                    | Yes           | FARMER                                 |
| `/bookings/:id`                  | GET    | Get booking detail                   | Yes           | FARMER (own), OFFICER/MANAGER (centre) |
| `/bookings/:id/cancel`           | POST   | Cancel booking                       | Yes           | FARMER (own), MANAGER                  |
| `/bookings/:id/reschedule`       | POST   | Reschedule booking                   | Yes           | FARMER (own), MANAGER                  |
| `/bookings/centre/:centreId`     | GET    | List all bookings for centre by date | Yes           | OFFICER, MANAGER                       |
| `/bookings/:id/token`            | GET    | Get token for booking                | Yes           | FARMER (own)                           |
| `/bookings/:id/token/regenerate` | POST   | Regenerate token                     | Yes           | FARMER (own)                           |

**Idempotency Note:** Booking creation endpoint MUST accept `Idempotency-Key` header. Same key = same booking returned without creating a new one.

---

## 9. Tokens Domain — `/api/v1/tokens`

**Purpose:** Token validation and status (internal and officer-facing).

| Endpoint                 | Method | Description                 | Auth Required | Roles                 |
| ------------------------ | ------ | --------------------------- | ------------- | --------------------- |
| `/tokens/:bookingId`     | GET    | Get token for a booking     | Yes           | FARMER (own)          |
| `/tokens/validate`       | POST   | Validate a token (QR scan)  | Yes           | OFFICER, MANAGER      |
| `/tokens/:id/invalidate` | POST   | Invalidate a token manually | Yes           | MANAGER, SYSTEM_ADMIN |

**POST `/tokens/validate` Input:**

```json
{
  "token_payload": "base64_encoded_signed_token",
  "centre_id": "uuid"
}
```

---

## 10. Queue Domain — `/api/v1/queue`

**Purpose:** Live queue state and management.

| Endpoint                         | Method | Description                             | Auth Required | Roles                                        |
| -------------------------------- | ------ | --------------------------------------- | ------------- | -------------------------------------------- |
| `/queue/centre/:centreId`        | GET    | Get full live queue                     | Yes           | OFFICER, MANAGER                             |
| `/queue/centre/:centreId/stream` | GET    | Server-sent event stream for live queue | Yes           | OFFICER, MANAGER, FARMER (own position only) |
| `/queue/position/:farmerId`      | GET    | Get farmer's queue position and ETA     | Yes           | FARMER (own), OFFICER, MANAGER               |
| `/queue/:entryId/call`           | POST   | Call next farmer                        | Yes           | OFFICER, MANAGER                             |
| `/queue/:entryId/skip`           | POST   | Skip farmer                             | Yes           | OFFICER, MANAGER                             |
| `/queue/centre/:centreId/pause`  | POST   | Pause queue                             | Yes           | MANAGER                                      |
| `/queue/centre/:centreId/resume` | POST   | Resume queue                            | Yes           | MANAGER                                      |

---

## 11. Check-Ins Domain — `/api/v1/checkins`

**Purpose:** Farmer check-in processing and history.

| Endpoint                     | Method | Description                       | Auth Required | Roles            |
| ---------------------------- | ------ | --------------------------------- | ------------- | ---------------- |
| `/checkins`                  | POST   | Process check-in (QR scan result) | Yes           | OFFICER, MANAGER |
| `/checkins/manual`           | POST   | Manual check-in (override)        | Yes           | MANAGER          |
| `/checkins/centre/:centreId` | GET    | Today's check-in list             | Yes           | OFFICER, MANAGER |
| `/checkins/:id`              | GET    | Check-in detail                   | Yes           | OFFICER, MANAGER |

---

## 12. Weighments Domain — `/api/v1/weighments`

**Purpose:** Weighing record creation and correction.

| Endpoint                                 | Method | Description                      | Auth Required | Roles                          |
| ---------------------------------------- | ------ | -------------------------------- | ------------- | ------------------------------ |
| `/weighments`                            | POST   | Record weighment                 | Yes           | OFFICER, MANAGER               |
| `/weighments/:id`                        | GET    | Get weighment record             | Yes           | OFFICER, MANAGER, FARMER (own) |
| `/weighments/:id/correct`                | POST   | Submit correction                | Yes           | OFFICER, MANAGER               |
| `/weighments/procurement/:procurementId` | GET    | All weighments for a procurement | Yes           | OFFICER, MANAGER               |

---

## 13. Quality Domain — `/api/v1/quality`

**Purpose:** Quality inspection record management.

| Endpoint                | Method | Description                              | Auth Required | Roles                          |
| ----------------------- | ------ | ---------------------------------------- | ------------- | ------------------------------ |
| `/quality`              | POST   | Record quality inspection                | Yes           | OFFICER, MANAGER               |
| `/quality/:id`          | GET    | Get inspection record                    | Yes           | OFFICER, MANAGER, FARMER (own) |
| `/quality/:id/override` | POST   | Override failed inspection (with reason) | Yes           | MANAGER                        |
| `/quality/:id/correct`  | POST   | Submit correction                        | Yes           | OFFICER, MANAGER               |

---

## 14. Procurements Domain — `/api/v1/procurements`

**Purpose:** Procurement workflow management.

| Endpoint                         | Method | Description                      | Auth Required | Roles                              |
| -------------------------------- | ------ | -------------------------------- | ------------- | ---------------------------------- |
| `/procurements`                  | POST   | Initiate procurement             | Yes           | OFFICER, MANAGER                   |
| `/procurements/:id`              | GET    | Get procurement detail           | Yes           | OFFICER, MANAGER, FARMER (own)     |
| `/procurements/:id/approve`      | POST   | Approve procurement              | Yes           | OFFICER (below threshold), MANAGER |
| `/procurements/:id/reject`       | POST   | Reject procurement               | Yes           | OFFICER, MANAGER                   |
| `/procurements/:id/hold`         | POST   | Place on hold                    | Yes           | OFFICER, MANAGER                   |
| `/procurements/:id/resolve-hold` | POST   | Resolve hold                     | Yes           | MANAGER                            |
| `/procurements/centre/:centreId` | GET    | List centre procurements by date | Yes           | OFFICER, MANAGER                   |
| `/procurements/:id/receipt`      | GET    | Get digital receipt              | Yes           | FARMER (own), OFFICER, MANAGER     |

---

## 15. Payments Domain — `/api/v1/payments`

**Purpose:** Payment record tracking and management.

| Endpoint                               | Method | Description                         | Auth Required       | Roles                                 |
| -------------------------------------- | ------ | ----------------------------------- | ------------------- | ------------------------------------- |
| `/payments/:id`                        | GET    | Get payment record                  | Yes                 | FARMER (own), MANAGER, DISTRICT_ADMIN |
| `/payments/procurement/:procurementId` | GET    | Get payment for procurement         | Yes                 | FARMER (own), OFFICER, MANAGER        |
| `/payments/:id/initiate`               | POST   | Initiate payment                    | Yes                 | MANAGER                               |
| `/payments/:id/confirm`                | POST   | Confirm payment (manual or webhook) | Yes                 | MANAGER, SYSTEM (webhook)             |
| `/payments/:id/fail`                   | POST   | Mark payment as failed              | Yes                 | SYSTEM (webhook), MANAGER             |
| `/payments/:id/retry`                  | POST   | Manual retry                        | Yes                 | MANAGER                               |
| `/payments/webhook`                    | POST   | Payment provider callback           | No (HMAC signature) | Payment Provider                      |
| `/payments/centre/:centreId`           | GET    | Centre payment summary              | Yes                 | MANAGER                               |

---

## 16. Notifications Domain — `/api/v1/notifications`

**Purpose:** Notification inbox and delivery status.

| Endpoint                       | Method | Description                   | Auth Required | Roles        |
| ------------------------------ | ------ | ----------------------------- | ------------- | ------------ |
| `/notifications`               | GET    | Get own notifications (inbox) | Yes           | All          |
| `/notifications/:id`           | GET    | Single notification           | Yes           | Own only     |
| `/notifications/:id/read`      | PATCH  | Mark as read                  | Yes           | Own only     |
| `/notifications/unread-count`  | GET    | Unread notification count     | Yes           | All          |
| `/notifications/admin`         | GET    | Admin notification management | Yes           | SYSTEM_ADMIN |
| `/notifications/templates`     | GET    | List notification templates   | Yes           | SYSTEM_ADMIN |
| `/notifications/templates/:id` | PUT    | Edit notification template    | Yes           | SYSTEM_ADMIN |

---

## 17. Analytics Domain — `/api/v1/analytics`

**Purpose:** Operational metrics and reporting data for all dashboard views.

| Endpoint                                   | Method | Description                 | Auth Required | Roles                                 |
| ------------------------------------------ | ------ | --------------------------- | ------------- | ------------------------------------- |
| `/analytics/farmer/summary`                | GET    | Farmer's personal analytics | Yes           | FARMER                                |
| `/analytics/centre/:centreId/live`         | GET    | Live operational metrics    | Yes           | OFFICER, MANAGER                      |
| `/analytics/centre/:centreId/daily`        | GET    | Daily summary report        | Yes           | MANAGER                               |
| `/analytics/centre/:centreId/trends`       | GET    | Historical trend data       | Yes           | MANAGER                               |
| `/analytics/district/:districtId/overview` | GET    | District aggregated metrics | Yes           | DISTRICT_ADMIN                        |
| `/analytics/district/:districtId/centres`  | GET    | Per-centre comparison       | Yes           | DISTRICT_ADMIN                        |
| `/analytics/system`                        | GET    | Platform-wide metrics       | Yes           | SYSTEM_ADMIN                          |
| `/analytics/export`                        | POST   | Export report (CSV/PDF)     | Yes           | MANAGER, DISTRICT_ADMIN, SYSTEM_ADMIN |

---

## 18. Admin Domain — `/api/v1/admin`

**Purpose:** System administration operations.

| Endpoint                          | Method | Description               | Auth Required | Roles        |
| --------------------------------- | ------ | ------------------------- | ------------- | ------------ |
| `/admin/users`                    | GET    | List all users            | Yes           | SYSTEM_ADMIN |
| `/admin/users/:id`                | GET    | Get user detail           | Yes           | SYSTEM_ADMIN |
| `/admin/users/:id`                | PUT    | Edit user                 | Yes           | SYSTEM_ADMIN |
| `/admin/users/:id/suspend`        | POST   | Suspend user              | Yes           | SYSTEM_ADMIN |
| `/admin/users/:id/activate`       | POST   | Activate user             | Yes           | SYSTEM_ADMIN |
| `/admin/users/:id/reset-password` | POST   | Force password reset      | Yes           | SYSTEM_ADMIN |
| `/admin/users/:id/role`           | PATCH  | Change user role          | Yes           | SYSTEM_ADMIN |
| `/admin/config`                   | GET    | Get all configurations    | Yes           | SYSTEM_ADMIN |
| `/admin/config/:key`              | PUT    | Update configuration      | Yes           | SYSTEM_ADMIN |
| `/admin/jobs`                     | GET    | Background job status     | Yes           | SYSTEM_ADMIN |
| `/admin/jobs/:id/trigger`         | POST   | Manually trigger job      | Yes           | SYSTEM_ADMIN |
| `/admin/integrations`             | GET    | Integration health status | Yes           | SYSTEM_ADMIN |

---

## 19. Audit Domain — `/api/v1/audit`

**Purpose:** Audit log access.

| Endpoint          | Method | Description                   | Auth Required | Roles                                          |
| ----------------- | ------ | ----------------------------- | ------------- | ---------------------------------------------- |
| `/audit/logs`     | GET    | Query audit logs with filters | Yes           | MANAGER (centre), DISTRICT_ADMIN, SYSTEM_ADMIN |
| `/audit/logs/:id` | GET    | Get single audit event        | Yes           | MANAGER (centre), SYSTEM_ADMIN                 |
| `/audit/export`   | POST   | Export audit logs             | Yes           | DISTRICT_ADMIN, SYSTEM_ADMIN                   |

**Filter Parameters for `/audit/logs`:**

- `actor_id`: Filter by actor
- `entity_type`: Filter by entity type (BOOKING, PROCUREMENT, etc.)
- `entity_id`: Filter by specific entity
- `action`: Filter by action type
- `from_date` / `to_date`: Date range
- `centre_id`: Centre scope filter

---

## 20. Health and Monitoring — `/api/v1/health`

**Purpose:** System health checks for infrastructure monitoring.

| Endpoint           | Method | Description                             | Auth Required      |
| ------------------ | ------ | --------------------------------------- | ------------------ |
| `/health`          | GET    | Basic liveness check                    | No                 |
| `/health/ready`    | GET    | Readiness check (DB + Redis accessible) | No                 |
| `/health/detailed` | GET    | Full service health status              | Yes (SYSTEM_ADMIN) |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
