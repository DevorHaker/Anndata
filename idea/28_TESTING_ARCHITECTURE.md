# 28 — TESTING ARCHITECTURE

## SmartProcure: Testing Pyramid, Automation Tools, and Critical Test Scenarios

---

## 1. Testing Pyramid Architecture

```
                                  ▲
                                 ╱ ╲
                                ╱   ╲
                               ╱ E2E ╲            Playwright (Critical User Flows)
                              ╱───────╲
                             ╱ API /   ╲          Supertest (HTTP Endpoint Integration)
                            ╱ Service   ╲
                           ╱─────────────╲
                          ╱ Component UI  ╲       React Testing Library / Vitest
                         ╱─────────────────╲
                        ╱   Unit Tests      ╲     Vitest (Pure Business Logic, FSM, Zod)
                       ───────────────────────
```

| Layer                         | Responsibility                                               | Primary Tooling       | Execution Frequency     | Target Coverage          |
| ----------------------------- | ------------------------------------------------------------ | --------------------- | ----------------------- | ------------------------ |
| **Unit Tests**                | Domain business rules, Zod schemas, FSM state transitions    | Vitest                | Every Commit / Pre-Push | > 85% Code Coverage      |
| **Component Tests**           | React UI atomic components, form validations, hooks          | React Testing Library | Every PR / CI Pipeline  | > 75% Component Coverage |
| **API & Service Integration** | Full Express route lifecycles with real PostgreSQL container | Vitest + Supertest    | Every PR / CI Pipeline  | 100% Critical API Routes |
| **End-to-End (E2E)**          | End-to-end browser journeys (Register -> Book -> Scan QR)    | Playwright            | Nightly & Pre-Release   | Core Happy & Edge Flows  |
| **Load Testing**              | High-concurrency booking surge & queue stress tests          | k6                    | Pre-Release Audit       | 5,000 Concurrent VUs     |

---

## 2. Automated Concurrency Test Implementation (k6 Script)

To ensure zero overbooking under peak harvest surges, automated k6 load tests simulate 100 virtual users hitting the exact same slot ID simultaneously:

```javascript
// k6 Load Test Script: Booking Concurrency Stress Test (tests/load/booking_concurrency.js)
import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 100, // 100 Virtual Users simultaneously
  duration: "5s",
};

export default function () {
  const url = "http://localhost:5000/api/v1/bookings";
  const payload = JSON.stringify({
    slotId: "09123890-1234-5678-90ab-cdef12345678", // Slot capacity = 5
    cropTypeId: "cr_wheat_01",
    declaredWeightKg: 500,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${__ENV.FARMER_JWT_TOKEN}`,
      "Idempotency-Key": `idempotency_${__VU}_${__ITER}`,
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "status is 201 Created or 409 Conflict": (r) =>
      r.status === 201 || r.status === 409,
  });
}
```

---

## 3. Mandatory Critical Test Cases Catalog

The automated suite must pass these 10 critical edge-case integration tests before any code merge:

1. **Concurrent Booking Collision**: 100 concurrent requests against a slot with capacity = 5. Verify exactly 5 succeed (`HTTP 201`), 95 fail (`HTTP 409 SLOT_FULL`), and remaining capacity in DB = 0.
2. **Duplicate Booking Prevention**: Verify a farmer cannot create two active bookings for the same crop on the same date.
3. **Invalid Token QR Re-Use**: Scan an active QR token; verify status transitions to `USED`. Re-scan the same QR payload; verify API rejects with `TOKEN_ALREADY_USED`.
4. **Role Scope Intrusion**: Verify a `PROCUREMENT_OFFICER` assigned to Centre A cannot view or check-in bookings for Centre B (`HTTP 403`).
5. **Quality Override Escalation**: Verify a quality grade rejection override > 20% moisture requires `CENTRE_MANAGER` approval.
6. **Double Payment Prevention**: Initiate payment for procurement ID `P123`. Attempt simultaneous duplicate payment call; verify rejected by idempotency layer.
7. **Offline QR Presentation**: Disable internet connection in Playwright PWA runner; verify saved booking QR renders correctly from IndexedDB cache.
8. **Queue Skip Transition**: Officer skips absent farmer; verify position drops to end of queue and status updates to `SKIPPED`.
9. **Equipment Fault Queue Pause**: Mark weighing scale as `FAULT`; verify queue status transitions to `PAUSED` and Socket.IO broadcasts alert.
10. **Sanitizing Sensitive Output**: Request user profile endpoint; verify password hash and full bank account numbers are never returned in JSON payload.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
