import { describe, expect, it, vi } from "vitest";

import { loadConfig } from "../config.js";
import { createOllamaClient, OllamaClientError, type OllamaChatMessage } from "./ollama.client.js";

const messages: OllamaChatMessage[] = [
  {
    role: "system",
    content: "Translate JSON only."
  },
  {
    role: "user",
    content: "{\"fields\":{\"title\":\"Kontakt\"}}"
  }
];

function buildConfig() {
  return loadConfig({
    NODE_ENV: "test",
    OLLAMA_BASE_URL: "http://ollama.test:11434",
    OLLAMA_MODEL: "test-model",
    REQUEST_TIMEOUT_MS: "10"
  });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("createOllamaClient", () => {
  it("returns assistant content from a successful mocked call", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        model: "test-model",
        message: {
          role: "assistant",
          content: "{\"fields\":{\"title\":\"Contact\"}}"
        },
        done: true
      })
    );
    const client = createOllamaClient(buildConfig(), { fetchFn });

    await expect(client.chat(messages)).resolves.toBe("{\"fields\":{\"title\":\"Contact\"}}");
  });

  it("posts to /api/chat with configured model and stream false", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        model: "test-model",
        message: {
          role: "assistant",
          content: "ok"
        },
        done: true
      })
    );
    const client = createOllamaClient(buildConfig(), { fetchFn });

    await client.chat(messages);

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://ollama.test:11434/api/chat");
    expect(init?.method).toBe("POST");

    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    expect(body).toMatchObject({
      model: "test-model",
      messages,
      stream: false
    });
  });

  it("handles timeout as OLLAMA_TIMEOUT", async () => {
    vi.useFakeTimers();

    const fetchFn = vi.fn<typeof fetch>(
      (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Request aborted", "AbortError"));
          });
        })
    );
    const client = createOllamaClient(buildConfig(), { fetchFn });
    const request = client.chat(messages);
    const assertion = expect(request).rejects.toMatchObject({
      code: "OLLAMA_TIMEOUT"
    });

    await vi.advanceTimersByTimeAsync(10);
    await assertion;

    vi.useRealTimers();
  });

  it("handles connection failure as OLLAMA_UNAVAILABLE", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    const client = createOllamaClient(buildConfig(), { fetchFn });

    await expect(client.chat(messages)).rejects.toMatchObject({
      code: "OLLAMA_UNAVAILABLE"
    });
  });

  it("handles invalid provider response safely", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        model: "test-model",
        message: {
          role: "assistant"
        },
        done: true
      })
    );
    const client = createOllamaClient(buildConfig(), { fetchFn });

    await expect(client.chat(messages)).rejects.toMatchObject({
      code: "OLLAMA_INVALID_RESPONSE"
    });
  });

  it("handles non-2xx provider response safely", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: "unavailable" }, 503));
    const client = createOllamaClient(buildConfig(), { fetchFn });

    await expect(client.chat(messages)).rejects.toMatchObject({
      code: "OLLAMA_UNAVAILABLE",
      statusCode: 503
    });
  });

  it("throws typed Ollama client errors", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    const client = createOllamaClient(buildConfig(), { fetchFn });

    await expect(client.chat(messages)).rejects.toBeInstanceOf(OllamaClientError);
  });
});
