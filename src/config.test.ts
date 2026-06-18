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
      requestTimeoutMs: 60000,
      maxInputChars: 12000,
      logLevel: "info"
    });
  });

  it("fails fast for invalid values", () => {
    expect(() => loadConfig({ PORT: "not-a-port" })).toThrow(
      "Invalid environment configuration"
    );
  });
});
