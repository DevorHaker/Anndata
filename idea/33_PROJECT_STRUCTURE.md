# 33 — COMPLETE RECOMMENDED PROJECT STRUCTURE

## SmartProcure: Repository Tree & Directory Architecture

---

```
smartprocure/
│
├── .github/                            # CI/CD Workflows & Issue Templates
│   ├── workflows/
│   │   ├── ci-pipeline.yml             # Lint, Test, Security Scan, Docker Build
│   │   └── cd-staging.yml              # Automated Staging Deployment
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                               # System Documentation & Specifications
│   ├── phase1-srs/                     # Phase 1 Master Requirements (01-22)
│   └── phase2-architecture/            # Phase 2 Master Architecture (01-36)
│
├── frontend/                           # React.js + Vite Client Application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── manifest.json               # PWA Configuration
│   ├── src/
│   │   ├── app/                        # Application Providers & Global CSS
│   │   ├── assets/                     # Logos, SVGs, Static Media
│   │   ├── components/                 # Reusable UI Design System
│   │   │   ├── ui/                     # Button, Input, Modal, Card, Badge
│   │   │   ├── feedback/               # Toast, Skeleton, ErrorBoundary
│   │   │   └── layout/                 # Header, Sidebar, Footer, PageContainer
│   │   ├── features/                   # Domain Encapsulated Components
│   │   │   ├── auth/                   # LoginForm, RegisterForm, OTPInput
│   │   │   ├── farmers/                # ProfileEditor, ProduceList
│   │   │   ├── bookings/               # SlotPicker, BookingCard, Wizard
│   │   │   ├── queue/                  # LiveQueueDisplay, ETATimer
│   │   │   ├── procurement/            # WeighmentForm, InspectionForm
│   │   │   └── analytics/              # CongestionGauge, MetricsGrid
│   │   ├── hooks/                      # Custom Custom Hooks (useSocket, useAuth)
│   │   ├── layouts/                    # Layout Templates (Auth, Farmer, Admin)
│   │   ├── pages/                      # Target Page Route Components
│   │   ├── routes/                     # React Router Configuration & Guards
│   │   ├── services/                   # Axios API Instance & Socket.IO Client
│   │   ├── store/                      # Zustand State Stores (Auth, UI)
│   │   ├── utils/                      # Formatting & Encryption Helpers
│   │   ├── validation/                 # Zod Validation Schemas
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                            # Node.js + Express Modular Monolith
│   ├── src/
│   │   ├── config/                     # Env, DB, Redis, Logger Configuration
│   │   ├── middleware/                 # Auth, RBAC, Validation, Errors, Rate Limiters
│   │   ├── modules/                    # 20 Bounded Domain Modules
│   │   │   ├── auth/                   # Routes, Controller, Service, Repo, Schema
│   │   │   ├── farmers/
│   │   │   ├── centres/
│   │   │   ├── slots/
│   │   │   ├── bookings/
│   │   │   ├── tokens/
│   │   │   ├── queue/
│   │   │   ├── checkins/
│   │   │   ├── weighments/
│   │   │   ├── quality/
│   │   │   ├── procurements/
│   │   │   ├── payments/
│   │   │   ├── notifications/
│   │   │   ├── analytics/
│   │   │   ├── intelligence/
│   │   │   ├── exceptions/
│   │   │   ├── audit/
│   │   │   ├── admin/
│   │   │   ├── produce/
│   │   │   └── equipment/
│   │   ├── database/                   # Knex Migrations & Environment Seeds
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── jobs/                       # BullMQ Background Workers
│   │   │   ├── queueWorker.js
│   │   │   ├── notificationWorker.js
│   │   │   └── noShowWorker.js
│   │   ├── integrations/               # External Adapter Isolation
│   │   │   ├── sms/                    # ISmsAdapter, MockSms, TwilioSms
│   │   │   ├── email/                  # IEmailAdapter, MockEmail, SESEmail
│   │   │   ├── payment/                # IPaymentAdapter, MockPayment, DBTBank
│   │   │   ├── maps/                   # IMapsAdapter, HaversineMaps, GoogleMaps
│   │   │   └── storage/                # IStorageAdapter, LocalStorage, S3Storage
│   │   ├── realtime/                   # Socket.IO Gateway & Room Handlers
│   │   ├── utils/                      # Cryptography, Errors, Math Utilities
│   │   ├── app.js                      # Express Application Instantiation
│   │   └── server.js                   # HTTP Server Entry Point
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── package.json
│
├── infrastructure/                     # NGINX Proxy & Orchestration Configs
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/default.conf
│   └── docker/
│       └── docker-compose.prod.yml
│
├── tests/                              # Global E2E & Load Testing Suites
│   ├── e2e/                            # Playwright E2E Test Files
│   └── load/                           # k6 Concurrency Stress Scripts
│
├── scripts/                            # Operational Maintenance Scripts
│   ├── seed-dev-data.js
│   └── verify-architecture.js
│
├── docker-compose.yml                  # Local Development Docker Compose Stack
├── .env.example                        # Canonical Environment Template
├── .gitignore
├── README.md
└── package.json                        # Monorepo Workspace Package Manifest
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
