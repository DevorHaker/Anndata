import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { env } from "./config/env";
import { requestIdMiddleware } from "./middleware/requestId";
import { httpLoggerMiddleware } from "./middleware/logger";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { notFoundHandlerMiddleware } from "./middleware/notFoundHandler";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import { v1Router } from "./routes";

export const app = express();

// Security Headers & CORS
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Performance & Body Parsing
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Request Context & Logging Middleware
app.use(requestIdMiddleware);
app.use(httpLoggerMiddleware);
app.use(globalRateLimiter);

// Central API Router (/api/v1)
app.use(env.API_PREFIX, v1Router);

// 404 Handler & Centralized Error Middleware
app.use(notFoundHandlerMiddleware);
app.use(errorHandlerMiddleware);
