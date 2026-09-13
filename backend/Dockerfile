# ===================================================================
# Multi-Stage Production Dockerfile for Backend Service
# ===================================================================

# Stage 1: Build & Compilation
FROM node:20-alpine AS builder

WORKDIR /app

# Install package dependencies
COPY package*.json ./
RUN npm ci

# Copy TypeScript source & compile
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Minimal Runtime Execution
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Security: Run as non-root user
USER node

# Copy package manifests & install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript output from builder
COPY --from=builder /app/dist ./dist

# Health Check Endpoint Verification
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

EXPOSE 5000

CMD ["node", "dist/server.js"]
