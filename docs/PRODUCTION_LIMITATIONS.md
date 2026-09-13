# Production Boundaries & Capabilities Classification — SmartProcure

## 1. System Capability Classification Matrix

| Subsystem / Capability | Operational Status | Boundary & Configuration Policy |
| :--- | :--- | :--- |
| **Core Procurement Engine** | **REAL / AUTHORITATIVE** | Authoritative server-side weighment, quality grading, and MSP formula computation. |
| **Database & Queue Engine** | **REAL / AUTHORITATIVE** | PostgreSQL sequence generators, priority queueing, token generation, and audit logging. |
| **PWA Offline Operations** | **REAL / AUTHORITATIVE** | IndexedDB local storage, background sync, and server-authority conflict resolution. |
| **Executive Analytics** | **REAL / AUTHORITATIVE** | Aggregated metrics, turn-around times, and IST reporting window summaries. |
| **SMS Provider** | **CONFIGURATION-DEPENDENT** | Defaults to `mock` mode. Requires valid Twilio / AWS SNS API credentials for live dispatch. |
| **DBT Payment Gateway** | **CONFIGURATION-DEPENDENT** | Operates via `MockPaymentProvider` adapter. Requires authorized bank/PFMS/NPCI credentials for live banking. |
| **State Revenue / Land DB** | **ADAPTER-BASED** | Connects via adapter interface. Uses verified mock dataset in development/testing. |
