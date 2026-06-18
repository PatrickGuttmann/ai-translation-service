import { describe, expect, it, vi, type Mock } from "vitest";

import { loadConfig } from "../config.js";
import { OllamaClientError, type OllamaChatMessage, type OllamaClient } from "../ollama/ollama.client.js";
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

function buildOllamaClient(
  ...outputs: string[]
): OllamaClient & { chat: Mock<(messages: OllamaChatMessage[]) => Promise<string>> } {
  const chat = vi.fn<(messages: OllamaChatMessage[]) => Promise<string>>();

  for (const output of outputs) {
    chat.mockResolvedValueOnce(output);
  }

  chat.mockResolvedValue(outputs.at(-1) ?? '{"fields":{}}');

  return { chat };
}

describe("createTranslateService", () => {
  it("returns a validated translation response for mocked Ollama success", async () => {
    const ollamaClient = buildOllamaClient('{"fields":{"title":"Contact","body":"Write to me..."}}');
    const service = createTranslateService(buildConfig(), ollamaClient);

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
    expect(ollamaClient.chat).toHaveBeenCalledOnce();
  });

  it("rejects oversized input", async () => {
    const ollamaClient = buildOllamaClient('{"fields":{}}');
    const service = createTranslateService(buildConfig({ MAX_INPUT_CHARS: "3" }), ollamaClient);

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "INPUT_TOO_LARGE"
    });
    expect(ollamaClient.chat).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON model output", async () => {
    const ollamaClient = buildOllamaClient("{ nope");
    const service = createTranslateService(buildConfig(), ollamaClient);

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
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
    const chat = vi.fn<(messages: OllamaChatMessage[]) => Promise<string>>().mockRejectedValue(
      new OllamaClientError("OLLAMA_UNAVAILABLE", "Ollama request failed")
    );
    const service = createTranslateService(buildConfig(), {
      chat
    });

    await expect(service.translate(request)).rejects.toBeInstanceOf(OllamaClientError);
    expect(chat).toHaveBeenCalledOnce();
  });

  it("throws typed service errors for invalid model output", async () => {
    const service = createTranslateService(buildConfig(), buildOllamaClient("{ nope"));

    await expect(service.translate(request)).rejects.toBeInstanceOf(TranslateServiceError);
  });

  it("repairs invalid JSON exactly once when repair succeeds", async () => {
    const ollamaClient = buildOllamaClient("{ nope", '{"fields":{"title":"Contact","body":"Write to me..."}}');
    const service = createTranslateService(buildConfig(), ollamaClient);

    const response = await service.translate(request);

    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
    expect(response.fields).toEqual({
      title: "Contact",
      body: "Write to me..."
    });
    expect(response.warnings).toEqual(["model_output_repaired"]);
    expect(response.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("repairs a missing fields wrapper", async () => {
    const ollamaClient = buildOllamaClient('{"title":"Contact"}', '{"fields":{"title":"Contact","body":"Write to me..."}}');
    const service = createTranslateService(buildConfig(), ollamaClient);

    await expect(service.translate(request)).resolves.toMatchObject({
      fields: {
        title: "Contact",
        body: "Write to me..."
      },
      warnings: ["model_output_repaired"]
    });
    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
  });

  it("repairs a missing translated key", async () => {
    const ollamaClient = buildOllamaClient(
      '{"fields":{"title":"Contact"}}',
      '{"fields":{"title":"Contact","body":"Write to me..."}}'
    );
    const service = createTranslateService(buildConfig(), ollamaClient);

    await expect(service.translate(request)).resolves.toMatchObject({
      fields: {
        title: "Contact",
        body: "Write to me..."
      },
      warnings: ["model_output_repaired"]
    });
    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
  });

  it("repairs an extra translated key", async () => {
    const ollamaClient = buildOllamaClient(
      '{"fields":{"title":"Contact","body":"Write to me...","slug":"contact"}}',
      '{"fields":{"title":"Contact","body":"Write to me..."}}'
    );
    const service = createTranslateService(buildConfig(), ollamaClient);

    await expect(service.translate(request)).resolves.toMatchObject({
      fields: {
        title: "Contact",
        body: "Write to me..."
      },
      warnings: ["model_output_repaired"]
    });
    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
  });

  it("repairs a non-string translated value", async () => {
    const ollamaClient = buildOllamaClient(
      '{"fields":{"title":123,"body":"Write to me..."}}',
      '{"fields":{"title":"Contact","body":"Write to me..."}}'
    );
    const service = createTranslateService(buildConfig(), ollamaClient);

    await expect(service.translate(request)).resolves.toMatchObject({
      fields: {
        title: "Contact",
        body: "Write to me..."
      },
      warnings: ["model_output_repaired"]
    });
    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
  });

  it("fails safely when repair output is also invalid JSON", async () => {
    const ollamaClient = buildOllamaClient("{ nope", "{ still-nope");
    const service = createTranslateService(buildConfig(), ollamaClient);

    await expect(service.translate(request)).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID"
    });
    expect(ollamaClient.chat).toHaveBeenCalledTimes(2);
  });

  it("sends repair messages with expected keys and previous invalid output", async () => {
    const ollamaClient = buildOllamaClient("{ nope", '{"fields":{"title":"Contact","body":"Write to me..."}}');
    const service = createTranslateService(buildConfig(), ollamaClient);

    await service.translate(request);

    const repairMessages = ollamaClient.chat.mock.calls[1]?.[0] ?? [];
    const repairText = repairMessages.map((message) => message.content).join("\n");

    expect(repairText).toContain("Expected field keys");
    expect(repairText).toContain('"title"');
    expect(repairText).toContain('"body"');
    expect(repairText).toContain("{ nope");
  });

  it("returns empty warnings on successful first attempt", async () => {
    const service = createTranslateService(
      buildConfig(),
      buildOllamaClient('{"fields":{"title":"Contact","body":"Write to me..."}}')
    );

    await expect(service.translate(request)).resolves.toMatchObject({
      warnings: []
    });
  });
});
