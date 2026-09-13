# SmartProcure — Repository & Architecture Structure

This document outlines the maintainable monorepo layout of SmartProcure.

---

```
smart-procure/
│
├── frontend/                     # React + Vite + TypeScript Frontend
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── app/                  # QueryClient & ErrorBoundary
│   │   ├── components/           # Reusable UI component library (Button, Input, Select, etc.)
│   │   ├── layouts/              # Header, Sidebar, RootLayout application shell
│   │   ├── pages/                # Overview, Health, and Phase 5+ placeholder views
│   │   ├── routes/               # Centralized React Router & RouteGuards
│   │   ├── services/             # Axios API client & error standardization
│   │   ├── types/                # TypeScript interfaces & API types
│   │   ├── index.css             # Tailwind & CSS design system tokens
│   │   └── main.tsx              # React DOM entry point
│   ├── tests/                    # Vitest component test suites
│   ├── Dockerfile                # Multi-stage Nginx production container
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts            # Vite & Vitest configuration
│
├── backend/                      # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/               # Zod validated environment variables
│   │   ├── database/             # PostgreSQL pool & Redis client with health checks
│   │   ├── middleware/           # Request ID, Logging, Errors, Rate Limiting, Validation
│   │   ├── routes/               # /api/v1 Health, Readiness, and domain placeholders
│   │   ├── utils/                # Logger, Custom Error classes, API Response helpers
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # HTTP server listener & graceful shutdown handlers
│   ├── tests/                    # Integration tests with Supertest
│   ├── Dockerfile                # Multi-stage Node production container
│   └── package.json              # Backend dependencies
│
├── database/                     # PostgreSQL Migrations & Seeds
│   ├── migrations/               # Deterministic 001_initial_schema.sql (Phase 3 DDL)
│   ├── seeds/                    # 001_initial_seed.sql (System roles, crop types, demo user)
│   └── scripts/                  # NodeJS migration (migrate.js) & seed (seed.js) runners
│
├── docs/                         # Documentation & Architectural Decision Records
│   ├── architecture/             # Structural documentation
│   ├── decisions/                # ADR-001 through ADR-005
│   └── development/              # Setup and Testing guides
│
├── idea/                         # Phase 1-3 SRS, Architecture & Schema documentation (.md)
│
├── tests/
│   └── e2e/                      # Playwright E2E smoke tests
│
├── .github/
│   └── workflows/                # GitHub Actions CI workflow (ci.yml)
│
├── .env.example                  # Environment variable configuration template
├── .gitignore                    # Git ignore file
├── CONTRIBUTING.md               # Git flow, conventional commit, and PR rules
├── docker-compose.yml            # PostgreSQL, Redis, Backend & Frontend services
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Master project overview & documentation
```
