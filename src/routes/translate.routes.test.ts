import { describe, expect, it, vi } from "vitest";

import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { type ErrorResponse } from "../errors.js";
import { OllamaClientError } from "../ollama/ollama.client.js";
import { type HealthResponse } from "./health.routes.js";
import { TranslateServiceError, type TranslateService } from "../translation/translate.service.js";
import { type TranslateResponse } from "../translation/translate.types.js";

const apiKey = "TEST_SECRET";
const validPayload = {
  sourceLocale: "de",
  targetLocale: "en",
  contentType: "managed-page-section",
  fields: {
    title: "Kontakt",
    body: "Schreib mir..."
  },
  tone: "personal-technical",
  glossary: {
    Devlog: "Devlog"
  }
};

function buildTestApp() {
  return createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }), {
    translateService: buildMockTranslateService()
  });
}

function buildMockTranslateService(overrides: Partial<TranslateService> = {}): TranslateService {
  return {
    translate:
      overrides.translate ??
      vi.fn(async (request): Promise<TranslateResponse> => {
        return {
          model: "test-model",
          targetLocale: request.targetLocale,
          fields: {
            title: "Contact",
            body: "Write to me..."
          },
          warnings: [],
          durationMs: 12
        };
      })
  };
}

describe("POST /translate", () => {
  it("returns translated fields for authenticated valid requests", async () => {
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
    expect(response.json<TranslateResponse>()).toEqual({
      model: "test-model",
      targetLocale: "en",
      fields: {
        title: "Contact",
        body: "Write to me..."
      },
      warnings: [],
      durationMs: 12
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

  it("returns a structured validation error for authenticated invalid payloads", async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      payload: {
        sourceLocale: "de",
        targetLocale: "en",
        contentType: "managed-page-section",
        fields: {}
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data"
      }
    });
  });

  it("returns a structured input-too-large error for oversized authenticated payloads", async () => {
    const app = createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }), {
      translateService: buildMockTranslateService({
        async translate() {
          throw new TranslateServiceError("INPUT_TOO_LARGE", "Too large");
        }
      })
    });

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      payload: validPayload
    });

    expect(response.statusCode).toBe(413);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "INPUT_TOO_LARGE",
        message: "Input too large"
      }
    });
  });

  it("returns 401 before payload validation for unauthenticated requests", async () => {
    const translateService = buildMockTranslateService();
    const app = createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }), { translateService });

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      payload: {
        sourceLocale: "fr",
        fields: {}
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      }
    });
    expect(translateService.translate).not.toHaveBeenCalled();
  });

  it("returns a structured provider error for mocked provider failure", async () => {
    const app = createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }), {
      translateService: buildMockTranslateService({
        async translate() {
          throw new OllamaClientError("OLLAMA_UNAVAILABLE", "Ollama unavailable");
        }
      })
    });

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      payload: validPayload
    });

    expect(response.statusCode).toBe(503);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "OLLAMA_UNAVAILABLE",
        message: "Ollama unavailable"
      }
    });
  });

  it("returns MODEL_OUTPUT_INVALID for mocked invalid model output", async () => {
    const app = createApp(loadConfig({ NODE_ENV: "test", API_KEY: apiKey }), {
      translateService: buildMockTranslateService({
        async translate() {
          throw new TranslateServiceError("MODEL_OUTPUT_INVALID", "Invalid model output");
        }
      })
    });

    const response = await app.inject({
      method: "POST",
      url: "/translate",
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      payload: validPayload
    });

    expect(response.statusCode).toBe(502);
    expect(response.json<ErrorResponse>()).toEqual({
      error: {
        code: "MODEL_OUTPUT_INVALID",
        message: "Model output invalid"
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
