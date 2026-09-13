# 17 — ANALYTICS AND REPORTING REQUIREMENTS

## SmartProcure: Dashboard, Metrics, and Report Specifications

---

## 1. Reporting Philosophy

**Operational Metrics**: Real-time or near-real-time data describing the current state of operations. Used for immediate decision-making.

**Analytical Metrics**: Aggregated, historical data showing patterns, trends, and performance over time. Used for strategic and operational planning.

**Intelligence Metrics**: Derived metrics and scores produced by the intelligence layer. Used for system improvement and resource planning.

---

## 2. FARMER DASHBOARD

**Purpose:** Farmer's personal view of their history, active status, and payment tracking.

### 2.1 Active View (Today)

| Metric / Component  | Description                                                    | Data Source    | Update Frequency |
| ------------------- | -------------------------------------------------------------- | -------------- | ---------------- |
| Active Booking Card | Shows today's booking with centre, slot time, and token button | Booking module | Real-time        |
| Live Queue Position | Farmer's current position in queue                             | Queue module   | Every 30 seconds |
| ETA                 | Estimated waiting time                                         | ETA module     | Every 30 seconds |
| Token Display       | QR code for check-in (downloadable)                            | Token module   | On demand        |

### 2.2 History View

| Report              | Description                                      | Filters               |
| ------------------- | ------------------------------------------------ | --------------------- |
| Booking History     | All past bookings with status                    | Date range, status    |
| Procurement History | All past procurements with weight, grade, amount | Date range, crop type |
| Payment History     | All payments with amount, status, reference      | Date range, status    |
| No-Show History     | No-show record with dispute status               | Date range            |

### 2.3 Notifications Inbox

- Chronological list of all notifications
- Unread count badge
- Mark as read; mark all as read

---

## 3. PROCUREMENT OFFICER DASHBOARD

**Purpose:** Real-time operational tool for officers to manage their centre's queue and procurement activities.

### 3.1 Live Operations Panel

| Metric                      | Description                                             | Update Freq |
| --------------------------- | ------------------------------------------------------- | ----------- |
| Current Queue               | Ordered list of all WAITING, CALLED, IN_SERVICE farmers | Real-time   |
| Queue Depth                 | Total waiting farmers                                   | Real-time   |
| Current ETA (last in queue) | Estimated time for last farmer to be served             | Real-time   |
| Next Farmer to Call         | Name, crop, estimated quantity                          | Real-time   |

### 3.2 Today's Activity Summary (Read-Only)

| Metric                       | Description                                   |
| ---------------------------- | --------------------------------------------- |
| Total Check-Ins Today        | Count of confirmed check-ins                  |
| Total Procurements Completed | Count of APPROVED + REJECTED                  |
| Total Weight Processed (kg)  | Sum of net weights from APPROVED procurements |
| Average Processing Time      | Rolling average for last 10 procurements      |
| Pending Decisions            | Count of PENDING_DECISION procurements        |

### 3.3 Officer-Specific Metrics

| Metric                            | Description                |
| --------------------------------- | -------------------------- |
| Procurements Handled (Today)      | Officer-specific count     |
| Average Processing Time (Officer) | Compared to centre average |

---

## 4. CENTRE MANAGER DASHBOARD

**Purpose:** Comprehensive operational dashboard for managing centre health, capacity, and performance.

### 4.1 Live Operations Overview

| Widget                  | Data                                               | Update Freq     |
| ----------------------- | -------------------------------------------------- | --------------- |
| Congestion Gauge        | Current congestion ratio (%) with colour indicator | Every 5 minutes |
| Queue Depth vs Capacity | Current queue / daily capacity bar                 | Real-time       |
| Active Staff Count      | On-duty vs total staff                             | Shift-based     |
| Equipment Status Panel  | Each piece of equipment with status                | On event        |
| Current Slot Status     | All today's slots with fill %, checked-in count    | Real-time       |
| Pending Approvals       | Count of procurements awaiting manager decision    | Real-time       |
| ON_HOLD SLA Timer       | Countdown for procurements approaching SLA breach  | Real-time       |

### 4.2 Today's Performance Summary

| Metric                     | Description                                |
| -------------------------- | ------------------------------------------ |
| Total Farmers Served       | COMPLETED procurements                     |
| Total Rejected             | REJECTED procurements                      |
| Rejection Rate             | Rejected / Total × 100%                    |
| Total Weight Approved (kg) | Sum of net weights                         |
| Total Amount (INR)         | Sum of calculated amounts                  |
| No-Show Count              | Bookings marked NO_SHOW                    |
| No-Show Rate               | No-shows / Total confirmed bookings × 100% |
| Slot Utilisation           | Confirmed bookings / Total slot capacity   |
| Avg Waiting Time           | Mean queue wait across all farmers         |
| Avg Processing Time        | Mean procurement duration                  |

### 4.3 Weekly/Monthly Trend Reports

| Report                  | Description                          | Filters    |
| ----------------------- | ------------------------------------ | ---------- |
| Daily Throughput Trend  | Farmers served per day               | Date range |
| Utilisation Rate Trend  | Centre utilisation over time         | Date range |
| Equipment Downtime Log  | Hours of downtime per equipment      | Date range |
| No-Show Rate Trend      | Rate over time                       | Date range |
| Quality Rejection Trend | By crop type and grade               | Date range |
| Payment Status Summary  | PENDING / COMPLETED / FAILED counts  | Date range |
| Congestion Events Log   | All YELLOW and RED congestion events | Date range |

### 4.4 Analytics — Operational Intelligence

| Insight                     | Description                                  |
| --------------------------- | -------------------------------------------- |
| Bottleneck Stage            | Most frequently bottlenecked stage this week |
| Peak Hours                  | Time windows with highest farmer arrival     |
| Best Performing Slots       | Slots with highest completion rates          |
| Equipment Reliability Score | Per equipment: uptime ratio                  |
| Staff Productivity          | Procurements per hour per officer            |

### 4.5 Export Capabilities

- Daily summary report: PDF or CSV
- Procurement record export: CSV with all fields
- Payment records export: CSV
- Audit log export: CSV (own centre)
- Date-range filtering for all exports

---

## 5. DISTRICT ADMINISTRATOR DASHBOARD

**Purpose:** Multi-centre oversight, policy compliance, and resource allocation.

### 5.1 District Live Overview

| Widget                      | Description                                                        | Update Freq     |
| --------------------------- | ------------------------------------------------------------------ | --------------- |
| Centre Map                  | Visual map showing all centres with colour-coded congestion status | Every 5 minutes |
| District Congestion Summary | Count of NORMAL / YELLOW / RED centres                             | Every 5 minutes |
| Total District Queue Depth  | Aggregate of all centres' live queues                              | Every 5 minutes |
| Active Centre Count         | Currently ACTIVE vs CLOSED / SUSPENDED                             | On event        |
| Load Balancing Suggestions  | Pending suggestions requiring District Admin decision              | On detection    |

### 5.2 District Performance Summary

| Metric                         | Description                      |
| ------------------------------ | -------------------------------- |
| Total Farmers Served (Today)   | Across all district centres      |
| District-wide Utilisation Rate | Aggregate utilisation            |
| District-wide No-Show Rate     | Aggregate rate                   |
| Highest Queue Centre           | Centre with deepest queue        |
| Lowest Utilisation Centre      | Centre with most unused capacity |
| Total Payment Value (Today)    | Total approved procurement value |
| Payment Completion Rate        | % of payments in COMPLETED state |

### 5.3 Centre Comparison Table

Side-by-side comparison of all district centres on:

- Utilisation rate
- Throughput
- No-show rate
- Equipment availability
- Staff adequacy
- Average waiting time
- Rejection rate
- Payment completion rate

### 5.4 Historical Trends (District Level)

| Report                               | Description                            |
| ------------------------------------ | -------------------------------------- |
| Weekly Performance by Centre         | All metrics per centre, per week       |
| Seasonal Demand Patterns             | Monthly booking volumes by crop type   |
| Cross-Centre Queue Imbalance History | Historical imbalance scores            |
| Equipment Downtime Summary           | By centre, by month                    |
| No-Show Trend by Centre              | Identify problem centres               |
| Payment Batch Report                 | Aggregated by crop, centre, date range |

### 5.5 District Reports (Exportable)

| Report                               | Format   | Audience              |
| ------------------------------------ | -------- | --------------------- |
| Monthly District Procurement Summary | PDF, CSV | Agriculture authority |
| Compliance Audit Export              | JSON     | Audit authority       |
| Payment Batch Export                 | CSV      | Payment agency        |
| Centre Performance Rankings          | PDF      | Internal review       |

---

## 6. SYSTEM ADMINISTRATOR DASHBOARD

**Purpose:** Platform health, security, and configuration management.

### 6.1 System Health Overview

| Metric                   | Description                         | Alert Threshold                   |
| ------------------------ | ----------------------------------- | --------------------------------- |
| API Latency (p95)        | 95th percentile response time       | > 500ms → WARNING                 |
| API Error Rate           | % of 5xx responses                  | > 0.5% → WARNING; > 1% → CRITICAL |
| Active Sessions          | Current active user sessions        | Baseline monitoring               |
| Background Job Health    | Success/failure counts per job type | Any failure → WARNING             |
| Notification Queue Depth | Number of pending notifications     | > 1000 → WARNING                  |
| Database Connection Pool | Active / available connections      | > 80% used → WARNING              |
| Redis Memory Usage       | % of configured Redis memory        | > 80% → WARNING                   |
| Log Error Rate           | Error log events per minute         | Spike → ALERT                     |

### 6.2 User Management Panel

- Total user counts by role
- New registrations (last 24h / 7d / 30d)
- Locked accounts count
- Suspended accounts count
- Recent role changes

### 6.3 Security Events Panel

- Recent failed login attempts (last 24h)
- Account lockout events
- Token fraud attempts
- Admin override events
- Suspicious activity flags

### 6.4 Integration Health

| Integration      | Status                    | Last Success | Failure Count |
| ---------------- | ------------------------- | ------------ | ------------- |
| SMS Provider     | HEALTHY / DEGRADED / DOWN | Timestamp    | 24h count     |
| Email Provider   | HEALTHY / DEGRADED / DOWN | Timestamp    | 24h count     |
| Payment Provider | HEALTHY / DEGRADED / DOWN | Timestamp    | 24h count     |
| Maps API         | HEALTHY / DEGRADED / DOWN | Timestamp    | 24h count     |

### 6.5 Background Jobs Status

| Job Name                  | Last Run  | Status         | Next Scheduled |
| ------------------------- | --------- | -------------- | -------------- |
| NoShow Detection          | Timestamp | SUCCESS/FAILED | Next run time  |
| Congestion Detection      | Timestamp | SUCCESS/FAILED | Next run time  |
| Slot Cleanup              | Timestamp | SUCCESS/FAILED | Next run time  |
| Payment Retry             | Timestamp | SUCCESS/FAILED | Next run time  |
| Slot Count Reconciliation | Timestamp | SUCCESS/FAILED | Next run time  |
| Token Expiry Cleanup      | Timestamp | SUCCESS/FAILED | Next run time  |

---

## 7. ANALYTICS METRIC CLASSIFICATION

### 7.1 Operational Metrics (Real-Time / Near-Real-Time)

These require live data and update continuously during operations:

- Current queue depth
- Live congestion ratio
- Active equipment count
- Current ETA for each farmer
- Pending approvals count
- ON_HOLD SLA timers

### 7.2 Analytical Metrics (Aggregated / Historical)

These require historical aggregation and are computed by batch or on-demand:

- Average waiting time per centre per day
- Centre utilisation rate per day/week/month
- Throughput per centre per week
- No-show rate by day, centre, crop type
- Equipment downtime hours per month
- Quality rejection rate by crop type
- Payment completion rate and average completion time
- Recommendation acceptance rate

### 7.3 Intelligence Metrics (Derived by Intelligence Engine)

These are computed by the intelligence layer and may involve statistical calculations:

- ETA predictions vs actual wait time (accuracy)
- Congestion prediction accuracy
- No-show risk score per booking (Phase 2+)
- Cross-centre imbalance score
- Bottleneck stage frequency and duration
- Processing time baseline per crop type per centre

---

## 8. Report Schedule

| Report                    | Audience                | Frequency                 | Trigger       |
| ------------------------- | ----------------------- | ------------------------- | ------------- |
| Daily Centre Summary      | Manager                 | Daily at 20:00 local time | Scheduled job |
| No-Show Daily Report      | Manager                 | Daily at 20:00            | Scheduled job |
| Weekly Performance Report | Manager, District Admin | Monday 07:00              | Scheduled job |
| Monthly District Report   | District Admin          | 1st of Month 07:00        | Scheduled job |
| Payment Batch Summary     | Manager, District Admin | Daily at 18:00            | Scheduled job |
| System Health Report      | System Admin            | Daily at 08:00            | Scheduled job |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
