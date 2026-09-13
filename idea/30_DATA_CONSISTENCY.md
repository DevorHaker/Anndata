# 30 — DATA CONSISTENCY & TRANSACTIONAL BOUNDARIES

## SmartProcure: Strong vs. Eventual Consistency Patterns and Transaction Scopes

---

## 1. Data Consistency Principles

In an agricultural procurement system, data consistency requirements vary by operational domain:

- **Financial & Capacity Operations**: Require **STRONG CONSISTENCY (ACID)**. Inconsistent slot capacity or double-disbursed funds corrupt system integrity.
- **Analytics & Notifications**: Require **EVENTUAL CONSISTENCY (BASE)**. A 5-second delay in updating daily dashboard metrics or delivering an SMS is completely acceptable.

---

## 2. Consistency Classification Registry

| Domain Operation                 | Consistency Guarantee    | Technology Mechanism                       | Justification                                   |
| -------------------------------- | ------------------------ | ------------------------------------------ | ----------------------------------------------- |
| **Slot Capacity Allocation**     | **Strong Consistency**   | PostgreSQL Row Lock / Atomic SQL           | Prevents overbooking.                           |
| **Booking Record Creation**      | **Strong Consistency**   | PostgreSQL Transaction (`BEGIN...COMMIT`)  | Canonical record of farmer appointment.         |
| **Token Verification**           | **Strong Consistency**   | PostgreSQL Transaction + HMAC Verification | Prevents token re-use.                          |
| **Weighment & Quality Entry**    | **Strong Consistency**   | PostgreSQL Transaction                     | Financial calculation source data.              |
| **Payment Disbursement**         | **Strong Consistency**   | PostgreSQL Transaction + Idempotency Key   | Prevents double payment.                        |
| **Queue Position Display**       | **Eventual Consistency** | Redis `ZSET` + Socket.IO Broadcast         | Real-time UX display; falls back to DB.         |
| **SMS / Email Dispatch**         | **Eventual Consistency** | BullMQ Async Worker Queue                  | External network retries should not block HTTP. |
| **Analytics Dashboard Rollup**   | **Eventual Consistency** | Scheduled Rollup Job (Cron / Worker)       | Complex aggregations executed off-peak.         |
| **Congestion Index Calculation** | **Eventual Consistency** | 5-Minute Background Aggregation Job        | High-level operational indicator.               |

---

## 3. Transactional Outbox Pattern for Reliable Events

To guarantee that domain events are never lost if the server crashes right after a database `COMMIT`, SmartProcure uses the **Transactional Outbox Pattern**:

```
[API Service]
     │
     │─── BEGIN Transaction ────────────────────────────────────────────────┐
     │    1. INSERT INTO bookings ...                                       │
     │    2. UPDATE slots SET capacity = capacity - 1 WHERE ...            │
     │    3. INSERT INTO outbox_events (id, event_name, payload, status)   │ (Staged inside DB!)
     │─── COMMIT Transaction ───────────────────────────────────────────────┘
     │
     ▼ (Async Process)
[Outbox Poller / Dequeue Worker]
     │
     │─── Poll outbox_events WHERE status = 'PENDING'
     │─── Publish event to Redis / BullMQ Notification Worker
     │─── UPDATE outbox_events SET status = 'PROCESSED'
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
