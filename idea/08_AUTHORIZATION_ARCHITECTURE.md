# 08 — AUTHORIZATION & RBAC ARCHITECTURE

## SmartProcure: Role-Based Access Control and Resource Scope Isolation

---

## 1. Security Boundary Rule: Backend Enforcement

> **MANDATORY SECURITY INVARIANT**:
> The frontend React UI is **NEVER** considered a security boundary. Hiding UI elements, disabling buttons, or restricting routes client-side is strictly for User Experience.
> **EVERY** incoming API request is authorized on the Node.js backend using role permissions and strict data scope parameters.

---

## 2. Five Primary System Roles

1. `FARMER`: Individual agricultural producer. Data scope restricted strictly to self-owned records.
2. `PROCUREMENT_OFFICER`: Procurement centre operational staff. Data scope restricted to assigned procurement centre for operational workflows (check-in, weighment, quality).
3. `CENTRE_MANAGER`: Operational lead of a procurement centre. Full read/write management authority over assigned centre.
4. `DISTRICT_ADMIN`: Regional authority overseeing multiple procurement centres in a district. Aggregated analytical and read oversight; emergency override capability.
5. `SYSTEM_ADMIN`: System-wide platform administrator. Unrestricted administrative access. All cross-scope access is transactionally audit-logged.

---

## 3. Data Scope Isolation Architecture

Every database query executed by the repository layer must be parameterised with the authenticated user's `actorScope`.

```
Role                    Allowed Resource Scope Query Clause
---------------------------------------------------------------------------------------------
FARMER                  WHERE farmer_id = :authenticatedFarmerId
PROCUREMENT_OFFICER     WHERE centre_id = :assignedCentreId AND created_at >= CURRENT_DATE
CENTRE_MANAGER          WHERE centre_id = :assignedCentreId
DISTRICT_ADMIN          WHERE centre_id IN (SELECT id FROM centres WHERE district_id = :districtId)
SYSTEM_ADMIN            No automatic scope filter (Generates AUDIT_LOG entry on execution)
```

---

## 4. Middleware Pipeline Implementation

Backend authorization is enforced by combining two explicit Express middleware functions:

```javascript
// Example Middleware Usage in Route Declaration (bookings.routes.js)
import express from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorizeRole } from "../../middleware/authorizeRole";
import { validateScope } from "../../middleware/validateScope";
import { bookingsController } from "./bookings.controller";

const router = express.Router();

// Route: Get specific booking details
// Requirements: Must be authenticated AND (be the farmer who owns it OR be officer/manager at that centre)
router.get(
  "/:id",
  authenticate,
  authorizeRole([
    "FARMER",
    "PROCUREMENT_OFFICER",
    "CENTRE_MANAGER",
    "DISTRICT_ADMIN",
    "SYSTEM_ADMIN",
  ]),
  validateScope({ resource: "BOOKING", action: "READ" }),
  bookingsController.getBookingById,
);

export default router;
```

### Role Authorization Middleware Implementation (`middleware/authorizeRole.js`)

```javascript
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication required" },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN_ROLE",
          message: `Role '${req.user.role}' is not authorized to access this resource`,
        },
      });
    }

    next();
  };
};
```

---

## 5. Fine-Grained Permission Matrix

| Endpoint Domain | Operation            | FARMER |   OFFICER    |   MANAGER    |  DIST_ADMIN  | SYS_ADMIN |
| --------------- | -------------------- | :----: | :----------: | :----------: | :----------: | :-------: |
| `/auth/users`   | Create Staff Account |   ❌   |      ❌      |  🔶 Centre   | 🔶 District  |    ✅     |
| `/farmers`      | View Profile         | 📋 Own |  ✅ Centre   |  ✅ Centre   |   🔶 Read    |    ✅     |
| `/centres`      | Edit Centre Config   |   ❌   |      ❌      |    ✅ Own    | 🔶 Emergency |    ✅     |
| `/slots`        | Create Slots         |   ❌   |      ❌      |    ✅ Own    |      ❌      |    ✅     |
| `/bookings`     | Create Booking       | 📋 Own | 🔶 On-behalf | 🔶 On-behalf |      ❌      |    ✅     |
| `/bookings`     | Cancel Booking       | 📋 Own |  🔶 Reason   |  ✅ Centre   |      ❌      |    ✅     |
| `/tokens`       | Validate QR Scan     |   ❌   |  ✅ Centre   |  ✅ Centre   |      ❌      |    ✅     |
| `/queue`        | Call Next Farmer     |   ❌   |  ✅ Centre   |  ✅ Centre   |      ❌      |    ✅     |
| `/weighments`   | Submit Record        |   ❌   |  ✅ Centre   |  ✅ Centre   |      ❌      |    ✅     |
| `/weighments`   | Approve Correction   |   ❌   |      ❌      |  ✅ Centre   |      ❌      |    ✅     |
| `/quality`      | Override Failure     |   ❌   |      ❌      |  ✅ Centre   |      ❌      |    ✅     |
| `/procurements` | Approve (Std)        |   ❌   | 🔶 Threshold |  ✅ Centre   |      ❌      |    ✅     |
| `/payments`     | Initiate Payment     |   ❌   |      ❌      |  ✅ Centre   |      ❌      |    ✅     |
| `/admin/config` | Update MSP Rates     |   ❌   |      ❌      |      ❌      |      ❌      |    ✅     |

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
