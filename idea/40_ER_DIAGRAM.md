# 40 — COMPLETE LOGICAL ER DIAGRAM

## SmartProcure: Master Relational Entity-Relationship Diagram & Cardinalities

---

## 1. Complete System ASCII ER Diagram

```
 ┌──────────────┐          1:1          ┌──────────────┐          1:1          ┌──────────────────────┐
 │    users     │ ────────────────────► │   farmers    │ ────────────────────► │   farmer_profiles    │
 └──────┬───────┘                       └──────┬───────┘                       └──────────────────────┘
        │                                      │
        │ 1:N                                  │ 1:N
        ▼                                      ▼
 ┌──────────────┐                       ┌──────────────┐          1:N          ┌──────────────────────┐
 │user_sessions │                       │farmer_produce│ ◄──────────────────── │      crop_types      │
 └──────────────┘                       └──────────────┘                       └──────────┬───────────┘
                                               │                                          │
                                               │ 1:N                                      │ 1:N
                                               ▼                                          ▼
┌──────────────────┐           1:N      ┌──────────────┐          N:1          ┌──────────────────────┐
│procurement_centre│ ◄───────────────── │   bookings   │ ────────────────────► │        slots         │
└────────┬─────────┘                    └──────┬───────┘                       └──────────────────────┘
         │                                     │
         │ 1:N                                 │ 1:1
         ▼                                     ▼
┌──────────────────┐                    ┌──────────────┐          1:1          ┌──────────────────────┐
│  equipment_reg   │                    │   tokens     │ ────────────────────► │       checkins       │
└──────────────────┘                    └──────────────┘                       └──────────┬───────────┘
                                                                                          │
                                                                                          │ 1:1
                                                                                          ▼
                                                                               ┌──────────────────────┐
                                                                               │    queue_entries     │
                                                                               └──────────┬───────────┘
                                                                                          │
                                                                                          │ 1:1
                                                                                          ▼
                                                                               ┌──────────────────────┐
                                                                               │  weighment_records   │
                                                                               └──────────┬───────────┘
                                                                                          │
                                                                                          │ 1:1
                                                                                          ▼
                                                                               ┌──────────────────────┐
                                                                               │ quality_inspections  │
                                                                               └──────────┬───────────┘
                                                                                          │
                                                                                          │ 1:1
                                                                                          ▼
                                                                               ┌──────────────────────┐
                                                                               │     procurements     │
                                                                               └──────────┬───────────┘
                                                                                          │
                                                                                          │ 1:1
                                                                                          ▼
                                                                               ┌──────────────────────┐
                                                                               │       payments       │
                                                                               └──────────────────────┘
```

---

## 2. Key Cardinality Rules Summary

- `users` : `farmers` = **1 : 1** (One user account maps to one farmer entity).
- `farmers` : `farmer_bank_accounts` = **1 : N** (One farmer may have multiple bank accounts; 1 marked primary).
- `procurement_centres` : `slots` = **1 : N** (One centre defines multiple hourly slots).
- `slots` : `bookings` = **1 : N** (One slot accommodates multiple farmer bookings up to `total_capacity`).
- `bookings` : `tokens` = **1 : 1** (One booking produces exactly one cryptographic QR token).
- `bookings` : `checkins` = **1 : 1** (One booking can be checked in at the gate scan exactly once).
- `bookings` : `procurements` = **1 : 1** (One booking maps to exactly one finalized procurement record).
- `procurements` : `payments` = **1 : 1** (One procurement generates exactly one financial disbursement).

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
