# 11 — QUEUE ARCHITECTURE

## SmartProcure: Live Queue State Machine, Ordering Algorithms, and ETA Engine

---

## 1. Queue Architecture Requirements

The live queue at each procurement centre converts checked-in farmers into an ordered, operational stream.

- **Source of Truth**: PostgreSQL `queue_entries` table.
- **Caching & Real-Time Broadcast**: Redis Sorted Sets (`ZSET`) for sub-millisecond position lookups, coupled with Socket.IO for live UI synchronization.

---

## 2. Queue Entry State Machine

```
                                [ QR Check-In Confirmed ]
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   WAITING   │
                                    └──────┬──────┘
                                           │ Officer Calls Farmer
                                           ▼
                                    ┌─────────────┐
                                    │   CALLED    │
                                    └──────┬──────┘
                                           │ Farmer Arrives at Station
                                           ▼
                                    ┌─────────────┐
                                    │ IN_SERVICE  │
                                    └──────┬──────┘
                                           │ Procurement Decision Made
                                           ▼
                                    ┌─────────────┐
                                    │  COMPLETED  │
                                    └─────────────┘

     [ Exception Transitions ]
     WAITING / CALLED  ──(Farmer Absent)──> SKIPPED ──(Re-entry)──> WAITING (End of Queue)
     IN_SERVICE        ──(Hold/Fault)────> ON_HOLD ──(Resolved)──> WAITING / IN_SERVICE
```

---

## 3. Queue Ordering Algorithm

Queue entry ordering is deterministic and non-arbitrary.

```sql
-- Queue Entry Position Calculation Order:
-- 1. Priority Tier (0 = Emergency/Priority, 1 = Standard Slot Booking, 2 = Walk-In/Late)
-- 2. Slot Start Time (On-time slot holders take precedence over later slots)
-- 3. Check-In Timestamp (FIFO within the same slot window)

SELECT id, booking_id, farmer_id, queue_position, status
FROM queue_entries
WHERE centre_id = :centreId AND status IN ('WAITING', 'CALLED', 'IN_SERVICE')
ORDER BY
  priority_tier ASC,
  slot_start_time ASC,
  checkin_timestamp ASC;
```

### Late Arrival Handling Rules

- **Arrival Within Grace Period (e.g., 30 mins)**: Farmer retains original slot-ordered priority.
- **Arrival After Grace Period**: Farmer queue entry `priority_tier` is demoted to `2` (Late/Walk-In). The farmer is placed at the end of the active queue.

---

## 4. Redis Queue Caching Pattern

To allow farmers to check their queue position continuously without hammering PostgreSQL:

```
Redis Key Structure:
Key: `queue:centre:{centreId}:zset`
Score: UNIX Timestamp of calculated priority (Combining Priority Tier + Slot Time + Checkin Time)
Value: JSON String `{ "queueEntryId": "...", "farmerId": "...", "bookingId": "..." }`

Operations:
- ZADD on Check-In
- ZRANK to get farmer's exact zero-indexed position ahead (O(log(N)))
- ZREM on Service Completion
```

If Redis goes down, position computation falls back directly to the PostgreSQL index query with zero loss of data integrity.

---

## 5. Dynamic ETA Estimation Engine

The Estimated Time of Arrival/Service (ETA) for Farmer $i$ at Position $N$ is computed as:

$$\text{ETA}_i = \text{Current Time} + \sum_{k=1}^{N} \hat{T}_{\text{procurement}}(\text{crop}_k) + \text{Downtime Buffer}$$

Where:

- $N$: Number of farmers ahead in `WAITING` or `CALLED` state.
- $\hat{T}_{\text{procurement}}(\text{crop}_k)$: Rolling average processing time (in minutes) for crop type $k$ at this centre over the last 20 completed procurements. Default baseline: 15 minutes per farmer.
- **Queue Pause Adjustment**: If `queue_status` = `PAUSED`, ETA displays `"Service Paused (Equipment Maintenance)"`.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
