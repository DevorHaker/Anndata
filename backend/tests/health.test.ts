import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";

// Mock DB and Redis health checks for deterministic integration testing
vi.mock("../src/database", () => ({
  checkDatabaseHealth: vi
    .fn()
    .mockResolvedValue({ status: "ok", latencyMs: 2 }),
}));

vi.mock("../src/database/redis", () => ({
  checkRedisHealth: vi.fn().mockResolvedValue({ status: "ok", latencyMs: 1 }),
}));

describe("GET /api/v1/health", () => {
  it("should return 200 OK with success format and process uptime", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data).toHaveProperty("timestamp");
    expect(res.body.data).toHaveProperty("uptimeSeconds");
    expect(res.headers).toHaveProperty("x-request-id");
  });
});

describe("GET /api/v1/ready", () => {
  it("should return 200 OK when postgres and redis dependencies are healthy", async () => {
    const res = await request(app).get("/api/v1/ready");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
    expect(res.body.data.dependencies.postgres.status).toBe("ok");
    expect(res.body.data.dependencies.redis.status).toBe("ok");
  });
});
