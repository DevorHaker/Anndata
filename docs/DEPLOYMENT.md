# Production Deployment & Infrastructure Strategy — SmartProcure

## 1. Deployment Model Rationale
SmartProcure utilizes a **Containerized Docker Deployment Model** (orchestrated via Docker Compose / Managed Container Apps like AWS ECS or DigitalOcean App Platform):
* **Why Containerized VPS / Managed Containers?**: For the target initial procurement volume (~500 mandis, ~1,000 req/min peak), Kubernetes introduces unnecessary operational complexity. Containerized Docker Compose / ECS provides zero-downtime rolling deployments, low overhead, and deterministic environments at optimized cost.
* **Database Platform**: Managed PostgreSQL 15 (e.g. AWS RDS PostgreSQL or DigitalOcean Managed DB) with automated daily snapshot backups and WAL archiving.
* **Redis Platform**: Managed Redis 7 instance with high-availability replication.

---

## 2. Environment Strategy

| Environment | Purpose | Target Host / URL | Database | Redis | Secrets Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEVELOPMENT** | Local feature work | `localhost:3000` / `localhost:5000` | Isolated Local Postgres | Local Redis | `.env` |
| **STAGING** | Pre-release validation | `http://localhost:8080` / `staging-api...` | Staging DB | Staging Redis | GitHub Secrets |
| **PRODUCTION** | Live Mandi Procurement | `https://smartprocure.example.org` | Primary Managed DB | Primary Redis | AWS Secrets Manager / Vault |

---

## 3. Secret Management Policy
1. **Zero Credentials in Git**: Production secrets (`JWT_SECRET`, database passwords, API keys) are strictly prohibited from being committed into Git, Docker images, or Vite frontend bundles.
2. **Runtime Injection**: Environment variables are injected into runtime containers via cloud secret store at startup.
3. **Rotation Schedule**: `JWT_SECRET` rotated biannually; database credentials rotated annually.
