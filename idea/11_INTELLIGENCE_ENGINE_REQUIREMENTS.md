# 11 — INTELLIGENCE ENGINE REQUIREMENTS

## SmartProcure: Recommendation, Prediction, and Analytics Intelligence Specifications

---

## 1. Design Philosophy

SmartProcure's intelligence features are designed with a **Realistic Progression Model**:

```
PHASE 1 (MVP):     Rule-Based Logic
                   ↓
PHASE 2 (Growth):  Statistical Models (using 90+ days of historical data)
                   ↓
PHASE 3 (Scale):   Machine Learning Models (validated, production-grade)
```

**No intelligence feature will be marked as "AI-powered" until:**

1. Sufficient real-world data exists to train and validate a model
2. The model outperforms the rule-based baseline by a defined margin
3. The model has been tested in a shadow mode before full deployment

---

## 2. Recommendation Engine

### 2.1 Input Parameters

| Parameter                                     | Source                  | Required                              |
| --------------------------------------------- | ----------------------- | ------------------------------------- |
| Farmer GPS location                           | Device / Farmer profile | Yes (or district pincode as fallback) |
| Crop type                                     | Selected produce batch  | Yes                                   |
| Preferred date                                | Farmer selection        | Yes                                   |
| Estimated quantity (kg)                       | Produce batch           | No (used for capacity match)          |
| Farmer preferences (preferred centre history) | System history          | No (Phase 2+)                         |

### 2.2 Scoring Factors (Rule-Based MVP)

| Factor                                    | Weight | Calculation                                          |
| ----------------------------------------- | ------ | ---------------------------------------------------- |
| Distance                                  | 0.30   | 1 − (distance_km / max_radius_km), clipped to [0, 1] |
| Current queue depth                       | 0.25   | 1 − (queue_depth / daily_capacity)                   |
| Slot availability                         | 0.20   | available_slots / total_slots_for_date               |
| Equipment operational ratio               | 0.15   | operational_count / total_equipment_count            |
| Historical congestion (if data available) | 0.10   | 1 − avg_congestion_ratio_this_weekday_last_4_weeks   |

If historical congestion data is unavailable (< 14 days of data), redistribute its weight equally among other factors.

### 2.3 Centre Eligibility Filter (applied before scoring)

A centre is eligible for recommendation if ALL of the following are true:

- `operational_status = ACTIVE or REDUCED_CAPACITY`
- Accepts the farmer's crop type
- Has available slots for the requested date
- Is within the configured maximum radius from the farmer's location
- Is not approaching full capacity (configurable; default: exclude if slot availability = 0)

### 2.4 Recommendation Output

```json
{
  "recommendations": [
    {
      "rank": 1,
      "centre_id": "uuid",
      "centre_name": "string",
      "distance_km": 5.2,
      "current_queue_depth": 8,
      "estimated_wait_minutes": 24,
      "available_slots": 12,
      "score": 0.874,
      "confidence": "HIGH",
      "explanation": "Nearest centre with low queue and all equipment operational.",
      "available_slot_times": ["09:00–11:00", "11:00–13:00"],
      "next_available_date": null
    },
    {
      "rank": 2,
      "centre_id": "uuid",
      "centre_name": "string",
      "distance_km": 12.4,
      "current_queue_depth": 3,
      "estimated_wait_minutes": 10,
      "available_slots": 6,
      "score": 0.791,
      "confidence": "MEDIUM",
      "explanation": "Very short queue, but farther distance. Recommended for fast service.",
      "available_slot_times": ["11:00–13:00"],
      "next_available_date": null
    }
  ],
  "fallback_triggered": false,
  "engine_version": "rule-based-v1.0",
  "computed_at": "ISO8601"
}
```

### 2.5 Fallback Scenarios

| Scenario                                               | Fallback Behavior                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| No centres within radius                               | Expand radius by 20 km; retry up to 3 times                                        |
| All expanded-radius centres are full on requested date | Return nearest 3 centres with their next available date                            |
| Location unavailable                                   | Use district as fallback; flag `location_precision = DISTRICT`                     |
| No centres accept the crop                             | Return error: NO_COMPATIBLE_CENTRES with crop type and suggestion to contact admin |

### 2.6 Explanation Model (Phase 1)

The explanation is generated from a template lookup based on the top contributing factor:

| Top Factor | Explanation Template                                         |
| ---------- | ------------------------------------------------------------ |
| Distance   | "Nearest compatible centre with sufficient capacity."        |
| Queue      | "Lower expected wait time due to shorter current queue."     |
| Slots      | "More available slot options for your preferred date."       |
| Equipment  | "All equipment operational, reducing processing delay risk." |
| Congestion | "Historically less congested on this day of the week."       |

### 2.7 Pluggable Engine Architecture

All recommendation logic is encapsulated behind the `RecommendationEngine` interface. The engine type is determined at runtime by configuration (`RECOMMENDATION_ENGINE_TYPE`). Switching from rule-based to statistical or ML requires:

1. Implementing the `RecommendationEngine` interface
2. Updating the configuration key
3. No code changes to the booking or API layer

---

## 3. ETA and Waiting-Time Estimation

### 3.1 Input Data

| Input                           | Source                                       |
| ------------------------------- | -------------------------------------------- |
| Farmer's current queue position | Queue module (live)                          |
| Rolling average processing time | Last N completed procurements at this centre |
| Queue pause status              | Queue module                                 |
| Active bottleneck indicator     | Bottleneck detection module                  |

### 3.2 MVP Calculation

```
rolling_avg = AVG(service_end - service_start)
              FROM last 10 completed procurements
              WHERE centre_id = current_centre

ETA_minutes = queue_position × rolling_avg_minutes
```

If N < 5 historical procurements available today, use centre configured default: `default_processing_time_minutes` (configurable per centre, default: 20 minutes).

### 3.3 Adjustment Factors (Phase 2+)

In Phase 2, the ETA model incorporates:

- Crop-type-specific average processing time
- Time-of-day patterns (processing slower in peak hours)
- Staff count impact on processing speed
- Equipment health impact

### 3.4 Output

```json
{
  "queue_position": 7,
  "eta_minutes": 35,
  "eta_confidence": "MEDIUM",
  "last_updated": "ISO8601",
  "rolling_avg_processing_time_minutes": 5.0,
  "queue_status": "NORMAL"
}
```

### 3.5 Update Frequency

- ETA is recalculated every time a procurement is completed (event-triggered)
- ETA is also recalculated when queue pause starts/ends
- Pushed to farmer via server-sent events (SSE) or polling at configurable interval (default: 30 seconds)

### 3.6 Failure Behavior

- If rolling average calculation fails → use default from configuration
- If queue module is unavailable → return `ETA_UNAVAILABLE` with message "Service temporarily unavailable"

---

## 4. Congestion Detection

### 4.1 Input Data

| Input                       | Source                    |
| --------------------------- | ------------------------- |
| Current queue depth         | Queue module (live count) |
| Centre daily capacity       | Capacity module           |
| Centre slot start/end times | Slot module               |
| Equipment operational count | Equipment module          |
| Staff active count          | Staff module              |

### 4.2 Congestion Calculation

```
congestion_ratio = current_queue_depth / effective_daily_capacity

effective_daily_capacity = configured_daily_capacity
                           × equipment_availability_ratio
                           × staff_availability_ratio
```

### 4.3 Alert Thresholds (Configurable)

| Level  | Threshold   | Action                                                 |
| ------ | ----------- | ------------------------------------------------------ |
| NORMAL | < 0.70      | No action                                              |
| YELLOW | 0.70 – 0.89 | Alert Manager                                          |
| RED    | ≥ 0.90      | Alert Manager + District Admin; suggest load balancing |

### 4.4 Detection Frequency

Background job runs every 5 minutes during centre operating hours. Outside operating hours, job is suspended.

### 4.5 Contributing Factors Logged

When a congestion event is created, the system logs contributing factors:

- EQUIPMENT_REDUCED (if any equipment is non-operational)
- STAFF_SHORTAGE (if active staff below minimum)
- HIGH_BOOKING_VOLUME (slot fill rate > 95%)
- SLOW_PROCESSING (avg processing time > 1.5× baseline)

---

## 5. Congestion Prediction

### 5.1 Phase 1 (MVP) — Rule-Based Prediction

**Not available in MVP.** System presents only real-time congestion, not prediction.

However, simple predictive indicators are shown in the manager dashboard:

- "Slot fill rate for afternoon slots is 95% — peak load expected after 14:00"
- "All slots for tomorrow are 80%+ filled — prepare for a high-volume day"

These are not ML predictions — they are threshold-based alerts from slot fill data.

### 5.2 Phase 2 — Statistical Prediction

Requires minimum 90 days of data.

```
predicted_queue(centre, date, time_window) =
  weighted_avg(
    same_day_last_4_weeks_queue_at_time,
    booking_count_for_date_vs_historical_avg,
    pending_check_in_count_for_upcoming_slot
  )
```

### 5.3 Phase 3 — Machine Learning

Time-series model (e.g., ARIMA, Prophet, or LSTM) trained on historical queue depth, booking volumes, weather events, and local crop season patterns.

---

## 6. No-Show Prediction

### 6.1 Phase 1 (MVP)

No real-time prediction. Historical no-show rate per centre and per weekday tracked as a metric.

Displayed as context: "Historical no-show rate for Friday bookings at this centre: 22%"

### 6.2 Phase 2 — Risk Scoring

Each booking assigned a no-show risk score:

```
risk_score = (farmer_noshow_history_rate × 0.5)
           + (booking_advance_days × 0.2)
           + (centre_avg_noshow_rate × 0.3)
```

High-risk bookings (score > 0.6) trigger a proactive reminder 30 minutes before slot.

### 6.3 Phase 3 — ML Classification

Binary classifier trained on booking metadata and farmer behaviour patterns.

---

## 7. Bottleneck Detection

### 7.1 Stage Time Tracking

The system tracks time spent at each procurement stage per farmer:

| Stage      | Start Event            | End Event           |
| ---------- | ---------------------- | ------------------- |
| Queue Wait | Check-in timestamp     | CALLED timestamp    |
| Weighing   | WEIGHING start         | WEIGHING complete   |
| Inspection | INSPECTING start       | INSPECTING complete |
| Decision   | PENDING_DECISION start | APPROVED/REJECTED   |

### 7.2 Baseline Establishment

For the first 14 days, the system collects data without triggering alerts. After day 14, baselines are established:

```
baseline_stage_time = AVG(stage_time) FROM all completed procurements at this centre
```

### 7.3 Detection Logic

```
If rolling_avg(stage, last_30_min) > 2.0 × baseline_stage_time:
  raise BOTTLENECK_ALERT(stage, current_avg, baseline)
```

### 7.4 Output

```json
{
  "bottleneck_id": "uuid",
  "centre_id": "uuid",
  "detected_at": "ISO8601",
  "stage": "WEIGHING",
  "current_avg_minutes": 12.5,
  "baseline_avg_minutes": 5.2,
  "severity": "HIGH",
  "suggested_action": "Deploy additional officer to weighing station."
}
```

---

## 8. Dynamic Capacity Adjustment

### 8.1 Trigger Conditions

| Trigger                         | Adjustment                                                    |
| ------------------------------- | ------------------------------------------------------------- |
| One weighing machine → FAULTY   | Reduce effective capacity by 1/N (N = original machine count) |
| Staff count drops below minimum | Flag slot capacity as REDUCED                                 |
| Both triggers active            | Apply combined reduction                                      |

### 8.2 Adjustment Communication

- All future unconfirmed slot capacities updated immediately
- Existing confirmed bookings are not displaced unless Centre Manager makes explicit closure decision
- Manager and District Admin notified

---

## 9. Cross-Centre Load Balancing Intelligence

### 9.1 Imbalance Score

```
imbalance_score_district =
  STDDEV(congestion_ratio) ACROSS all centres in district

If imbalance_score > IMBALANCE_THRESHOLD (default: 0.30):
  trigger load balancing suggestion workflow
```

### 9.2 Transfer Eligibility

Only bookings in `CONFIRMED` state (not yet CHECKED_IN) are eligible for transfer suggestions. The farmer must accept the rescheduling offer — no forced transfers.

### 9.3 Suggestion Acceptance Rate Tracking

The system tracks: what % of farmers accept rescheduling when offered. This feeds into recommendation engine weighting.

---

## 10. Intelligence Data Logging Strategy

All intelligence inputs and outputs are logged for future model development:

| Data Point                           | Logged When                  | Purpose                  |
| ------------------------------------ | ---------------------------- | ------------------------ |
| Recommendation inputs + outputs      | Every recommendation request | Model training           |
| Recommendation accepted/rejected     | On booking confirmation      | Relevance training       |
| ETA predictions vs actual wait times | Every completed queue entry  | ETA model calibration    |
| Congestion events                    | Every threshold breach       | Pattern analysis         |
| No-show events                       | Every no-show marked         | Risk model training      |
| Processing times per stage           | Every procurement            | Bottleneck and ETA model |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
