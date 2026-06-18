import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { type HealthResponse } from "./health.routes.js";

describe("GET /health", () => {
  it("returns service health", async () => {
    const app = createApp(loadConfig({ NODE_ENV: "test" }));

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    const body = response.json<HealthResponse>();

    expect(response.statusCode).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("ai-translation-service");
  });
});
