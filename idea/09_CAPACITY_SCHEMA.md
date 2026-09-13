# 09 — CAPACITY & OVERRIDE DATABASE SCHEMA

## SmartProcure: Dynamic Operational Capacity Model and Overrides

---

## 1. Dynamic Capacity Calculation Architecture

Centre capacity is not a static integer. Effective capacity is computed dynamically:

$$\text{EffectiveCapacity} = \min\left(\text{BaseSlotCapacity}, \text{StaffCapacityFactor} \times \text{EquipmentCapacityFactor}\right) \pm \text{DynamicAdjustment}$$

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CAPACITY MODEL ARCHITECTURE                             │
│                                                                                        │
│  Base Configured Slot Capacity  ───► [ Base Table: `slots.total_capacity` ]           │
│                                                   │                                    │
│  Staff Absence / Equipment Fault ──► [ Adjustment: `centre_capacity_adjustments` ]     │
│                                                   │                                    │
│  Dynamic Effective Capacity     ───► [ Computed: `available_capacity` ]              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Specifications

### 2.1 `centre_capacity_adjustments`

Temporary capacity overrides caused by equipment breakdown, staff shortages, or weather events.

```sql
CREATE TABLE centre_capacity_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  slot_id UUID NULL REFERENCES slots(id) ON DELETE CASCADE, -- NULL applies to whole day
  capacity_delta INTEGER NOT NULL,            -- Positive (extra intake) or Negative (reduced intake)
  reason_code VARCHAR(50) NOT NULL,           -- 'EQUIPMENT_BREAKDOWN', 'STAFF_ABSENCE', 'WEATHER_DELAY', 'OVERTIME_EXTRA'
  description TEXT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capacity_adj_centre_date ON centre_capacity_adjustments(centre_id, effective_date);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
