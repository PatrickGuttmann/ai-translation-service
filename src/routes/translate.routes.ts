import { type FastifyInstance } from "fastify";

import { type AppConfig } from "../config.js";
import { requireApiKey } from "../security/api-key.js";

export type PlaceholderTranslateResponse = {
  status: "not_implemented";
};

export function registerTranslateRoutes(app: FastifyInstance, config: AppConfig): void {
  app.post(
    "/translate",
    {
      preHandler: requireApiKey(config.apiKey)
    },
    async (): Promise<PlaceholderTranslateResponse> => {
      return {
        status: "not_implemented"
      };
    }
  );
}
