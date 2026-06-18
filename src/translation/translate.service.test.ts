import { describe, expect, it } from "vitest";

import { loadConfig } from "../config.js";
import { OllamaClientError, type OllamaClient } from "../ollama/ollama.client.js";
import { createTranslateService, TranslateServiceError } from "./translate.service.js";
import { type TranslateRequest } from "./translate.types.js";

const request: TranslateRequest = {
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

function buildConfig(overrides: NodeJS.ProcessEnv = {}) {
  return loadConfig({
    NODE_ENV: "test",
    OLLAMA_MODEL: "test-model",
    ...overrides
  });
}

function buildOllamaClient(output: string): OllamaClient {
  return {
    async chat() {
      return output;
    }
  };
}

describe("createTranslateService", () => {
  it("returns a validated translation response for mocked Ollama success", async () => {
    const service = createTranslateService(
      buildConfig(),
      buildOllamaClient('{"fields":{"title":"Contact","body":"Write to me..."}}')
    );

    const response = await service.translate(request);

    expect(response).toMatchObject({
      model: "test-model",
      targetLocale: "en",
      fields: {
        title: "Contact",
        body: "Write to me..."
      },
      warnings: []
    });
    expect(response.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("rejects oversized input", async () => {
    const service = createTranslateService(buildConfig({ MAX_INPUT_CHARS: "3" }), buildOllamaClient('{"fields":{}}'));

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "INPUT_TOO_LARGE"
    });
  });

  it("rejects invalid JSON model output", async () => {
    const service = createTranslateService(buildConfig(), buildOllamaClient("{ nope"));

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
  });

  it("rejects missing fields wrapper", async () => {
    const service = createTranslateService(buildConfig(), buildOllamaClient('{"title":"Contact"}'));

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
  });

  it("rejects missing translated key", async () => {
    const service = createTranslateService(buildConfig(), buildOllamaClient('{"fields":{"title":"Contact"}}'));

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
  });

  it("rejects extra translated key", async () => {
    const service = createTranslateService(
      buildConfig(),
      buildOllamaClient('{"fields":{"title":"Contact","body":"Write to me...","slug":"contact"}}')
    );

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
  });

  it("rejects non-string translated value", async () => {
    const service = createTranslateService(buildConfig(), buildOllamaClient('{"fields":{"title":123,"body":"Text"}}'));

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
  });

  it("passes provider errors through for route mapping", async () => {
    const service = createTranslateService(buildConfig(), {
      async chat() {
        throw new OllamaClientError("OLLAMA_UNAVAILABLE", "Ollama request failed");
      }
    });

    await expect(service.translate(request)).rejects.toBeInstanceOf(OllamaClientError);
  });

  it("throws typed service errors for invalid model output", async () => {
    const service = createTranslateService(buildConfig(), buildOllamaClient("{ nope"));

    await expect(service.translate(request)).rejects.toBeInstanceOf(TranslateServiceError);
  });
});
