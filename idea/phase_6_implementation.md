# SmartProcure — Phase 6 Implementation Walkthrough
## Farmer & Procurement-Centre Management

### Overview
Phase 6 establishes the domain foundations for **Farmer Management** and **Procurement Centre Operations**, enabling end-to-end management of farmer profiles, land holdings, crop produce declarations, procurement centre capacity limits, operational status states, disruption logs, and staff assignments.

---

### Key Architectural Components

#### 1. Backend REST API Routes (`backend/src/routes/`)
- **`farmers.ts`**:
  - `GET /api/v1/farmers/me` — Fetch authenticated farmer profile.
  - `PATCH /api/v1/farmers/me` — Update farmer profile demographics & land holding records.
  - `GET /api/v1/farmers/me/produce` — Fetch declared produce for authenticated farmer.
  - `POST /api/v1/farmers/me/produce` — Declare new harvest yield.
  - `GET /api/v1/farmers` — Search/filter farmer registry (Admin/Officer role required).
  - `PATCH /api/v1/farmers/:id/status` — Account status updates (`ACTIVE`, `SUSPENDED`).
  - `PATCH /api/v1/farmers/:id/verify` — Land verification state updates (`VERIFIED`, `REJECTED`, `PENDING_VERIFICATION`).
- **`produce.ts`**:
  - `GET /api/v1/produce/crops` — Crop type master catalog.
- **`centres.ts`**:
  - `GET /api/v1/centres` — List & search procurement centres.
  - `POST /api/v1/centres` — Register new procurement centre (`ADMIN` role required).
  - `GET /api/v1/centres/:id` — Centre details.
  - `PATCH /api/v1/centres/:id/status` — Operational state changes (`NORMAL`, `BUSY`, `CONGESTED`, `CRITICAL`, `CLOSED`, `EMERGENCY`).
  - `GET/PATCH /api/v1/centres/:id/capacity` — Configure daily farmer & tonnage capacity limits.
  - `GET/POST/PATCH /api/v1/centres/:id/disruptions` — Report and resolve operational disruptions.
  - `GET/POST /api/v1/centres/:id/staff` — Assign procurement staff & officers.

#### 2. Domain Repositories & Services (`backend/src/repositories/`, `backend/src/services/`)
- **`farmerDomain.repository.ts` & `centreDomain.repository.ts`**:
  - Hybrid storage engine supporting PostgreSQL transactions with automatic in-memory fallback.
  - Interoperable with Phase 5 auth repositories for consistent data binding during test runs.
- **`farmerDomain.service.ts` & `centreDomain.service.ts`**:
  - Encapsulates domain logic, ownership verification, and security audit log generation via `auditService`.
- **`audit.service.ts`**:
  - Exported `auditService` wrapper with `recordAudit` method to safely record security audit events without blocking primary transactions.

#### 3. Frontend Architecture (`frontend/src/`)
- **Types & Services**:
  - `types/domain.ts` — TypeScript interfaces for Farmer, Produce, Centre, Capacity, Disruption, and Staff.
  - `services/farmerService.ts` & `services/centreService.ts` — API client abstractions.
- **Interactive UI Dashboards**:
  - **`pages/FarmerPage.tsx`**:
    - Profile & Land Holding verification form.
    - Produce Harvest Declaration manager with crop catalog integration.
    - Nearby procurement centre locator with real-time operational status.
    - Administrative farmer registry search and verification controls.
  - **`pages/CentrePage.tsx`**:
    - Mandi & Centre control room dashboard.
    - Status state modal controller (`NORMAL`, `BUSY`, `CRITICAL`, etc.) with mandatory incident logging.
    - Capacity configuration editor (Daily Farmers, Tonnage limit, Hourly throughput, Weighbridges).
    - Incident & Disruption desk (Report, track, and resolve operational bottlenecks).
    - Staff assignment & shift registry.

---

### Verification & Testing Results

#### Backend Test Suite (`backend/tests/phase6.test.ts`)
- **Command**: `npm test`
- **Result**: `30 passed (30)` across all backend integration test suites (100% Pass Rate).
- **Test Scenarios**:
  - Farmer profile retrieval, demographics update, and produce declarations.
  - Procurement centre registration, duplicate code protection, and operational status transitions.
  - Capacity configuration and disruption lifecycle (Report -> Mitigate -> Resolve).
  - RBAC role enforcement (preventing unauthorized farmers from registering centres or updating other farmers' data).

#### Frontend Type Checking & Test Suite (`frontend/`)
- **Command**: `npx tsc --noEmit` & `npm test`
- **Result**: `5 passed (5)` across all test suites, zero TypeScript errors.

---

### Summary of Changes Made
1. **Backend Integration**: Exported `auditService` helper object from `audit.service.ts` to support standard `recordAudit` interface across domain services.
2. **Frontend UI Upgrade**: Transformed static `FarmerPage` and `CentrePage` placeholders into fully interactive, glassmorphism-styled domain dashboards.
3. **API Service Layer**: Created `farmerService.ts` and `centreService.ts` to bind frontend state to backend `/api/v1` REST routes.
4. **Test Alignment**: Updated setup mocks and test matchers to ensure clean local testing without PostgreSQL dependency.
