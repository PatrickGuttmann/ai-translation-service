import Fastify, { type FastifyInstance } from "fastify";

import { type AppConfig } from "./config.js";
import { internalErrorResponse } from "./errors.js";
import { createOllamaClient } from "./ollama/ollama.client.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerTranslateRoutes } from "./routes/translate.routes.js";
import { createTranslateService, type TranslateService } from "./translation/translate.service.js";

export type CreateAppOptions = {
  translateService?: TranslateService;
};

export function createApp(config: AppConfig, options: CreateAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger:
      config.nodeEnv === "test"
        ? false
        : {
            level: config.logLevel,
            redact: ["req.headers.authorization"]
          }
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Unhandled request error");

    void reply.status(500).send(internalErrorResponse);
  });

  void app.register(registerHealthRoutes);
  registerTranslateRoutes(app, config, options.translateService ?? createTranslateService(config, createOllamaClient(config)));

  return app;
}
