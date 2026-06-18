import { type FastifyInstance } from "fastify";

import { type AppConfig } from "../config.js";
import { validationErrorResponse } from "../errors.js";
import { requireApiKey } from "../security/api-key.js";
import { translateRequestSchema } from "../translation/translate.schema.js";
import { validateInputLength } from "../translation/translate.validation.js";

export type PlaceholderTranslateResponse = {
  status: "not_implemented";
};

export function registerTranslateRoutes(app: FastifyInstance, config: AppConfig): void {
  app.post(
    "/translate",
    {
      preHandler: requireApiKey(config.apiKey)
    },
    async (request, reply): Promise<PlaceholderTranslateResponse | void> => {
      const parsedRequest = translateRequestSchema.safeParse(request.body);

      if (!parsedRequest.success) {
        await reply.status(400).send(validationErrorResponse);
        return;
      }

      const inputLength = validateInputLength(parsedRequest.data, config.maxInputChars);

      if (!inputLength.ok) {
        await reply.status(413).send(inputLength.error);
        return;
      }

      return {
        status: "not_implemented"
      };
    }
  );
}
