# Vercel Deployment Guide — SmartProcure

SmartProcure is pre-configured for seamless deployment to **Vercel** as a full-stack application:
- **Frontend**: React + Vite SPA built to `frontend/dist` and served with single-page application routing.
- **Backend REST API**: Express.js REST API bundled as a Vercel Serverless Function at `api/index.ts`.

---

## ⚡ Quick Deployment Methods

### Method 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI globally or run with `npx`:
   ```bash
   npm i -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project root:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

---

### Method 2: Deploy via Vercel Web Dashboard (GitHub / GitLab / Bitbucket)

1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Add New Project**.
3. Import your **SmartProcure** repository.
4. **Important**: Verify the **Root Directory** setting:
   - **Full-Stack Deployment (Recommended)**:
     - Ensure **Root Directory** is set to `./` (the repository root, **NOT** `frontend`). If Vercel auto-detected `frontend`, click **Edit** and set it to `./`.
     - Leave **Build and Output Settings** toggled **OFF** (Vercel will automatically read `vercel.json`).
   - **Frontend-Only Deployment**:
     - If you only want to host the frontend on Vercel and run your backend on Render/Railway, set **Root Directory** to `frontend`.
     - Set **Build Command** to `npm run build` (do **NOT** use `npm --prefix frontend`).
     - Set **Output Directory** to `dist`.
5. Configure Environment Variables (see section below).
6. Click **Deploy**.

---

## 🔑 Required Environment Variables on Vercel

In your Vercel Project Settings under **Environment Variables**, configure the following:

| Environment Variable | Required | Description & Example |
| -------------------- | -------- | --------------------- |
| `DATABASE_URL` | **Yes** | Hosted PostgreSQL connection string (e.g. Neon DB, Supabase, Render, Aiven)<br>`postgresql://user:pass@ep-cool-site.us-east-2.aws.neon.tech/smart_procure?sslmode=require` |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT auth tokens (32+ chars)<br>`e.g. 5d9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b` |
| `REDIS_URL` | Optional | Hosted Redis connection string (e.g. Upstash Redis, Redis Cloud)<br>`rediss://default:pass@redis-node.upstash.io:6379`<br>*(Note: If omitted, app operates smoothly in degraded mode for cached features)* |
| `NODE_ENV` | Optional | Set to `production` (Vercel automatically sets this) |
| `CORS_ORIGIN` | Optional | Set to `*` or your custom domain (Vercel handles CORS via headers) |

---

## 🗄️ Database Setup for Vercel Deployment

1. **Provision a Free PostgreSQL Database**:
   - [Neon.tech](https://neon.tech) (Recommended — serverless Postgres, instant SSL pool)
   - [Supabase](https://supabase.com)
   - [Render PostgreSQL](https://render.com)

2. **Run Migrations and Seeds on Hosted Database**:
   Set `DATABASE_URL` in your local `.env` to your hosted PostgreSQL database URL, then run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

---

## 🧪 Local Testing with Vercel CLI

Test the Vercel serverless functions locally before pushing to production:

```bash
npx vercel dev
```

This starts the Vercel development server on `http://localhost:3000` with serverless routing active.

---

## 🔍 Architecture & Route Handling on Vercel

- Requests to `/api/*` are routed to `api/index.ts` (Vercel Serverless Function) via `vercel.json` rewrites.
- Frontend static assets (`/assets/*`) are served with immutable caching headers.
- All non-API SPA routes (`/`, `/login`, `/dashboard`, etc.) rewrite to `frontend/dist/index.html`.

---

## 🛠️ Troubleshooting

### Error: `ENOENT: no such file or directory, open '/vercel/path0/frontend/frontend/package.json'`

- **Why it happened**: In Vercel Project Settings, **Root Directory** was set to `frontend` while the **Build Command** was set to `npm --prefix frontend run build`. Because Vercel was already inside `frontend/`, npm tried to find a subfolder named `frontend/frontend`.
- **How to fix**:
  1. Go to your **Vercel Dashboard** -> select your project -> **Settings** -> **General**.
  2. Under **Root Directory**, click **Edit** and change it to `./` (the repository root).
  3. Under **Build & Development Settings**, turn **OFF** all overrides so it uses `vercel.json` defaults.
  4. Go to the **Deployments** tab, click the three dots on the latest deployment, and click **Redeploy**.
