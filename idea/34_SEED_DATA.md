# 34 — SEED DATA ARCHITECTURE & SPECIFICATIONS

## SmartProcure: Safe Non-Production Seed Environment Specifications

---

## 1. Seed Data Security & Isolation Mandates

1. **NON-PRODUCTION ONLY**: Seed scripts (`backend/src/database/seeds/`) are strictly restricted to `development` and `test` environments (`NODE_ENV !== 'production'`).
2. **Zero Real PII**: Real farmer names, Aadhaar numbers, phone numbers, or actual bank account details **MUST NEVER** exist in seed data files or version control.
3. **Fixed Deterministic UUIDs**: Seed data uses fixed, deterministic UUIDs to allow automated E2E test suites (Playwright/Vitest) to reference stable entities.

---

## 2. Mandatory Core System Seeds (`01_system_roles_and_permissions.js`)

```javascript
// System Roles Seed Data Blueprint
export const SEED_ROLES = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    code: "FARMER",
    name: "Farmer",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    code: "PROCUREMENT_OFFICER",
    name: "Procurement Officer",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    code: "CENTRE_MANAGER",
    name: "Centre Manager",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    code: "DISTRICT_ADMIN",
    name: "District Administrator",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    code: "SYSTEM_ADMIN",
    name: "System Administrator",
  },
];

export const SEED_CROPS = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    code: "CROP_WHEAT",
    name: "Wheat",
    default_unit: "KG",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    code: "CROP_PADDY",
    name: "Paddy (Rice)",
    default_unit: "KG",
  },
];
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
