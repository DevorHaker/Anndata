# SmartProcure — Testing Guide

SmartProcure employs a multi-tiered automated testing strategy using Vitest, React Testing Library, Supertest, and Playwright.

---

## 1. Running Tests

### Run All Unit & Integration Tests:

```bash
npm run test
```

### Run Backend API Integration Tests:

```bash
npm run test:backend
```

### Run Frontend Component Tests:

```bash
npm run test:frontend
```

### Run Playwright End-to-End Tests:

```bash
npm run test:e2e
```

---

## 2. Test Architecture & Principles

- **Backend Integration Tests**: Located in `backend/tests/`. Use Supertest to make HTTP requests against `app.ts` without starting a network listener.
- **Frontend Component Tests**: Located in `frontend/tests/`. Use Vitest and React Testing Library (`jsdom` environment).
- **E2E Smoke Tests**: Located in `tests/e2e/`. Use Playwright to test full stack flow against running services.
- **Isolation Rule**: Unit & component tests mock external network boundaries. Integration tests operate against dedicated test database instances.
