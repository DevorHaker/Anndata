# 12 — REAL-TIME ARCHITECTURE

## SmartProcure: Socket.IO / WebSocket Gateway, Room Security, & Event Subscriptions

---

## 1. Real-Time Communication Stack

- **Engine**: Socket.IO v4 (Node.js backend server + JavaScript client client-side)
- **Transport Modes**: WebSocket primary, HTTP Long-Polling automatic fallback
- **Scaling Adapter**: Socket.IO Redis Streams Adapter (`@socket.io/redis-adapter`) for cross-instance message broadcasting across multiple backend API containers.

---

## 2. Authentication & Connection Handshake

WebSocket connections must be authenticated before any socket join event is accepted.

```javascript
// Server-Side Handshake Authentication Middleware (realtime/socketServer.js)
import { verifyJwt } from "../utils/crypto";

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) {
    return next(new Error("AUTHENTICATION_FAILED: Token missing"));
  }

  try {
    const payload = verifyJwt(token);
    socket.user = payload; // Attach { userId, role, farmerId, centreId }
    next();
  } catch (err) {
    next(new Error("AUTHENTICATION_FAILED: Invalid or expired token"));
  }
});
```

---

## 3. Channel Authorization & Room Topology

Sockets are joined to scoped rooms during connection based on strict authorization rules:

```
Room Naming Schema                     Authorized Roles                Purpose
------------------------------------------------------------------------------------------------------
`centre:{centreId}:live`               OFFICER, MANAGER, SYS_ADMIN    Live queue changes, active staff, metrics
`centre:{centreId}:congestion`         MANAGER, DIST_ADMIN, SYS_ADMIN Congestion gauge & alert events
`farmer:{farmerId}`                    FARMER (Self only)             Personal queue position & ETA updates
`booking:{bookingId}`                  FARMER (Owner), OFFICER        Booking state changes
`district:{districtId}`                DISTRICT_ADMIN, SYS_ADMIN      Cross-centre district performance
```

### Room Join Security Handler

```javascript
socket.on("subscribe:centre", ({ centreId }) => {
  // Verify actor has access to this centre
  if (socket.user.role === "FARMER") {
    return socket.emit("error", {
      message: "Farmers cannot subscribe to full centre feed",
    });
  }
  if (["PROCUREMENT_OFFICER", "CENTRE_MANAGER"].includes(socket.user.role)) {
    if (socket.user.centreId !== centreId) {
      return socket.emit("error", { message: "Unauthorized for this centre" });
    }
  }
  socket.join(`centre:${centreId}:live`);
  socket.emit("subscribed", { room: `centre:${centreId}:live` });
});
```

---

## 4. System Event Catalog

| Event Name                  | Channel / Room                 | Emitted Payload                              | Trigger Event                  |
| --------------------------- | ------------------------------ | -------------------------------------------- | ------------------------------ |
| `QUEUE_UPDATED`             | `centre:{centreId}:live`       | `{ centreId, waitingCount, calledEntry }`    | QR Checkin / Call / Skip       |
| `POSITION_UPDATED`          | `farmer:{farmerId}`            | `{ bookingId, position, etaMinutes }`        | Queue position change          |
| `FARMER_CALLED`             | `farmer:{farmerId}`            | `{ bookingId, stationNumber, tokenCode }`    | Officer calls next farmer      |
| `CONGESTION_ALERT`          | `centre:{centreId}:congestion` | `{ centreId, ratio, level: 'YELLOW'/'RED' }` | Intelligence congestion engine |
| `PROCUREMENT_STATE_CHANGED` | `booking:{bookingId}`          | `{ bookingId, status, netWeightKg }`         | Inspection / Approval          |

---

## 5. Reconnection & Fallback Design

1. **Reconnection Mechanism**: Client automatically attempts reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s).
2. **State Synchronization on Reconnect**: On socket reconnect, client automatically triggers a HTTP query via TanStack Query to refetch canonical server state, ensuring missed real-time events during disconnection are reconciled.
3. **HTTP Polling Fallback**: If WebSockets are blocked by corporate/rural network firewalls, Socket.IO gracefully degrades to HTTP Long Polling.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
