# 15 — INTELLIGENCE ARCHITECTURE

## SmartProcure: Recommendation Engine, Congestion Detection, and Phased Analytics

---

## 1. Intelligence Architecture Principles

1. **Pluggable Engine Architecture**: The intelligence engine is designed as a pluggable abstraction (`RecommendationEngineInterface`).
2. **Phase 1 Strategy**: Starts strictly **RULE-BASED** for Day 1 production deployment. No machine learning dependencies required at launch.
3. **Database Boundary Protection**: The Intelligence Module **NEVER** writes directly to core operational database tables (`bookings`, `queue_entries`). It communicates exclusively via domain service interfaces.
4. **Fallback Safety**: If intelligence calculations time out or fail, the system falls back to default mathematical baseline values (e.g., straight Haversine distance, default 15-min ETA).

---

## 2. Pluggable Recommendation Engine Architecture

```
                       ┌─────────────────────────────────────────┐
                       │      RecommendationService (Facade)     │
                       └────────────────────┬────────────────────┘
                                            │ Delegates to Active Engine
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │     RecommendationEngineInterface       │
                       └────────────────────┬────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │ (Phase 1 MVP - Active)           │ (Phase 4 - Data Threshold)        │ (Phase 5 - Scale)
         ▼                                  ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  RuleBasedEngine │               │StatisticalEngine │               │  MLModelEngine   │
└──────────────────┘               └──────────────────┘               └──────────────────┘
```

---

## 3. Phase 1 Rule-Based Recommendation Scoring Algorithm

For a farmer located at $(Lat_F, Long_F)$ declaring crop $C$ on date $D$:

```
Score(Centre_i) = W_1 * DistanceScore + W_2 * AvailabilityScore + W_3 * QueueCongestionScore + W_4 * OperationalScore
```

### Sub-Score Definitions

1. **Distance Score ($S_{dist}$)**:
   $$S_{dist} = \max\left(0, 100 - \frac{\text{HaversineDistance}(F, C_i)}{\text{MaxRadiusKm}} \times 100\right)$$
2. **Slot Availability Score ($S_{avail}$)**:
   $$S_{avail} = \frac{\text{AvailableSlots}(C_i, D)}{\text{TotalConfiguredCapacity}(C_i, D)} \times 100$$
3. **Queue Congestion Score ($S_{cong}$)**:
   $$S_{cong} = \max\left(0, 100 - \frac{\text{ActiveWaitingFarmers}(C_i)}{\text{MaxQueueCapacity}(C_i)} \times 100\right)$$
4. **Operational Status Score ($S_{ops}$)**:
   - Status = `ACTIVE`: 100
   - Status = `PARTIAL` (Equipment fault): 50
   - Status = `CLOSED`: 0 (Hard Filter Out)

### Weights Allocation

$$W_1 = 0.4, \quad W_2 = 0.3, \quad W_3 = 0.2, \quad W_4 = 0.1$$

---

## 4. Congestion Detection & Alert Engine

A background job computes the **Congestion Index ($CI$)** for each centre every 5 minutes:

$$CI = \left(0.6 \times \frac{\text{Active Queue Depth}}{\text{Max Daily Capacity}}\right) + \left(0.4 \times \frac{\text{Slot Fill Rate}}{\text{Total Slots}}\right)$$

### Congestion Threshold Actions

- **$CI < 0.70$ (NORMAL)**: Green indicator on UI dashboard.
- **$0.70 \le CI < 0.90$ (YELLOW - Warning)**:
  - Triggers `CONGESTION_YELLOW` alert to Centre Manager.
  - Recommendation engine lowers weighting for this centre.
- **$CI \ge 0.90$ (RED - Congested)**:
  - Triggers `CONGESTION_RED` critical alert to Manager + District Admin.
  - Generates cross-centre **Load Balancing Suggestion** to redirect new bookings to nearby under-utilized centres.

---

## 5. Phased ML Migration Roadmap

| Phase       | Milestone / Trigger Data Threshold  | Intelligence Engine Implementation                                               |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| **Phase 1** | Launch Day 1                        | Pure Rule-Based Engine (Distance, Slot %, Status)                                |
| **Phase 2** | 30 Days Data (10,000+ procurements) | Statistical Baseline Engine (Historical crop processing times, time-of-day ETAs) |
| **Phase 3** | 90 Days Data                        | Statistical No-Show Prediction Scoring (Adjusts slot overbooking safety margins) |
| **Phase 4** | 180+ Days Data                      | ML Model Engine (XGBoost / LightGBM for dynamic capacity & demand forecasting)   |

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
