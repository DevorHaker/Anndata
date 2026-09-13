# SmartProcure — Farm Gate to Payment (SIH 2026)

[![CI Foundation](https://github.com/SIH2026/smart-procure/actions/workflows/ci.yml/badge.svg)](https://github.com/SIH2026/smart-procure/actions/workflows/ci.yml)
![Phase](https://img.shields.io/badge/Phase%204-Foundation%20Complete-emerald)
![License](https://img.shields.io/badge/License-MIT-blue)

**SmartProcure** is an intelligent, high-concurrency agricultural procurement platform built to solve SIH Problem Statement **SIH26032** (_"Farmers face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status"_).

---

## 🌾 Product Journey

```
Register ➔ Recommend ➔ Slot ➔ Token ➔ Queue ➔ Procurement ➔ Payment ➔ Tracking
```

---

## 🛠️ Technology Stack

| Layer              | Technologies                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | React 18, Vite, TypeScript, React Router v6, TanStack Query v5, React Hook Form, Zod, Axios, Tailwind CSS, Vitest, React Testing Library |
| **Backend**        | Node.js, Express.js, TypeScript, REST API, Zod, PostgreSQL 16 (`pg`), Redis 7 (`ioredis`), Winston Logger, Morgan, Supertest             |
| **Infrastructure** | Docker, Docker Compose, Nginx, GitHub Actions CI, ESLint, Prettier                                                                       |

---

## 📁 Repository Structure

```
smart-procure/
├── frontend/             # React + Vite + TypeScript web application shell
├── backend/              # Node.js + Express + TypeScript REST API service
├── database/             # PostgreSQL 16 DDL migrations, seeds, and JS runner scripts
│   ├── migrations/       # Deterministic 001_initial_schema.sql
│   ├── seeds/            # 001_initial_seed.sql
│   └── scripts/          # migrate.js & seed.js
├── docs/                 # Documentation & Architectural Decision Records (ADRs)
├── idea/                 # Phase 1-3 SRS, architecture & schema documents
├── tests/e2e/            # Playwright end-to-end smoke test suite
├── .github/workflows/    # CI automation workflow
├── docker-compose.yml    # PostgreSQL, Redis, Backend & Frontend services
└── package.json          # Root monorepo workspace configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker Desktop / Docker Engine**: `v24.x` or higher

### 1. Clone & Install

```bash
git clone <repository-url>
cd Anndata
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

### 3. Launch Database & Redis Infrastructure

```bash
docker compose up -d postgres redis
```

### 4. Run Database Migrations & Seeds

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start Development Servers

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Diagnostics**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Readiness Diagnostics**: [http://localhost:5000/api/v1/ready](http://localhost:5000/api/v1/ready)

---

## 🐳 Docker Full Stack Setup

To run all 4 containers (PostgreSQL, Redis, Backend, Frontend) simultaneously:

```bash
docker compose up --build
```

Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Quality Assurance

```bash
# Run all unit & integration tests
npm run test

# Run backend API integration tests
npm run test:backend

# Run frontend component tests
npm run test:frontend

# Run Playwright E2E smoke tests
npm run test:e2e

# Run linter & code formatter checks
npm run lint
npm run format:check
```

---

## 📖 Key Architectural Decisions (ADRs)

- [ADR-001: Modular Monolith Architecture](docs/decisions/ADR-001-modular-monolith-architecture.md)
- [ADR-002: PostgreSQL as Transactional Source of Truth](docs/decisions/ADR-002-postgresql-transactional-source-of-truth.md)
- [ADR-003: Redis Usage Boundaries & Degraded State](docs/decisions/ADR-003-redis-usage-boundaries.md)
- [ADR-004: Frontend Server-State Strategy (TanStack Query)](docs/decisions/ADR-004-frontend-server-state-strategy.md)
- [ADR-005: API Versioning Strategy (`/api/v1`)](docs/decisions/ADR-005-api-versioning.md)

---

## 📜 Contributing & Branching Strategy

Please review [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests. All commits must follow [Conventional Commits](https://www.conventionalcommits.org/).
