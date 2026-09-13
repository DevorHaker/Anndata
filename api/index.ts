/**
 * Vercel Serverless Function Entry Point
 *
 * This file adapts the existing Express app for Vercel's serverless runtime.
 * The entire backend runs as a single serverless function — no code rewrite needed.
 *
 * Vercel routes all /api/* requests here via vercel.json.
 *
 * NOTE: WebSocket connections are not supported in serverless mode.
 *       Real-time queue/ETA events degrade gracefully to polling on Vercel.
 *       For persistent WebSocket support, deploy the backend separately
 *       (e.g., Railway, Render, Fly.io) and set VITE_API_BASE_URL.
 */

// Initialize app — this imports the fully configured Express app with all routes,
// middleware, RBAC, rate limiting, Helmet security headers, etc.
import { app } from "../backend/src/app";

// Export the Express app as the default Vercel serverless handler.
// @vercel/node wraps it automatically into a serverless function.
export default app;
