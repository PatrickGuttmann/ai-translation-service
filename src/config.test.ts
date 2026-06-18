import { describe, expect, it } from "vitest";

import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("uses safe local defaults", () => {
    const config = loadConfig({});

    expect(config).toMatchObject({
      nodeEnv: "development",
      port: 4100,
      apiKey: "DEV_SECRET_CHANGE_ME",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "qwen2.5:7b",
      ollamaTemperature: 0.1,
      ollamaTopP: 0.8,
      ollamaRepeatPenalty: 1.05,
      requestTimeoutMs: 60000,
      maxInputChars: 12000,
      logLevel: "info"
    });
  });

  it("parses deterministic Ollama option overrides", () => {
    const config = loadConfig({
      OLLAMA_TEMPERATURE: "0.2",
      OLLAMA_TOP_P: "0.7",
      OLLAMA_REPEAT_PENALTY: "1.1"
    });

    expect(config).toMatchObject({
      ollamaTemperature: 0.2,
      ollamaTopP: 0.7,
      ollamaRepeatPenalty: 1.1
    });
  });

  it("fails fast for invalid values", () => {
    expect(() => loadConfig({ PORT: "not-a-port" })).toThrow(
      "Invalid environment configuration"
    );
  });

  it("fails fast for invalid OLLAMA_TEMPERATURE", () => {
    expect(() => loadConfig({ OLLAMA_TEMPERATURE: "3" })).toThrow(
      "Invalid environment configuration"
    );
  });

  it("fails fast for invalid OLLAMA_TOP_P", () => {
    expect(() => loadConfig({ OLLAMA_TOP_P: "1.5" })).toThrow(
      "Invalid environment configuration"
    );
  });

  it("fails fast for invalid OLLAMA_REPEAT_PENALTY", () => {
    expect(() => loadConfig({ OLLAMA_REPEAT_PENALTY: "0.1" })).toThrow(
      "Invalid environment configuration"
    );
  });
});
