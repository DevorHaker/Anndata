# 03 — STAKEHOLDER ANALYSIS

## SmartProcure: Complete Stakeholder Identification, Analysis, and Engagement Model

---

## 1. Stakeholder Classification Framework

Stakeholders are classified across two axes:

- **Influence**: High / Medium / Low (ability to affect the project)
- **Interest**: High / Medium / Low (degree to which the project affects them)

| Quadrant                      | Strategy                                             |
| ----------------------------- | ---------------------------------------------------- |
| High Influence, High Interest | Manage closely — primary decision-makers             |
| High Influence, Low Interest  | Keep satisfied — must be informed of major decisions |
| Low Influence, High Interest  | Keep informed — regular updates                      |
| Low Influence, Low Interest   | Monitor — minimal effort required                    |

---

## 2. Primary Internal Stakeholders

### 2.1 Farmer

| Attribute               | Detail                                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| **Role**                | Primary end-user and beneficiary of the system                              |
| **Influence**           | Low (as individual), High (as collective — adoption determines success)     |
| **Interest**            | High                                                                        |
| **Engagement Strategy** | Manage closely — critical adoption gate                                     |
| **Primary Concerns**    | Is the app easy to use? Does it reduce my waiting time? Is my money safe?   |
| **Needs**               | Simple booking, QR token, live queue position, payment confirmation         |
| **Risks**               | Low digital literacy, low smartphone penetration in rural areas             |
| **Mitigation**          | Accessible UI, operator-assisted registration, SMS fallback, multi-language |

**Who a Farmer Is:**

- Individual small, medium, or large landholding farmer
- May register individually or as a group/cooperative member
- Primary interaction channels: Mobile web, assisted kiosk
- Expected digital literacy: Low to Medium — UI must be extremely simple

---

### 2.2 Procurement Officer

| Attribute               | Detail                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Role**                | Operational staff executing the procurement workflow at the centre                                                      |
| **Influence**           | Medium                                                                                                                  |
| **Interest**            | High                                                                                                                    |
| **Engagement Strategy** | Manage closely                                                                                                          |
| **Primary Concerns**    | Will this create more work? Is the interface fast? Am I liable for errors?                                              |
| **Needs**               | Farmer check-in confirmation, clear queue display, simple weighing form, quality inspection form, approval/rejection UI |
| **Risks**               | Resistance to change from paper-based habits, data entry errors                                                         |
| **Mitigation**          | Minimal-click workflows, validation with instant feedback, correction history                                           |

**Who a Procurement Officer Is:**

- Employed or contracted by the procurement centre or government body
- Operates procurement workflow during centre hours
- May have limited technical expertise — UI must be task-focused and clear
- Primary interaction channel: Web browser on a centre-issued device

---

### 2.3 Centre Manager

| Attribute               | Detail                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Role**                | Operational head of a single procurement centre                                                                      |
| **Influence**           | High (within their centre)                                                                                           |
| **Interest**            | High                                                                                                                 |
| **Engagement Strategy** | Manage closely                                                                                                       |
| **Primary Concerns**    | Can I see my centre's status in real time? Am I alerted before things go wrong? Can I manage my staff and equipment? |
| **Needs**               | Live operations dashboard, congestion alerts, equipment management, staff management, capacity configuration         |
| **Risks**               | Overreliance on system; alert fatigue                                                                                |
| **Mitigation**          | Configurable alert thresholds, clear severity levels, actionable alerts with suggested responses                     |

---

### 2.4 District / Regional Administrator

| Attribute               | Detail                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Role**                | Government or authority official overseeing multiple procurement centres in a district or region                          |
| **Influence**           | High                                                                                                                      |
| **Interest**            | High                                                                                                                      |
| **Engagement Strategy** | Manage closely                                                                                                            |
| **Primary Concerns**    | Are all centres operating as expected? Where are the bottlenecks? How is farmer welfare? Are targets being met?           |
| **Needs**               | Multi-centre dashboard, aggregated analytics, congestion reports, cross-centre load balancing insights, exception reports |
| **Risks**               | Data overload; inability to drill down to relevant granularity                                                            |
| **Mitigation**          | Hierarchical dashboards — district summary → centre drill-down → individual procurement detail                            |

---

### 2.5 System Administrator

| Attribute               | Detail                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Role**                | Technical/operational admin managing platform configuration, users, and system health                                   |
| **Influence**           | High (full system access)                                                                                               |
| **Interest**            | High                                                                                                                    |
| **Engagement Strategy** | Manage closely                                                                                                          |
| **Primary Concerns**    | Is the system healthy? Are there security incidents? Are configurations correct?                                        |
| **Needs**               | User management, role assignment, system configuration, audit log access, monitoring dashboards, background job control |
| **Risks**               | Single point of failure; over-privileged access                                                                         |
| **Mitigation**          | Principle of least privilege even within admin roles; all admin actions logged                                          |

---

## 3. External Stakeholders

### 3.1 State / National Agriculture Authority

| Attribute                 | Detail                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **Role**                  | Policy-setting body that mandates procurement operations and MSP                   |
| **Influence**             | Very High                                                                          |
| **Interest**              | High                                                                               |
| **Engagement Strategy**   | Keep satisfied                                                                     |
| **Needs**                 | Compliance reports, procurement volumes, payment disbursement data, audit evidence |
| **Integration Readiness** | API reporting endpoints to export aggregated data; no live integration in MVP      |

---

### 3.2 Payment Agencies (DBT / Banks)

| Attribute                 | Detail                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Role**                  | External payment disbursement through Direct Benefit Transfer or bank transfer         |
| **Influence**             | High (controls actual money movement)                                                  |
| **Interest**              | Medium                                                                                 |
| **Engagement Strategy**   | Keep satisfied                                                                         |
| **Needs**                 | Payment trigger data: farmer bank details, amount, procurement ID, verification status |
| **Integration Readiness** | Webhook-based payment status callback; mock/stub in MVP                                |

---

### 3.3 SMS/Email Notification Providers

| Attribute                 | Detail                                                                       |
| ------------------------- | ---------------------------------------------------------------------------- |
| **Role**                  | Deliver SMS and email notifications to farmers and staff                     |
| **Influence**             | Medium                                                                       |
| **Interest**              | Low                                                                          |
| **Engagement Strategy**   | Keep informed                                                                |
| **Needs**                 | Notification events with recipient, message body, priority                   |
| **Integration Readiness** | Provider-agnostic notification service with pluggable providers; mock in MVP |

---

### 3.4 Maps / Geolocation Providers

| Attribute                 | Detail                                                                           |
| ------------------------- | -------------------------------------------------------------------------------- |
| **Role**                  | Provide distance and travel-time calculation between farmer location and centres |
| **Influence**             | Medium                                                                           |
| **Interest**              | Low                                                                              |
| **Engagement Strategy**   | Monitor                                                                          |
| **Needs**                 | Lat/long coordinates; distance matrix API                                        |
| **Integration Readiness** | Google Maps or OpenStreetMap; mock with Haversine formula in MVP                 |

---

### 3.5 Government Farmer Identity Database

| Attribute                 | Detail                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Role**                  | Existing government systems containing validated farmer identity and land records      |
| **Influence**             | High (may be required for compliance)                                                  |
| **Interest**              | Low                                                                                    |
| **Engagement Strategy**   | Keep informed                                                                          |
| **Needs**                 | Farmer ID (Aadhaar, farmer registration number) for identity verification              |
| **Integration Readiness** | Not available for live integration in MVP; manual document upload + admin verification |

---

## 4. Stakeholder Need Matrix

| Stakeholder           | Core Need                                  | Pain If Unmet              | Priority |
| --------------------- | ------------------------------------------ | -------------------------- | -------- |
| Farmer                | Slot booking + live queue + payment status | Adoption failure           | Critical |
| Procurement Officer   | Clear, fast procurement workflow           | Operational chaos          | Critical |
| Centre Manager        | Live dashboard + alerts + capacity control | Centre mismanagement       | Critical |
| District Admin        | Multi-centre analytics + exception view    | Policy blind spot          | High     |
| System Admin          | Full platform control + audit access       | Security and config risk   | Critical |
| Agriculture Authority | Compliance reports                         | Regulatory failure         | High     |
| Payment Agency        | Payment trigger and confirmation           | Payment failure            | High     |
| Notification Provider | Reliable event delivery                    | Farmer miss notifications  | High     |
| Maps Provider         | Distance and ETA data                      | Inaccurate recommendations | Medium   |
| Govt Identity DB      | Identity verification                      | Farmer eligibility gaps    | Medium   |

---

## 5. Stakeholder Communication Plan

| Stakeholder           | Communication Type                             | Frequency          | Channel            |
| --------------------- | ---------------------------------------------- | ------------------ | ------------------ |
| Farmer                | System notifications (booking, queue, payment) | Event-driven       | In-app, SMS, push  |
| Procurement Officer   | Task alerts, queue updates                     | Real-time          | In-app             |
| Centre Manager        | Operational alerts, daily reports              | Real-time + daily  | In-app, email      |
| District Admin        | Aggregated reports, anomaly alerts             | Daily + on-demand  | In-app, email      |
| System Admin          | System health alerts, security events          | Real-time          | In-app, email      |
| Agriculture Authority | Monthly procurement reports                    | Monthly            | Email + API export |
| Payment Agency        | Payment trigger + confirmation events          | Event-driven       | API webhook        |
| Notification Provider | Notification delivery events                   | Event-driven       | API                |
| Maps Provider         | Distance calculation requests                  | Per recommendation | API                |

---

## 6. Stakeholder Risk Summary

| Risk                                        | Stakeholder Affected | Probability | Impact   | Mitigation                                     |
| ------------------------------------------- | -------------------- | ----------- | -------- | ---------------------------------------------- |
| Low farmer adoption due to digital literacy | Farmer               | High        | Critical | Simple UI, SMS fallback, kiosk/operator model  |
| Officer resistance to digital workflow      | Officer              | Medium      | High     | Training, minimal-click UI, demonstration      |
| Manager resistance due to alert overload    | Manager              | Medium      | Medium   | Configurable thresholds, clear severity levels |
| Payment agency not integrating in time      | Payment Agency       | Medium      | High     | Mock payment in MVP; real integration Phase 2  |
| Government identity API unavailable         | Govt DB              | High        | Medium   | Manual document verification as fallback       |
| Notification provider downtime              | SMS/Email Provider   | Low         | Medium   | Multiple provider fallback chain               |

---

_Document Version: 1.0 | Phase: 1 — Requirements | Status: Draft for Review_
