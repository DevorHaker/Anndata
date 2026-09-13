# 10 — STAFF & EQUIPMENT DATABASE SCHEMA

## SmartProcure: Staff Centre Assignments, Equipment Registry, and Maintenance Logs

---

## 1. Table Specifications

### 1.1 `centre_staff`

Junction table mapping operational staff (`PROCUREMENT_OFFICER`, `CENTRE_MANAGER`) to assigned centres.

```sql
CREATE TABLE centre_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  assignment_role VARCHAR(50) NOT NULL,       -- 'PRIMARY_OFFICER', 'STATION_OPERATOR', 'CENTRE_MANAGER'
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_from DATE NOT NULL,
  assigned_until DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_staff_active_assignment UNIQUE (user_id, centre_id, is_active)
);

CREATE INDEX idx_staff_centre ON centre_staff(centre_id);
```

### 1.2 `equipment_registry`

Hardware devices deployed at procurement centres (Weighbridge, Quality Testing Kit, QR Scanners).

```sql
CREATE TABLE equipment_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
  equipment_code VARCHAR(50) NOT NULL UNIQUE, -- E.g. 'WB-LDH-01', 'QM-LDH-02'
  equipment_type VARCHAR(50) NOT NULL,        -- 'WEIGHBRIDGE', 'MOISTURE_METER', 'QR_SCANNER', 'PRINTER'
  make_model VARCHAR(150) NULL,
  serial_number VARCHAR(100) NULL,
  calibration_date DATE NULL,
  next_calibration_due DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'FAULTY', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_centre ON equipment_registry(centre_id);
```

### 1.3 `equipment_maintenance_logs`

Fault reports and maintenance history.

```sql
CREATE TABLE equipment_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment_registry(id) ON DELETE CASCADE,
  fault_reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reported_by UUID NOT NULL REFERENCES users(id),
  fault_type VARCHAR(50) NOT NULL,            -- 'CALIBRATION_DRIFT', 'HARDWARE_FAILURE', 'POWER_OFF'
  description TEXT NOT NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL REFERENCES users(id),
  resolution_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
