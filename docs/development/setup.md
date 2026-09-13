# SmartProcure — Development Setup Guide

This document provides step-by-step instructions for initializing and running the SmartProcure local development environment.

---

## 1. Prerequisites

Ensure your machine has the following tools installed:

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker & Docker Compose**: Desktop or Engine 24.x+
- **Git**: v2.40+

---

## 2. Quick Local Setup

### Step 1: Clone & Install Dependencies

```bash
git clone <repository-url>
cd Anndata
npm install
```

### Step 2: Environment Configuration

Copy the template `.env.example` file to `.env`:

```bash
cp .env.example .env
```

### Step 3: Start Infrastructure (PostgreSQL & Redis)

Use Docker Compose to launch isolated database containers:

```bash
docker compose up -d postgres redis
```

### Step 4: Run Database Migrations & Seeds

Execute the deterministic Node migration & seed scripts:

```bash
npm run db:migrate
npm run db:seed
```

### Step 5: Start Full Development Environment

Run both backend API and React Vite frontend concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **API Readiness Check**: [http://localhost:5000/api/v1/ready](http://localhost:5000/api/v1/ready)

---

## 3. Containerized Setup (Option B)

To run all 4 services (PostgreSQL, Redis, Backend, Frontend) completely in Docker:

```bash
docker compose up --build
```

Access the application at [http://localhost:3000](http://localhost:3000).
