# 27 — CI/CD & RELEASE ENGINEERING ARCHITECTURE

## SmartProcure: GitHub Actions Pipelines, Migration Strategies, and Rollback Flow

---

## 1. Branching Strategy & Release Lifecycle

SmartProcure follows **GitHub Flow with Environment Release Tags**:

```
Feature Branch (feature/booking-lock) ──(PR + CI Pass)──> `main` Branch ──(Auto-Deploy)──> Staging Environment
                                                                 │
                                                    (Tag `v1.x.x` + Approval)
                                                                 │
                                                                 ▼
                                                        Production Environment
```

---

## 2. CI/CD Automated Pipeline Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               GITHUB PULL REQUEST / COMMIT             │
                    └───────────────────────────┬────────────────────────────┘
                                                │ Trigger Pipeline
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             STAGE 1: STATIC ANALYSIS                                                │
│  - ESLint / Prettier Code Style Check                                                                               │
│  - Environment Schema Type Validation                                                                               │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┘
                                                │ Success
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              STAGE 2: AUTOMATED TESTING                                             │
│  - Backend Unit & Service Integration Tests (Vitest + PostgreSQL Service Container)                                 │
│  - Frontend Component Unit Tests (React Testing Library)                                                            │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┘
                                                │ Success
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             STAGE 3: SECURITY SCANNING                                              │
│  - Dependency Vulnerability Audit (`npm audit` / Trivy)                                                             │
│  - Secret Exposure Scan (GitGuardian)                                                                               │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┘
                                                │ Success
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              STAGE 4: DOCKER IMAGE BUILD                                            │
│  - Build Multi-Stage Production Images (Frontend NGINX & Backend API)                                               │
│  - Push Images to GitHub Container Registry (GHCR) tagged with commit SHA                                          │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┘
                                                │ Success
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              STAGE 5: DEPLOYMENT                                                    │
│  - Staging: Auto-Deploy via SSH / Kubernetes Helm                                                                   │
│  - Production: Requires Manual Engineering Lead Approval Tag                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Migration Deployment Strategy

Database schema migrations are executed using **Knex.js Migration Scripts**:

1. **Zero-Downtime Rule**: Migrations must be **Backward Compatible**.
   - Column Additions: Must allow `NULL` or have a `DEFAULT` value.
   - Column Deletions / Renames: Executed across two separate release cycles (Expand-Contract Pattern).
2. **Pre-Deployment Execution Step**: In the deployment script, migrations run **BEFORE** new container instances are brought up:
   ```bash
   # Execution inside deployment step
   docker run --rm --net=host smartprocure-backend:latest npm run db:migrate
   ```

---

## 4. Automated Zero-Downtime Rollback Procedure

If health checks (`GET /ready`) fail on newly deployed container instances during rolling deployment:

1. Container orchestrator (Docker Swarm/Kubernetes) automatically halts roll-out.
2. NGINX load balancer routes 100% of traffic to the previous healthy container revision (`v1.2.3`).
3. Database migrations include explicit `down` rollback scripts:
   ```bash
   npm run db:migrate:rollback
   ```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
