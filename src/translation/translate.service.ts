import { type AppConfig } from "../config.js";
import { type ErrorCode } from "../errors.js";
import { type OllamaClient } from "../ollama/ollama.client.js";
import { buildTranslationMessages } from "../prompts/prompt-builder.js";
import { translateResponseSchema } from "./translate.schema.js";
import { type TranslateRequest, type TranslateResponse } from "./translate.types.js";
import { ModelOutputError, parseModelOutput } from "./model-output.js";
import { validateInputLength, validateTranslatedFieldKeys } from "./translate.validation.js";

export class TranslateServiceError extends Error {
  readonly code: Extract<ErrorCode, "INPUT_TOO_LARGE" | "MODEL_OUTPUT_INVALID">;

  constructor(code: Extract<ErrorCode, "INPUT_TOO_LARGE" | "MODEL_OUTPUT_INVALID">, message: string) {
    super(message);
    this.name = "TranslateServiceError";
    this.code = code;
  }
}

export type TranslateService = {
  translate(request: TranslateRequest): Promise<TranslateResponse>;
};

export function createTranslateService(config: AppConfig, ollamaClient: OllamaClient): TranslateService {
  return {
    async translate(request: TranslateRequest): Promise<TranslateResponse> {
      const startedAt = performance.now();
      const inputLength = validateInputLength(request, config.maxInputChars);

      if (!inputLength.ok) {
        throw new TranslateServiceError("INPUT_TOO_LARGE", "Translation input exceeds MAX_INPUT_CHARS");
      }

      const messages = buildTranslationMessages(request);
      const rawModelOutput = await ollamaClient.chat(messages);
      let translatedFields: Record<string, string>;

      try {
        translatedFields = parseModelOutput(rawModelOutput);
      } catch (error) {
        if (error instanceof ModelOutputError) {
          throw new TranslateServiceError("MODEL_OUTPUT_INVALID", error.message);
        }

        throw error;
      }

      const fieldValidation = validateTranslatedFieldKeys(request.fields, translatedFields);

      if (!fieldValidation.ok) {
        throw new TranslateServiceError("MODEL_OUTPUT_INVALID", "Translated field keys do not match request fields");
      }

      const response = {
        model: config.ollamaModel,
        targetLocale: request.targetLocale,
        fields: translatedFields,
        warnings: [],
        durationMs: Math.max(0, Math.round(performance.now() - startedAt))
      };
      const parsedResponse = translateResponseSchema.safeParse(response);

      if (!parsedResponse.success) {
        throw new TranslateServiceError("MODEL_OUTPUT_INVALID", "Translation response failed validation");
      }

      return parsedResponse.data;
    }
  };
}
