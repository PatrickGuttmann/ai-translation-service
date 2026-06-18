import { type AppConfig } from "../config.js";
import { type ErrorCode } from "../errors.js";
import { ollamaChatResponseSchema } from "./ollama.schema.js";

export type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OllamaClient = {
  chat(messages: OllamaChatMessage[]): Promise<string>;
};

export type OllamaClientOptions = {
  fetchFn?: typeof fetch;
};

export class OllamaClientError extends Error {
  readonly code: Extract<ErrorCode, "OLLAMA_UNAVAILABLE" | "OLLAMA_TIMEOUT" | "OLLAMA_INVALID_RESPONSE">;
  readonly statusCode?: number;

  constructor(
    code: Extract<ErrorCode, "OLLAMA_UNAVAILABLE" | "OLLAMA_TIMEOUT" | "OLLAMA_INVALID_RESPONSE">,
    message: string,
    statusCode?: number
  ) {
    super(message);
    this.name = "OllamaClientError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function createOllamaClient(config: AppConfig, options: OllamaClientOptions = {}): OllamaClient {
  const fetchFn = options.fetchFn ?? fetch;
  const apiUrl = new URL("/api/chat", config.ollamaBaseUrl);

  return {
    async chat(messages: OllamaChatMessage[]): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

      try {
        const response = await fetchFn(apiUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: config.ollamaModel,
            messages,
            stream: false,
            options: {
              temperature: config.ollamaTemperature,
              top_p: config.ollamaTopP,
              repeat_penalty: config.ollamaRepeatPenalty
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new OllamaClientError("OLLAMA_UNAVAILABLE", "Ollama returned an unsuccessful response", response.status);
        }

        const payload: unknown = await response.json();
        const parsed = ollamaChatResponseSchema.safeParse(payload);

        if (!parsed.success) {
          throw new OllamaClientError("OLLAMA_INVALID_RESPONSE", "Ollama response did not match expected shape");
        }

        return parsed.data.message.content;
      } catch (error) {
        if (error instanceof OllamaClientError) {
          throw error;
        }

        if (isAbortError(error)) {
          throw new OllamaClientError("OLLAMA_TIMEOUT", "Ollama request timed out");
        }

        throw new OllamaClientError("OLLAMA_UNAVAILABLE", "Ollama request failed");
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
