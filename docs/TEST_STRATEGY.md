# Automated Test Strategy & Quality Gates — SmartProcure

## 1. Test Pyramid & Execution Suite

```
          / \
         /   \      E2E Journey & Flow Validation (Vitest Integration)
        /     \
       /-------\    Integration & API Endpoint Tests (Phases 5-13)
      /         \
     /-----------\  Unit & Business Calculation Tests (MSP, Weighment, Deductions)
```

---

## 2. Test Execution Commands
* **Run All Backend Integration & Security Tests**:
  ```bash
  cd backend && npx vitest run
  ```
* **Run Frontend Production Compilation Build**:
  ```bash
  cd frontend && npm run build
  ```

---

## 3. Automated Test Coverage Table

| Test Suite | File | Tests Count | Scope Covered |
| :--- | :--- | :--- | :--- |
| **Auth & Security** | `auth.test.ts`, `rbac.test.ts` | 12 | Password hashing, JWT tokens, RBAC permissions. |
| **Error & Validation** | `error.test.ts`, `health.test.ts` | 4 | Standardized 404, 501, and health endpoints. |
| **Farmer & Mandi** | `phase6.test.ts` | 8 | Farmer profile, land holdings, centre configuration. |
| **Slots & Priority** | `phase7.test.ts` | 12 | Recommendations, dynamic slot allocation. |
| **Token & Gate Queue** | `phase8.test.ts` | 15 | QR token generation, check-in, priority queue. |
| **Procurement & MSP** | `phase9.test.ts` | 11 | Gross/tare weighment, quality deduction, MSP computation. |
| **Payment & Traceability** | `phase10.test.ts` | 12 | Idempotent DBT payment creation, bank handoff, QR trace. |
| **Intelligence Engine** | `phase11.test.ts` | 10 | Machine learning ETA prediction, confidence scoring, what-if. |
| **Notifications & Sync** | `phase12.test.ts` | 7 | Multichannel dispatcher, i18n, IndexedDB offline sync. |
| **Phase 13 Hardening** | `phase13.test.ts` | 8 | Executive analytics, IDOR protection, mass assignment whitelist. |
