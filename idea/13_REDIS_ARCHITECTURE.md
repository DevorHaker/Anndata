# 13 — REDIS ARCHITECTURE

## SmartProcure: In-Memory Data Store Usage, Keyspace Design, and TTL Policies

---

## 1. Redis Usage Policy

Redis 7 is deployed strictly as an **ephemeral cache, distributed locking mechanism, state queue engine, and rate-limiting store**.

> **CRITICAL INVARIANT**: Redis is **NEVER** the primary transactional source of truth for financial, booking, procurement, or audit data. If Redis experiences catastrophic data loss or crashes, the application degrades gracefully by querying PostgreSQL directly.

---

## 2. Structured Keyspace Naming Standard & TTL Matrix

| Category              | Key Pattern                    | Data Structure       | Default TTL        | Failure Fallback Strategy                    |
| --------------------- | ------------------------------ | -------------------- | ------------------ | -------------------------------------------- |
| **User Sessions**     | `session:{userId}:{sessionId}` | Hash (`HSET`)        | 7 Days             | Fallback to JWT DB refresh check             |
| **OTP Verification**  | `otp:{mobileNumber}`           | String (`SET`)       | 300 Seconds        | Block OTP verify until requested             |
| **Distributed Locks** | `lock:slot:{slotId}`           | String (`SET NX EX`) | 3 Seconds          | Fallback to DB Atomic SQL update             |
| **Idempotency**       | `idempotency:{key}`            | String/JSON          | 24 Hours           | Process request with DB unique check         |
| **Rate Limiting**     | `rate:{ip_or_user}:{endpoint}` | String (Counter)     | 60 Seconds         | Allow request; log warning                   |
| **Queue Cache**       | `queue:centre:{centreId}:zset` | Sorted Set (`ZSET`)  | Dynamic / 24 Hours | Rebuild `ZSET` from PostgreSQL query         |
| **Live ETA Cache**    | `eta:booking:{bookingId}`      | Hash (`HSET`)        | 60 Seconds         | Compute ETA via PostgreSQL algorithm         |
| **Sys Configuration** | `config:system`                | String (JSON)        | 300 Seconds        | Fetch config from `system_configurations` DB |
| **Socket Adapter**    | `socket.io#...`                | Pub/Sub / Stream     | Ephemeral          | Re-establish local socket message            |

---

## 3. Distributed Locking Implementation (Redlock Pattern)

To prevent race conditions during slot bookings, Redis distributed locking is implemented using `SET key value NX PX 3000`:

```javascript
// Distributed Lock Implementation (utils/lock.js)
import { redis } from "../config/redis";

export const acquireLock = async (resourceKey, ttlMs = 3000) => {
  const lockId = crypto.randomUUID();
  const acquired = await redis.set(
    `lock:${resourceKey}`,
    lockId,
    "NX",
    "PX",
    ttlMs,
  );
  return acquired === "OK" ? lockId : null;
};

export const releaseLock = async (resourceKey, lockId) => {
  // Lua script guarantees atomic check-and-delete
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(luaScript, 1, `lock:${resourceKey}`, lockId);
};
```

---

## 4. Redis High Availability & Outage Degradation Plan

1. **Persistence Configuration**: Configured with `RDB` snapshots (every 15 mins) + `AOF` (Append-Only File) `everysec` for quick container recovery.
2. **Redis Sentinel / Cluster**: In production, deployed as a 3-node Redis Sentinel setup for automated master failover within 5 seconds.
3. **App Fallback Behavior**: If Redis connection is completely lost:
   - Distributed locking falls back to PostgreSQL `SELECT ... FOR UPDATE` row locks.
   - Queue position reads fall back to direct PostgreSQL index queries.
   - Rate limiting logs an error and allows traffic through gateway.
   - Core booking and procurement transactions **CONTINUE OPERATING SAFELY**.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
