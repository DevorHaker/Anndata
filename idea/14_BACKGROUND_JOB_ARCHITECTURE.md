# 14 — BACKGROUND JOB ARCHITECTURE

## SmartProcure: Asynchronous Queue Workers, BullMQ Design, and Retry Policies

---

## 1. Asynchronous Architecture Requirement

Heavy, non-blocking, periodic, or external network operations must not execute inline during HTTP API requests. SmartProcure uses **BullMQ** (Redis-backed message queue) to process background tasks asynchronously.

```
                  ┌──────────────────────────────────────────────┐
                  │             HTTP API SERVER TIER             │
                  │                                              │
                  │  Event Trigger -> BullMQ Queue Producer      │
                  └──────────────────────┬───────────────────────┘
                                         │ Push Job Payload
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                REDIS CLUSTER                 │
                  │   Queue: `notifications-queue`               │
                  │   Queue: `no-show-queue`                     │
                  │   Queue: `payments-queue`                    │
                  │   Queue: `analytics-queue`                   │
                  └──────────────────────┬───────────────────────┘
                                         │ Worker Fetch (Pop)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            BACKGROUND WORKER TIER            │
                  │           (Dedicated Node.js Workers)        │
                  │                                              │
                  │  ┌────────────────┐      ┌────────────────┐  │
                  │  │ Notif Worker   │      │ NoShow Worker  │  │
                  │  └───────┬────────┘      └───────┬────────┘  │
                  │          │ Provider Call         │ DB Update │
                  │          ▼                       ▼           │
                  │    [SMS Provider]         [PostgreSQL DB]    │
                  └──────────────────────────────────────────────┘
```

---

## 2. Dedicated Job Queue Registry

| Queue Name               | Responsibilities                                      | Default Concurrency | Priority Level           |
| ------------------------ | ----------------------------------------------------- | ------------------- | ------------------------ |
| `notifications-high`     | Immediate OTP, Queue Call, Payment Failed SMS         | 20 Workers          | High (Priority 1)        |
| `notifications-low`      | Booking Reminders, Summary Emails, Weekly Reports     | 5 Workers           | Low (Priority 5)         |
| `no-show-processor`      | Detect expired slots & transition bookings to NO_SHOW | 2 Workers           | Medium (Priority 3)      |
| `payment-reconciliation` | Handle payment retries, webhook checks                | 5 Workers           | High (Priority 2)        |
| `analytics-rollup`       | Compute daily centre throughput & congestion metrics  | 1 Worker            | Background (Priority 10) |

---

## 3. Worker Implementation & Idempotency Standard

Every background worker job handler **MUST** be idempotent. A job can be retried multiple times by BullMQ if worker containers crash mid-execution.

```javascript
// Example Worker Handler: High-Priority Notification Worker (jobs/notificationWorker.js)
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis";
import { smsProviderAdapter } from "../integrations/sms";
import { notificationsRepository } from "../modules/notifications/notifications.repository";

export const notificationWorker = new Worker(
  "notifications-high",
  async (job) => {
    const { notificationId, toMobile, messageText, referenceId } = job.data;

    // 1. Idempotency Check: Verify notification is not already marked DELIVERED in DB
    const currentStatus =
      await notificationsRepository.getStatus(notificationId);
    if (currentStatus === "DELIVERED") {
      return { skipped: true, reason: "Already delivered" };
    }

    // 2. Execute External Integration Call
    const result = await smsProviderAdapter.sendSMS({
      to: toMobile,
      message: messageText,
      referenceId,
    });

    // 3. Update Database Log State
    await notificationsRepository.updateDeliveryStatus(notificationId, {
      status: "DELIVERED",
      providerMessageId: result.messageId,
      deliveredAt: new Date(),
    });

    return { success: true, messageId: result.messageId };
  },
  {
    connection: redisConnection,
    concurrency: 20,
  },
);
```

---

## 4. Retry Policies & Dead-Letter Queue (DLQ)

### Automated Retry Strategy

- **Attempts**: Maximum 5 retry attempts.
- **Backoff Strategy**: Exponential Backoff (`delay = 2^attempt * 1000ms + jitter`).
  - Attempt 1: Immediate retry (1s)
  - Attempt 2: 5s delay
  - Attempt 3: 30s delay
  - Attempt 4: 5 minutes delay
  - Attempt 5: 30 minutes delay

### Dead-Letter Queue (DLQ) Handling

When a job fails all 5 attempts, BullMQ automatically moves the job payload into the `notifications-dlq` state:

1. `PERMANENTLY_FAILED` status recorded in database.
2. Alert event emitted to System Administrator dashboard.
3. System Admin can inspect payload, fix target endpoint/credentials, and trigger a manual single-click re-queue from the Admin UI.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
