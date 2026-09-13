# 25 — DOCKER & CONTAINER ARCHITECTURE

## SmartProcure: Containerization Strategy, Compose Topologies, and Environments

---

## 1. Containerization Principles

1. **Multi-Stage Builds**: Production Dockerfiles use multi-stage builds to minimize image sizes (under 150MB) and exclude development dependencies.
2. **Non-Root Execution**: Application containers execute under a non-privileged `node` user (`USER node`) for security.
3. **Environment Injection**: Configuration is supplied strictly via environment variables; no hardcoded credentials inside container images.

---

## 2. Master `docker-compose.yml` Development Blueprint

```yaml
version: "3.8"

networks:
  smartprocure-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:

services:
  # 1. Primary PostgreSQL Database Container
  postgres:
    image: postgres:16-alpine
    container_name: smartprocure-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: smartprocure_dev
      POSTGRES_USER: smartprocure_admin
      POSTGRES_PASSWORD: dev_secure_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - smartprocure-network
    healthcheck:
      test:
        ["CMD-SHELL", "pg_isready -U smartprocure_admin -d smartprocure_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Redis Cache & Queue Container
  redis:
    image: redis:7-alpine
    container_name: smartprocure-redis
    restart: unless-stopped
    command: redis-server --requirepass redis_secure_password_123 --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - smartprocure-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redis_secure_password_123", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 3. Object Storage Mock (MinIO) Container
  minio:
    image: minio/minio:latest
    container_name: smartprocure-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: minio_secure_password_123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    networks:
      - smartprocure-network

  # 4. Backend Express API Server Container
  backend-api:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: smartprocure-backend-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      PORT: 5000
      DATABASE_URL: postgres://smartprocure_admin:dev_secure_password_123@postgres:5432/smartprocure_dev
      REDIS_URL: redis://:redis_secure_password_123@redis:6379
      S3_ENDPOINT: http://minio:9000
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - smartprocure-network

  # 5. BullMQ Async Background Worker Container
  backend-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: smartprocure-backend-worker
    command: npm run start:worker
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://smartprocure_admin:dev_secure_password_123@postgres:5432/smartprocure_dev
      REDIS_URL: redis://:redis_secure_password_123@redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - smartprocure-network

  # 6. Frontend React + Vite Dev Container
  frontend-ui:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: smartprocure-frontend-ui
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://localhost:5000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - smartprocure-network
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
