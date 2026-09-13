# 04 — BACKEND ARCHITECTURE

## SmartProcure: Modular Monolith Node.js + Express Backend Architecture

---

## 1. Modular Monolith Architectural Pattern

SmartProcure backend is implemented as a **Modular Monolith** in Node.js using Express.js. All business domain capabilities are encapsulated within self-contained modules under `src/modules/`.

```
backend/
├── src/
│   ├── config/                 # Environment variables, database, redis, app config
│   │   ├── env.js              # Enforced environment schema (Zod)
│   │   ├── database.js         # PostgreSQL connection pool (pg/Knex)
│   │   ├── redis.js            # Redis client singleton
│   │   └── logger.js           # Pino structured logger
│   ├── middleware/             # Global HTTP middleware
│   │   ├── requestId.js        # Attaches X-Request-ID
│   │   ├── authenticate.js     # JWT verification & session check
│   │   ├── authorize.js        # RBAC role & resource scope check
│   │   ├── validate.js         # Zod request validation wrapper
│   │   ├── rateLimiter.js      # Redis-backed rate limiting
│   │   └── errorHandler.js     # Global HTTP error responder
│   ├── modules/                # Domain-bounded business modules
│   │   ├── auth/               # Auth endpoints, login, OTP, tokens
│   │   ├── farmers/            # Profiles, documents, produce
│   │   ├── centres/            # Centre registry, status, capacity
│   │   ├── slots/              # Slot scheduling & capacity allocation
│   │   ├── bookings/           # Concurrency-safe slot booking
│   │   ├── tokens/             # Cryptographic QR token generation & check-in
│   │   ├── queue/              # Live queue management & ETA
│   │   ├── weighments/         # Weighing machine records & corrections
│   │   ├── quality/            # Quality inspection & overrides
│   │   ├── procurements/       # Core procurement workflow state machine
│   │   ├── payments/           # Financial tracking & payment retries
│   │   ├── notifications/      # SMS, Email, Push dispatchers
│   │   ├── analytics/          # Real-time metrics & report rollups
│   │   ├── intelligence/       # Recommendation & congestion engines
│   │   ├── audit/              # Immutable transactional audit logs
│   │   └── admin/              # User management & configuration
│   ├── database/               # PostgreSQL migrations & seeds
│   │   ├── migrations/         # Numbered migration scripts
│   │   └── seeds/              # Environment seed data
│   ├── jobs/                   # BullMQ background workers & processors
│   │   ├── queueWorker.js
│   │   ├── notificationWorker.js
│   │   └── noShowWorker.js
│   ├── integrations/           # External provider adapters
│   │   ├── sms/                # SMS adapter interface & providers (Twilio/Mock)
│   │   ├── email/              # Email adapter interface & providers (SES/Mock)
│   │   ├── payment/            # Payment gateway interface & stubs
│   │   └── storage/            # Object storage adapter (S3/MinIO)
│   ├── realtime/               # Socket.IO WebSocket server & room management
│   │   ├── socketServer.js
│   │   └── handlers/
│   ├── utils/                  # Cryptography, math, date formatters
│   ├── app.js                  # Express app setup (middleware & module registration)
│   └── server.js               # HTTP server entry point & shutdown handlers
```

---

## 2. Layered Module Structure & Responsibilities

Each domain module strictly adheres to a 4-tier layered architecture:

```
module/
├── [module].routes.js          # Route declarations & middleware bindings
├── [module].controller.js      # HTTP request/response parsing & status codes
├── [module].service.js         # Pure business logic, FSM transitions, transaction management
├── [module].repository.js      # Data access layer (PostgreSQL queries)
├── [module].schema.js          # Zod validation schemas for requests
└── [module].events.js          # Module domain event emitters
```

### Layer Responsibility Definitions

1. **Routes Layer (`*.routes.js`)**: Maps HTTP verbs and paths to controller functions. Applies auth, RBAC, scope injection, rate limiting, and Zod validation middleware. Zero business logic.
2. **Controller Layer (`*.controller.js`)**: Extracts parameters (`req.params`, `req.query`, `req.body`, `req.user`). Invokes domain services. Converts service results into standardized HTTP responses (`{ success: true, data, meta }`). Handles HTTP error mapping. Business logic is strictly prohibited.
3. **Service Layer (`*.service.js`)**: The core domain powerhouse. Executes business rules, orchestrates state transitions, manages database transactions (`BEGIN...COMMIT`), triggers internal events, and enforces invariant logic. Independent of HTTP headers or req/res objects.
4. **Repository Layer (`*.repository.js`)**: Encapsulates raw database queries (Knex/SQL). Handles SQL parameters, index execution, and data mapping to domain entities. Contains no business validation or authorization checks.

---

## 3. Standard Module Execution Template

```javascript
// Example: Bookings Service Layer Transaction (bookings.service.js)
import { db } from "../../config/database";
import { bookingsRepository } from "./bookings.repository";
import { slotsRepository } from "../slots/slots.repository";
import { tokensService } from "../tokens/tokens.service";
import { auditService } from "../audit/audit.service";
import { eventBus } from "../../events/eventBus";

export const bookingsService = {
  async createBooking({
    farmerId,
    centreId,
    slotId,
    cropTypeId,
    declaredWeightKg,
    actorInfo,
  }) {
    // Execute inside atomical DB transaction
    return await db.transaction(async (trx) => {
      // 1. Concurrency-Safe Slot Capacity Decrement with Row Locking
      const slotUpdated = await slotsRepository.decrementAvailableCapacity(
        slotId,
        trx,
      );
      if (!slotUpdated) {
        throw new BusinessRuleError(
          "SLOT_FULL",
          "Selected slot has no remaining capacity",
        );
      }

      // 2. Insert Booking Record
      const booking = await bookingsRepository.create(
        {
          farmerId,
          centreId,
          slotId,
          cropTypeId,
          declaredWeightKg,
          status: "CONFIRMED",
        },
        trx,
      );

      // 3. Generate Cryptographic Token
      const token = await tokensService.generateTokenForBooking(
        booking.id,
        trx,
      );

      // 4. Record Immutable Audit Event
      await auditService.log(
        {
          actorId: actorInfo.userId,
          actorRole: actorInfo.role,
          action: "BOOKING_CREATED",
          entityType: "BOOKING",
          entityId: booking.id,
          afterState: booking,
          ipAddress: actorInfo.ip,
        },
        trx,
      );

      // 5. Emit Domain Event (Dispatched Post-Commit)
      trx.on("commit", () => {
        eventBus.emit("BOOKING_CONFIRMED", { bookingId: booking.id, farmerId });
      });

      return { booking, token };
    });
  },
};
```

---

## 4. Module Decoupling via Event Bus

Modules must not directly call repository methods of other modules. Inter-module integration occurs through:

1. Direct Service interfaces (for synchronous transactional calls, e.g., BookingService calling TokenService).
2. Domain Events (for asynchronous or multi-module reactions, e.g., BookingConfirmed -> NotificationWorker + AnalyticsWorker).

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
