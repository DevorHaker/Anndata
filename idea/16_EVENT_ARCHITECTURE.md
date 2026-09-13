# 16 — DOMAIN EVENT ARCHITECTURE

## SmartProcure: Event Catalog, Producer/Consumer Specs, and Internal Event Bus

---

## 1. Domain Event Philosophy

Internal decoupling between modules is achieved using explicit **Domain Events**.

- **In-Memory Propagation**: Node.js `EventEmitter` handles synchronous, intra-process domain events within the backend monolith.
- **Out-of-Process Propagation**: Redis Pub/Sub handles distribution to Socket.IO real-time gateways and BullMQ background workers.

---

## 2. Master Domain Event Registry

| Event Name                | Producer Module | Key Payload Attributes                         | Consumer Modules                       | Audit Log Required? |
| ------------------------- | --------------- | ---------------------------------------------- | -------------------------------------- | ------------------- |
| `USER_REGISTERED`         | `auth`          | `userId`, `mobile`, `role`                     | `notifications`, `audit`               | Yes                 |
| `BOOKING_CONFIRMED`       | `bookings`      | `bookingId`, `farmerId`, `slotId`, `tokenCode` | `tokens`, `notifications`, `analytics` | Yes                 |
| `BOOKING_CANCELLED`       | `bookings`      | `bookingId`, `farmerId`, `reason`              | `slots`, `notifications`, `audit`      | Yes                 |
| `TOKEN_GENERATED`         | `tokens`        | `tokenId`, `bookingId`, `tokenCode`            | `audit`                                | Yes                 |
| `FARMER_CHECKED_IN`       | `checkins`      | `bookingId`, `queueEntryId`, `centreId`        | `queue`, `notifications`, `realtime`   | Yes                 |
| `QUEUE_FARMER_CALLED`     | `queue`         | `queueEntryId`, `farmerId`, `stationNumber`    | `notifications`, `realtime`            | No                  |
| `QUEUE_PAUSED`            | `queue`         | `centreId`, `reason`, `pausedBy`               | `notifications`, `realtime`, `audit`   | Yes                 |
| `WEIGHMENT_RECORDED`      | `weighments`    | `weighmentId`, `procurementId`, `netWeightKg`  | `procurements`, `audit`                | Yes                 |
| `QUALITY_INSPECTED`       | `quality`       | `inspectionId`, `procurementId`, `grade`       | `procurements`, `audit`                | Yes                 |
| `PROCUREMENT_APPROVED`    | `procurements`  | `procurementId`, `farmerId`, `payableAmount`   | `payments`, `notifications`, `audit`   | Yes                 |
| `PROCUREMENT_REJECTED`    | `procurements`  | `procurementId`, `farmerId`, `rejectionReason` | `notifications`, `audit`               | Yes                 |
| `PAYMENT_INITIATED`       | `payments`      | `paymentId`, `procurementId`, `amount`         | `notifications`, `audit`               | Yes                 |
| `PAYMENT_COMPLETED`       | `payments`      | `paymentId`, `procurementId`, `utrNumber`      | `notifications`, `analytics`, `audit`  | Yes                 |
| `PAYMENT_FAILED`          | `payments`      | `paymentId`, `failureReason`, `retryCount`     | `notifications`, `jobs`, `audit`       | Yes                 |
| `CONGESTION_ALERT_RAISED` | `intelligence`  | `centreId`, `congestionIndex`, `level`         | `notifications`, `realtime`            | No                  |
| `EQUIPMENT_FAULT_LOGGED`  | `equipment`     | `equipmentId`, `centreId`, `faultType`         | `capacity`, `notifications`, `audit`   | Yes                 |

---

## 3. Event Envelope Standard Format

All events emitted within the system wrap payloads in a standardized metadata envelope:

```json
{
  "eventId": "evt_98129012-1234-4567-89ab-cdef12345678",
  "eventName": "PROCUREMENT_APPROVED",
  "timestamp": "2026-09-13T08:30:00.000Z",
  "correlationId": "req_c49219b1-5e88-410a-b502-09418291a182",
  "producer": "procurements-service",
  "version": "1.0",
  "payload": {
    "procurementId": "pr_88123901-1234-5678-90ab-cdef12345678",
    "farmerId": "fm_48192019-1234-5678-90ab-cdef12345678",
    "centreId": "cn_11029301-1234-5678-90ab-cdef12345678",
    "netWeightKg": 1250.5,
    "payableAmount": 28136.25,
    "approvedBy": "usr_77123901-8812-411a-9921-123456789012"
  }
}
```

---

## 4. In-Memory Event Bus Implementation (`events/eventBus.js`)

```javascript
import EventEmitter from "events";
import { pinoLogger } from "../config/logger";

class SmartProcureEventBus extends EventEmitter {
  emit(eventName, payload) {
    pinoLogger.info(
      { eventName, correlationId: payload?.correlationId },
      `[EventBus] Emitting event ${eventName}`,
    );
    return super.emit(eventName, payload);
  }
}

export const eventBus = new SmartProcureEventBus();
// Increase max listeners for multi-consumer support
eventBus.setMaxListeners(30);
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
