import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Error Handling Middleware", () => {
  it("should return standard 404 response for unknown routes", async () => {
    const res = await request(app).get("/api/v1/non-existent-endpoint");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("does not exist");
    expect(res.body).toHaveProperty("requestId");
  });

  it("should return standard 501 response for un-implemented business module endpoints", async () => {
    const res = await request(app).get("/api/v1/notifications");

    expect(res.status).toBe(501);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_IMPLEMENTED");
    expect(res.body.error.message).toContain("Multichannel Notification Dispatcher");
  });
});
