import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { type ErrorResponse } from "../errors.js";

const apiKey = "TEST_SECRET";

function buildTestApp() {
  return createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }));
}

describe("API key middleware", () => {
  it("rejects missing Authorization header", async () => {
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

  it("rejects malformed Authorization header", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: "Token TEST_SECRET"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<ErrorResponse>().error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an invalid Bearer token", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: "Bearer WRONG_SECRET"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<ErrorResponse>().error.code).toBe("UNAUTHORIZED");
  });

  it("accepts the configured Bearer token", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: `Bearer ${apiKey}`
      }
    });

    expect(response.statusCode).toBe(200);
  });
});
