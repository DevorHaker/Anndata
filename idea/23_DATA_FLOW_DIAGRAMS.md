# 23 — DATA FLOW DIAGRAMS

## SmartProcure: End-to-End System Data Flow Sequences

---

## 1. Flow 1: Farmer Registration & OTP Verification

```
[Farmer UI]                 [API Gateway / Router]               [Auth Service]           [PostgreSQL DB]           [Redis / SMS Adapter]
     │                                │                                │                         │                         │
     │─ 1. POST /auth/register ──────>│                                │                         │                         │
     │   { mobile, name, password }   │── 2. Validate Payload (Zod) ──>│                         │                         │
     │                                │                                │─ 3. Check Duplicate ───>│ SELECT * FROM users     │
     │                                │                                │                          WHERE mobile = $1        │
     │                                │                                │<─ 4. Mobile Available ──│                         │
     │                                │                                │                         │                         │
     │                                │                                │─ 5. Store Pending User ─>│ INSERT INTO users...   │
     │                                │                                │                          (status: PENDING_OTP)    │
     │                                │                                │                         │                         │
     │                                │                                │─ 6. Generate 6-Digit OTP                         │
     │                                │                                │─ 7. Set OTP in Redis ──────────────────────────>│ SET otp:{mobile} 123456
     │                                │                                │                                                   │ (TTL: 300s)
     │                                │                                │─ 8. Trigger SMS Event ──────────────────────────>│ Push to `notifications-high`
     │<─ 9. HTTP 201 Created ─────────│<─ Response { status, mobile } ─│                                                   │ Worker sends SMS via Twilio
```

---

## 2. Flow 2: Intelligent Centre Recommendation

```
[Farmer UI]                 [API Gateway]                  [Recommendation Service]       [Intelligence Engine]      [PostgreSQL DB]
     │                           │                                    │                             │                          │
     │─ 1. POST /recommendations>│                                    │                             │                          │
     │   { lat, long, cropId }   │── 2. Validate JWT Auth ───────────>│                             │                          │
     │                           │                                    │─ 3. Query Eligible Centres ─────────────────────────>│ SELECT * FROM centres
     │                           │                                    │                                                        │ WHERE accepted_crops @> [cropId]
     │                           │                                    │<─ 4. Return Active Centres ────────────────────────────│
     │                           │                                    │                             │                          │
     │                           │                                    │─ 5. Invoke Scoring Rule ───>│                          │
     │                           │                                    │                             │ Compute Haversine Dist   │
     │                           │                                    │                             │ Compute Slot Avail %     │
     │                           │                                    │                             │ Compute Queue Congestion │
     │                           │                                    │<─ 6. Ranked Centre List ────│                          │
     │<─ 7. HTTP 200 OK ─────────│<─ Return Top 3 Recommendations ────│                             │                          │
```

---

## 3. Flow 3: Concurrency-Safe Slot Booking

```
[Farmer UI]            [API Server]            [Redis Lock]            [PostgreSQL DB]           [Token Service]           [Event Bus]
     │                      │                       │                         │                         │                         │
     │─ 1. POST /bookings ─>│                       │                         │                         │                         │
     │  { slotId, cropId }  │─ 2. Acquire Lock ────>│                         │                         │                         │
     │                      │   lock:slot:{slotId}  │                         │                         │                         │
     │                      │<─ 3. Lock Acquired ───│                         │                         │                         │
     │                      │                       │                         │                         │                         │
     │                      │─ 4. BEGIN DB Transaction ──────────────────────>│                         │                         │
     │                      │─ 5. Atomic Capacity Decrement SQL ─────────────>│ UPDATE slots SET        │                         │
     │                      │                                                 │   avail = avail - 1     │                         │
     │                      │                                                 │ WHERE id = $1           │                         │
     │                      │                                                 │   AND avail > 0;        │                         │
     │                      │<─ 6. Rows Affected == 1 (SUCCESS) ──────────────│                         │                         │
     │                      │                       │                         │                         │                         │
     │                      │─ 7. INSERT INTO bookings (status: CONFIRMED) ──>│                         │                         │
     │                      │─ 8. Generate Cryptographic Token ────────────────────────────────────────>│ Generate HMAC Token     │
     │                      │─ 9. INSERT INTO audit_logs ────────────────────>│                         │                         │
     │                      │─ 10. COMMIT Transaction ───────────────────────>│                         │                         │
     │                      │                       │                         │                         │                         │
     │                      │─ 11. Release Lock ───>│                         │                         │                         │
     │                      │                       │                         │                         │─ 12. Emit Domain Event >│ BOOKING_CONFIRMED
     │<─ 13. HTTP 201 ──────│<─ Return Booking & Token Data                   │                         │                         │ Worker sends SMS async
```

---

## 4. Flow 4: QR Check-In at Gate Scan

```
[Officer Scanner UI]        [API Server]            [Token Service]           [PostgreSQL DB]           [Queue Service]           [Socket.IO Server]
     │                           │                         │                         │                         │                         │
     │─ 1. POST /checkins ──────>│                         │                         │                         │                         │
     │   { tokenPayload }        │─ 2. Validate Token ────>│ Verify HMAC Signature   │                         │                         │
     │                           │<─ 3. Token Valid ───────│ Check Expire & Status   │                         │                         │
     │                           │                         │                         │                         │                         │
     │                           │─ 4. BEGIN DB Transaction ────────────────────────>│                         │                         │
     │                           │─ 5. UPDATE tokens SET status = 'USED' ───────────>│                         │                         │
     │                           │─ 6. UPDATE bookings SET status = 'CHECKED_IN' ───>│                         │                         │
     │                           │─ 7. Insert Queue Entry ───────────────────────────────────────────────────>│ Insert Queue Entry      │
     │                           │                                                   │                         │ (Status: WAITING)       │
     │                           │─ 8. COMMIT Transaction ──────────────────────────>│                         │                         │
     │                           │                         │                         │                         │                         │
     │                           │─ 9. Broadcast Real-Time Event ───────────────────────────────────────────────────────────────>│ Broadcast to Room:
     │<─ 10. HTTP 200 OK ────────│<─ Return Checkin Summary                          │                         │                         │ `centre:{centreId}:live`
```

---

## 5. Flow 5: Live Queue Calling & ETA Update

```
[Officer UI]                [API Server]            [Queue Service]           [PostgreSQL DB]           [Socket.IO Gateway]        [Farmer UI]
     │                           │                         │                         │                            │                        │
     │─ 1. POST /queue/call ────>│                         │                         │                            │                        │
     │   { queueEntryId }        │─ 2. Validate Role ─────>│                         │                            │                        │
     │                           │   (OFFICER)             │─ 3. Update Entry State >│ UPDATE queue_entries       │                        │
     │                           │                         │                         │   SET status = 'CALLED'    │                        │
     │                           │                         │                         │ WHERE id = $1              │                        │
     │                           │                         │                         │                            │                        │
     │                           │                         │─ 4. Recalculate ETAs ──>│ Re-query positions & ETAs  │                        │
     │                           │                         │                         │                            │                        │
     │                           │                         │─ 5. Broadcast Event ────────────────────────────────>│ Emit `QUEUE_UPDATED`   │
     │                           │                         │                                                      │ to `centre:c1:live`    │
     │                           │                         │                                                      │ Emit `FARMER_CALLED`   │
     │                           │                         │                                                      │ to `farmer:f123` ─────>│ Play Audio Chime
     │<─ 6. HTTP 200 OK ─────────│<─ Return Next Entry ────│                                                      │                        │ Display "Proceed to Station"
```

---

## 6. Flow 6: Procurement Approval & Payment Initiation

```
[Officer/Manager UI]        [API Server]            [Procurement FSM]         [PostgreSQL DB]           [Payment Service]          [BullMQ Worker]
     │                           │                         │                         │                         │                         │
     │─ 1. POST /procurements/ ─>│                         │                         │                         │                         │
     │   :id/approve             │─ 2. Check Role Threshold│                         │                         │                         │
     │                           │   (Manager if >100q)    │─ 3. Transition FSM ────>│                         │                         │
     │                           │                         │   'APPROVED'            │                         │                         │
     │                           │                         │                         │                         │                         │
     │                           │─ 4. BEGIN DB Transaction ────────────────────────>│                         │                         │
     │                           │─ 5. UPDATE procurements SET status = 'APPROVED' ->│                         │                         │
     │                           │─ 6. Generate Digital Receipt Record ─────────────>│                         │                         │
     │                           │─ 7. Create Payment Record (Status: PENDING) ───────────────────────────>│ INSERT INTO payments... │
     │                           │─ 8. INSERT INTO audit_logs ──────────────────────>│                         │                         │
     │                           │─ 9. COMMIT Transaction ──────────────────────────>│                         │                         │
     │                           │                         │                         │                         │                         │
     │                           │─ 10. Push Payment Trigger Job ───────────────────────────────────────────────────────────────>│ Enqueue to `payments-queue`
     │<─ 11. HTTP 200 OK ────────│<─ Return Receipt Payload                           │                         │                         │ Process async disbursement
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
