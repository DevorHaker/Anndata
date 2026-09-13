# 04 — USER ROLES AND PERMISSIONS

## SmartProcure: Complete Role Definition and Permission Matrix

---

## 1. Role Architecture Overview

SmartProcure uses **Role-Based Access Control (RBAC)** with five primary roles. Permissions are enforced at the API middleware layer and the service layer. No role can access data outside their authorised scope by default.

**Design Principles:**

- Principle of Least Privilege
- Data Scope Isolation
- Audit Mandate: all sensitive operations produce an audit log
- Immutability: audit logs, original weighing entries, and original inspection records cannot be deleted by any role

---

## 2. Role Definitions

### 2.1 FARMER

**Purpose:** Individual or group farmer who registers, books, and participates in the procurement process.

**Responsibilities:**

- Maintain their own profile and produce information
- Browse procurement centres and available slots
- Create, manage, and cancel bookings
- Receive and present QR tokens at check-in
- Track queue position and estimated waiting time
- Review procurement and payment status

**Data Access Scope:** Own profile, bookings, tokens, queue entries, procurement records, payment records only. Public data: centre info, slot availability counts.

**Approval Authority:** None.

**Dashboard Requirements:**

- Upcoming bookings, active queue position and ETA, recent procurement history, payment status, notifications inbox

---

### 2.2 PROCUREMENT_OFFICER

**Purpose:** Centre staff who executes the procurement workflow — check-in, weighing, quality inspection.

**Responsibilities:**

- Confirm farmer check-in via QR scan
- View and manage live queue at assigned centre
- Record weighing and quality inspection results
- Submit procurement for approval or reject

**Data Access Scope:** All bookings, tokens, queue entries, weighings, and inspections for their assigned centre on the current day.

**Approval Authority:** Can approve standard procurement below configured threshold. Cannot approve high-value or exception procurements.

**Dashboard Requirements:**

- Live queue, next farmer to call, today's procurement activity summary

---

### 2.3 CENTRE_MANAGER

**Purpose:** Operational head of a single procurement centre.

**Responsibilities:**

- Configure centre capacity, operating hours, and slots
- Manage staff and equipment within the centre
- Override procurement decisions within their authority
- Respond to congestion alerts; temporarily close centre

**Data Access Scope:** Full access to their assigned centre only. Cannot access other centres.

**Approval Authority:** Approve or reject all procurements at their centre; override officer decisions; close or reduce capacity.

**Dashboard Requirements:**

- Live operations, congestion alerts, daily throughput, equipment status, staff assignment view, payment summary

---

### 2.4 DISTRICT_ADMIN

**Purpose:** Government or authority administrator overseeing multiple procurement centres in a district.

**Responsibilities:**

- View aggregated analytics across all assigned centres
- Respond to cross-centre congestion or underperformance
- Review load balancing recommendations
- Manage Centre Manager accounts in their district

**Data Access Scope:** Read access to all data across all centres in their assigned district. Cannot modify operational records.

**Approval Authority:** Override Centre Manager decisions in emergencies (with audit log); temporarily suspend a centre; approve load balancing actions.

**Dashboard Requirements:**

- District-level map, multi-centre comparison, congestion heat map, cross-centre balancing suggestions, payment aggregation

---

### 2.5 SYSTEM_ADMIN

**Purpose:** Technical and operational platform administrator.

**Responsibilities:**

- Create, modify, and suspend any user account
- Assign and revoke roles
- Configure global system settings
- Manage audit log access, background jobs, notification provider configurations

**Data Access Scope:** Full access to all system data. All cross-scope access is audit-logged.

**Approval Authority:** Full authority over all platform operations.

**Dashboard Requirements:**

- System health, user management, active sessions, notification delivery health, audit log explorer, integration health

---

## 3. Role Permission Matrix

### Legend

- ✅ Permitted
- ❌ Denied
- 🔶 Conditional (see notes section)
- 📋 Own data only

---

### 3.1 Account Management

| Action                        | Farmer | Officer |     Manager     |  District Admin  | System Admin |
| ----------------------------- | :----: | :-----: | :-------------: | :--------------: | :----------: |
| Self-register                 |   ✅   |   ❌    |       ❌        |        ❌        |      ✅      |
| Login                         |   ✅   |   ✅    |       ✅        |        ✅        |      ✅      |
| View own profile              |   📋   |   📋    |       📋        |        📋        |      ✅      |
| Edit own profile              |   📋   |   📋    |       📋        |        📋        |      ✅      |
| Change own password           |   ✅   |   ✅    |       ✅        |        ✅        |      ✅      |
| Reset another user's password |   ❌   |   ❌    |       ❌        |        ❌        |      ✅      |
| Create staff accounts         |   ❌   |   ❌    | 🔶 centre only  | 🔶 district only |      ✅      |
| Suspend/deactivate user       |   ❌   |   ❌    | 🔶 centre staff | 🔶 managers only |      ✅      |
| Assign/change roles           |   ❌   |   ❌    |       ❌        |        ❌        |      ✅      |
| View audit logs (own actions) |   ✅   |   ✅    |       ✅        |        ✅        |      ✅      |
| View audit logs (others)      |   ❌   |   ❌    |    🔶 centre    |   🔶 district    |      ✅      |

---

### 3.2 Farmer Profile and Produce

| Action                                   | Farmer | Officer | Manager | District Admin | System Admin |
| ---------------------------------------- | :----: | :-----: | :-----: | :------------: | :----------: |
| Create own farmer profile                |   ✅   |   ❌    |   ❌    |       ❌       |      ✅      |
| Edit own farmer profile                  |   📋   |   ❌    |   ❌    |       ❌       |      ✅      |
| View farmer profile (during procurement) |   ❌   |   ✅    |   ✅    |    🔶 read     |      ✅      |
| Add/edit own produce batch               |   📋   |   ❌    |   ❌    |       ❌       |      ✅      |
| Upload own documents                     |   ✅   |   ❌    |   ❌    |       ❌       |      ✅      |
| Verify farmer documents                  |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |

---

### 3.3 Centre and Capacity Management

| Action                            | Farmer | Officer | Manager | District Admin | System Admin |
| --------------------------------- | :----: | :-----: | :-----: | :------------: | :----------: |
| View centre list/details (public) |   ✅   |   ✅    |   ✅    |       ✅       |      ✅      |
| Create new centre                 |   ❌   |   ❌    |   ❌    |       ❌       |      ✅      |
| Edit centre details               |   ❌   |   ❌    |   ✅    |  🔶 emergency  |      ✅      |
| Configure centre capacity         |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |
| Configure operating hours         |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |
| Temporarily close centre          |   ❌   |   ❌    |   ✅    |       ✅       |      ✅      |
| View all centres in district      |   ❌   |   ❌    |   ❌    |       ✅       |      ✅      |

---

### 3.4 Slot Management

| Action                       | Farmer | Officer | Manager | District Admin | System Admin |
| ---------------------------- | :----: | :-----: | :-----: | :------------: | :----------: |
| View available slots         |   ✅   |   ✅    |   ✅    |       ✅       |      ✅      |
| Create/edit slot definitions |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |
| Cancel a slot                |   ❌   |   ❌    |   ✅    |  🔶 emergency  |      ✅      |

---

### 3.5 Booking Management

| Action                         | Farmer |    Officer     |   Manager    | District Admin | System Admin |
| ------------------------------ | :----: | :------------: | :----------: | :------------: | :----------: |
| Create own booking             |   ✅   |  🔶 on behalf  | 🔶 on behalf |       ❌       |      ✅      |
| View own booking               |   📋   |       ❌       |      ❌      |       ❌       |      ✅      |
| View all bookings at centre    |   ❌   |       ✅       |      ✅      |    🔶 read     |      ✅      |
| Cancel own booking             |   📋   |       ❌       |      ❌      |       ❌       |      ✅      |
| Cancel any booking (centre)    |   ❌   | 🔶 with reason |      ✅      |       ❌       |      ✅      |
| Reschedule own booking         |   📋   |       ❌       |      ❌      |       ❌       |      ✅      |
| Reschedule booking (on behalf) |   ❌   |  🔶 emergency  |      ✅      |       ❌       |      ✅      |

---

### 3.6 Token and Check-In

| Action                     | Farmer | Officer | Manager | District Admin | System Admin |
| -------------------------- | :----: | :-----: | :-----: | :------------: | :----------: |
| View own QR token          |   📋   |   ❌    |   ❌    |       ❌       |      ✅      |
| Regenerate own token       |   📋   |   ❌    |   ❌    |       ❌       |      ✅      |
| Scan and validate QR token |   ❌   |   ✅    |   ✅    |       ❌       |      ✅      |
| Manually check in a farmer |   ❌   |   ✅    |   ✅    |       ❌       |      ✅      |

---

### 3.7 Queue Management

| Action                    | Farmer | Officer | Manager | District Admin | System Admin |
| ------------------------- | :----: | :-----: | :-----: | :------------: | :----------: |
| View own queue position   |   📋   |   ❌    |   ❌    |       ❌       |      ✅      |
| View full centre queue    |   ❌   |   ✅    |   ✅    |    🔶 read     |      ✅      |
| Call next farmer          |   ❌   |   ✅    |   ✅    |       ❌       |      ✅      |
| Skip a farmer temporarily |   ❌   |   ✅    |   ✅    |       ❌       |      ✅      |
| Reorder queue manually    |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |
| Pause / resume queue      |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |

---

### 3.8 Procurement Operations

| Action                              | Farmer |      Officer       | Manager | District Admin | System Admin |
| ----------------------------------- | :----: | :----------------: | :-----: | :------------: | :----------: |
| Record weighment                    |   ❌   |         ✅         |   ✅    |       ❌       |      ✅      |
| Submit weighment correction         |   ❌   |         ✅         |   ✅    |       ❌       |      ✅      |
| Approve weighment correction        |   ❌   |         ❌         |   ✅    |       ❌       |      ✅      |
| Record quality inspection           |   ❌   |         ✅         |   ✅    |       ❌       |      ✅      |
| Override INSPECTION_FAIL            |   ❌   |         ❌         |   ✅    |       ❌       |      ✅      |
| Approve procurement (std)           |   ❌   | 🔶 below threshold |   ✅    |       ❌       |      ✅      |
| Approve procurement (high-value)    |   ❌   |         ❌         |   ✅    |       ❌       |      ✅      |
| Reject procurement                  |   ❌   |         ✅         |   ✅    |       ❌       |      ✅      |
| Place procurement ON_HOLD           |   ❌   |         ✅         |   ✅    |       ❌       |      ✅      |
| Override procurement decision       |   ❌   |         ❌         |   ✅    |  🔶 emergency  |      ✅      |
| View own procurement record         |   📋   |         ❌         |   ❌    |       ❌       |      ✅      |
| View all centre procurement records |   ❌   |         ✅         |   ✅    |    🔶 read     |      ✅      |

---

### 3.9 Payment Management

| Action                          | Farmer | Officer | Manager | District Admin | System Admin |
| ------------------------------- | :----: | :-----: | :-----: | :------------: | :----------: |
| View own payment status         |   📋   |   ❌    |   ❌    |       ❌       |      ✅      |
| View all centre payment records |   ❌   | 🔶 read |   ✅    |    🔶 read     |      ✅      |
| Initiate payment                |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |
| Confirm / fail payment          |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |
| Manually retry payment          |   ❌   |   ❌    |   ✅    |       ❌       |      ✅      |

---

### 3.10 Equipment, Staff, and Admin

| Action                        | Farmer | Officer |    Manager    | District Admin | System Admin |
| ----------------------------- | :----: | :-----: | :-----------: | :------------: | :----------: |
| View equipment status         |   ❌   |   ✅    |      ✅       |    🔶 read     |      ✅      |
| Add/update equipment record   |   ❌   |   ❌    |      ✅       |       ❌       |      ✅      |
| Assign staff to centre        |   ❌   |   ❌    |      ✅       |       ❌       |      ✅      |
| View district analytics       |   ❌   |   ❌    |      ❌       |       ✅       |      ✅      |
| Configure system settings     |   ❌   |   ❌    |      ❌       |       ❌       |      ✅      |
| Manage notification templates |   ❌   |   ❌    |      ❌       |       ❌       |      ✅      |
| View security events          |   ❌   |   ❌    |      ❌       |       ❌       |      ✅      |
| Export audit logs             |   ❌   |   ❌    | 🔶 own centre |  🔶 district   |      ✅      |

---

## 4. Conditional Permission Definitions

| Code               | Condition                                                             |
| ------------------ | --------------------------------------------------------------------- |
| 🔶 on behalf       | Only with explicit farmer consent recorded in the system              |
| 🔶 below threshold | Below the weight/value threshold configured by Manager                |
| 🔶 centre only     | Limited to their assigned centre's data                               |
| 🔶 district only   | Limited to centres within their assigned district                     |
| 🔶 emergency       | Requires documented reason; mandatory audit log; System Admin alerted |
| 🔶 read            | Read-only; no write or delete permissions                             |

---

## 5. Role Assignment Rules

| Rule ID | Rule                                                                              |
| ------- | --------------------------------------------------------------------------------- |
| RA-01   | Every user must have exactly one primary role at account creation                 |
| RA-02   | A user cannot simultaneously hold both FARMER and any staff role                  |
| RA-03   | A Procurement Officer is assigned to one primary centre                           |
| RA-04   | A Centre Manager manages exactly one centre at a time                             |
| RA-05   | A District Admin is assigned a specific set of centre IDs                         |
| RA-06   | Role changes may only be performed by System Admin                                |
| RA-07   | All role changes are recorded in the audit log                                    |
| RA-08   | Deactivated users retain their role record for audit purposes but lose all access |

---

## 6. Data Isolation Rules

| Rule ID | Rule                                                                                |
| ------- | ----------------------------------------------------------------------------------- |
| DI-01   | Farmer A must never access Farmer B's profile, bookings, tokens, or payment records |
| DI-02   | Officer at Centre X may not access Centre Y's operational data                      |
| DI-03   | Centre Manager data access is limited to their assigned centre                      |
| DI-04   | District Admin data access is strictly limited to their assigned district's centres |
| DI-05   | All API queries must be parameterised with the actor's scope ID                     |
| DI-06   | System Admin is exempt from isolation rules; all cross-scope access is audit-logged |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
