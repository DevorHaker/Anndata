# 21 — OBSERVABILITY & MONITORING ARCHITECTURE

## SmartProcure: Structured Logging, Correlation Tracing, Health Checks, and Metrics

---

## 1. Structured Logging Specification (Pino Logger)

SmartProcure implements high-performance, structured JSON logging using **Pino**. Text-based console logs (`console.log`) are strictly prohibited in application code.

### Log Output Format Standard

```json
{
  "level": 30,
  "time": 1757750400000,
  "pid": 1284,
  "hostname": "api-node-container-01",
  "requestId": "req_c49219b1-5e88-410a-b502-09418291a182",
  "actorId": "usr_98124810-b912-421f-8291-01bc09a12821",
  "role": "PROCUREMENT_OFFICER",
  "centreId": "cn_11029301-1234-5678-90ab-cdef12345678",
  "module": "procurements",
  "action": "PROCUREMENT_APPROVED",
  "msg": "Procurement pr_88123901 approved for 1250.50 kg",
  "durationMs": 42
}
```

### Sensitive Data Scrubbing Rules

Loggers automatically mask sensitive payload attributes before output writing:

- Password fields (`password`, `confirmPassword`) -> `"[REDACTED]"`
- Bank account details (`accountNumber`, `ifscCode`) -> `"XXXXXX1234"`
- Aadhaar / National Identity -> `"XXXX-XXXX-1234"`
- JWT Access & Refresh Tokens -> `"[REDACTED_TOKEN]"`

---

## 2. Request Correlation Tracing (`X-Request-ID`)

1. **Request Middleware**: `middleware/requestId.js` checks for an incoming `X-Request-ID` header. If absent, it generates a fresh UUIDv4.
2. **Context Binding**: The `requestId` is attached to `req.id` and injected into Pino logger context for all logs produced within that HTTP request lifecycle.
3. **Response Propagation**: The `X-Request-ID` header is echoed back in HTTP response headers.

---

## 3. Health Check Architecture (`/health` & `/ready`)

SmartProcure exposes two standardized monitoring endpoints for load balancers and orchestrators (Kubernetes/Docker Swarm):

### 3.1 Liveness Probe (`GET /health`)

- **Purpose**: Checks if the Node.js process is alive and accepting connections.
- **Response**: `HTTP 200 OK` `{ "status": "UP", "uptime": 84210 }`
- **Use Case**: Used by load balancer for process restart decisions.

### 3.2 Readiness Probe (`GET /ready`)

- **Purpose**: Checks if all core backend dependencies are responsive.
- **Checks Executed**:
  1. PostgreSQL Ping (`SELECT 1`)
  2. Redis Ping (`PING` -> `PONG`)
- **Response**:
  - All Responsive: `HTTP 200 OK` `{ "status": "READY", "checks": { "database": "UP", "redis": "UP" } }`
  - Any Dependency Down: `HTTP 503 Service Unavailable` `{ "status": "NOT_READY", "checks": { "database": "DOWN" } }`

---

## 4. Key Operational Metrics (Prometheus Scraping Endpoint `/metrics`)

Prometheus metrics are collected using `prom-client` and exposed at `GET /api/v1/metrics` (protected by system admin credentials):

1. **HTTP Metrics**: `http_request_duration_seconds` (Histogram by route, status code).
2. **Database Metrics**: `pg_pool_active_connections`, `pg_query_duration_seconds`.
3. **Redis Metrics**: `redis_connected_clients`, `redis_command_latency_seconds`.
4. **BullMQ Metrics**: `bullmq_jobs_active`, `bullmq_jobs_failed_total`.
5. **Business Metrics**: `smartprocure_bookings_confirmed_total`, `smartprocure_queue_depth_count`.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
