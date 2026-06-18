import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4100),
  API_KEY: z.string().min(1, "API_KEY must not be empty").default("DEV_SECRET_CHANGE_ME"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1, "OLLAMA_MODEL must not be empty").default("qwen2.5:7b"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  MAX_INPUT_CHARS: z.coerce.number().int().positive().default(12000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info")
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  apiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  requestTimeoutMs: number;
  maxInputChars: number;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    apiKey: parsed.data.API_KEY,
    ollamaBaseUrl: parsed.data.OLLAMA_BASE_URL,
    ollamaModel: parsed.data.OLLAMA_MODEL,
    requestTimeoutMs: parsed.data.REQUEST_TIMEOUT_MS,
    maxInputChars: parsed.data.MAX_INPUT_CHARS,
    logLevel: parsed.data.LOG_LEVEL
  };
}
