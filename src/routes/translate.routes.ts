import { type FastifyInstance } from "fastify";

import { type AppConfig } from "../config.js";
import {
  inputTooLargeErrorResponse,
  internalErrorResponse,
  modelOutputInvalidErrorResponse,
  ollamaInvalidResponseErrorResponse,
  ollamaTimeoutErrorResponse,
  ollamaUnavailableErrorResponse,
  validationErrorResponse
} from "../errors.js";
import { OllamaClientError } from "../ollama/ollama.client.js";
import { requireApiKey } from "../security/api-key.js";
import { translateRequestSchema } from "../translation/translate.schema.js";
import { TranslateServiceError, type TranslateService } from "../translation/translate.service.js";
import { type TranslateResponse } from "../translation/translate.types.js";

export function registerTranslateRoutes(app: FastifyInstance, config: AppConfig, translateService: TranslateService): void {
  app.post(
    "/translate",
    {
      preHandler: requireApiKey(config.apiKey)
    },
    async (request, reply): Promise<TranslateResponse | void> => {
      const parsedRequest = translateRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        await reply.status(400).send(validationErrorResponse);
        return;
      }

      try {
        return await translateService.translate(parsedRequest.data);
      } catch (error) {
        if (error instanceof TranslateServiceError && error.code === "INPUT_TOO_LARGE") {
          await reply.status(413).send(inputTooLargeErrorResponse);
          return;
        }

        if (error instanceof TranslateServiceError && error.code === "MODEL_OUTPUT_INVALID") {
          await reply.status(502).send(modelOutputInvalidErrorResponse);
          return;
        }

        if (error instanceof OllamaClientError) {
          if (error.code === "OLLAMA_TIMEOUT") {
            await reply.status(504).send(ollamaTimeoutErrorResponse);
            return;
          }

          if (error.code === "OLLAMA_INVALID_RESPONSE") {
            await reply.status(502).send(ollamaInvalidResponseErrorResponse);
            return;
          }

          await reply.status(503).send(ollamaUnavailableErrorResponse);
          return;
        }

        request.log.error({ err: error }, "Translation failed unexpectedly");
        await reply.status(500).send(internalErrorResponse);
      }
    }
  );
}
