import { describe, expect, it } from "vitest";

import { ollamaChatResponseSchema } from "./ollama.schema.js";

describe("ollamaChatResponseSchema", () => {
  it("parses a valid Ollama chat response", () => {
    const result = ollamaChatResponseSchema.safeParse({
      model: "qwen2.5:7b",
      created_at: "2026-06-18T09:00:00Z",
      message: {
        role: "assistant",
        content: "{\"fields\":{}}"
      },
      done: true,
      total_duration: 123
    });

    expect(result.success).toBe(true);
  });

  it("fails when message.content is missing", () => {
    const result = ollamaChatResponseSchema.safeParse({
      model: "qwen2.5:7b",
      message: {
        role: "assistant"
      },
      done: true
    });

    expect(result.success).toBe(false);
  });
});
