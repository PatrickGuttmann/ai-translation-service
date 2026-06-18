import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { type ErrorResponse } from "../errors.js";
import { type TranslateService } from "../translation/translate.service.js";

const apiKey = "TEST_SECRET";
const validPayload = {
  sourceLocale: "de",
  targetLocale: "en",
  contentType: "managed-page-section",
  fields: {
    title: "Kontakt"
  }
};

function buildTestApp() {
  const translateService: TranslateService = {
    async translate(request) {
      return {
        model: "test-model",
        targetLocale: request.targetLocale,
        fields: {
          title: "Contact"
        },
        warnings: [],
        durationMs: 1
      };
    }
  };

  return createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }), { translateService });
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
      },
      payload: validPayload
    });

    expect(response.statusCode).toBe(200);
  });
});
