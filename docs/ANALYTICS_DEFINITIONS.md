# Centralized KPI & Analytics Definitions — SmartProcure

## 1. Governance & Timezone Standard
* **Authoritative Timestamp Storage**: PostgreSQL `TIMESTAMPTZ` (UTC).
* **Reporting Standard Timezone**: `Asia/Kolkata` (Indian Standard Time, IST / UTC+5:30).
* **Source of Truth**: Authoritative PostgreSQL database transaction tables (`procurements`, `payments`, `tokens`, `slots`, `farmers`).

---

## 2. Core KPI Catalog & Formulas

### A. Centre Performance & Queue KPIs
1. **Average Waiting Time**:
   * **Formula**: $\frac{\sum (\text{actual\_service\_start} - \text{check\_in\_time})}{\text{COUNT}(\text{completed\_queue\_entries})}$
   * **Target**: $< 20.0$ minutes.
2. **P50 / P95 Waiting Time**:
   * **Formula**: 50th and 95th percentile of token wait duration distribution.
   * **Target**: $\text{P50} < 15.0$ mins, $\text{P95} < 35.0$ mins.
3. **Slot Utilization Rate**:
   * **Formula**: $\frac{\text{Booked Capacity (Quintals)}}{\text{Total Mandi Daily Capacity (Quintals)}} \times 100$
   * **Target**: $85\% - 95\%$.

### B. Procurement & Quality KPIs
1. **Quality Rejection Rate**:
   * **Formula**: $\frac{\text{Total Rejected Quantity (Kg)}}{\text{Total Quantity Received (Kg)}} \times 100$
   * **Target**: $< 5.0\%$.
2. **Net Weight Accuracy**:
   * **Formula**: $\text{Net Weight} = \text{Gross Weight} - \text{Tare Weight}$ (Strict decimal calculation).

### C. Payment & Financial KPIs
1. **Procurement-to-Payment Latency**:
   * **Formula**: $\frac{\sum (\text{payment\_completed\_timestamp} - \text{procurement\_finalized\_timestamp})}{\text{COUNT}(\text{successful\_payments})}$
   * **Target**: $< 24.0$ hours (Direct Benefit Transfer target).
2. **Reconciliation Mismatch Rate**:
   * **Formula**: $\frac{\text{Discrepant Payment Records}}{\text{Total Processed Payments}} \times 100$
   * **Target**: $0.0\%$.

### D. System Health & Offline Resilience KPIs
1. **Notification Delivery Rate**:
   * **Formula**: $\frac{\text{Delivered Notifications}}{\text{Total Dispatched Notifications}} \times 100$
   * **Target**: $> 98.0\%$.
2. **Sync Conflict Rate**:
   * **Formula**: $\frac{\text{Conflicted Offline Actions}}{\text{Total Synced Actions}} \times 100$
   * **Target**: $< 2.0\%$.
