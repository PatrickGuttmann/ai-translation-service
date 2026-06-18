import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { type ErrorResponse } from "../errors.js";
import { type HealthResponse } from "./health.routes.js";
import { type PlaceholderTranslateResponse } from "./translate.routes.js";

const apiKey = "TEST_SECRET";

function buildTestApp() {
  return createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }));
}

describe("POST /translate", () => {
  it("returns the placeholder response for authenticated requests", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: `Bearer ${apiKey}`
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<PlaceholderTranslateResponse>()).toEqual({
      status: "not_implemented"
    });
  });

  it("uses the structured error shape for unauthorized requests", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/translate"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      }
    });
  });

  it("keeps the health route available without an API key", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<HealthResponse>()).toEqual({
      status: "ok",
      service: "ai-translation-service"
    });
  });

  it("uses a safe structured error shape for unexpected errors", async () => {
    const app = buildTestApp();

    app.get("/test-error", async () => {
      throw new Error("sensitive test failure detail");
    });

    const response = await app.inject({
      method: "GET",
      url: "/test-error"
    });

    expect(response.statusCode).toBe(500);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error"
      }
    });
    expect(response.body).not.toContain("sensitive test failure detail");
  });
});
