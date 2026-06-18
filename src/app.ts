import Fastify, { type FastifyInstance } from "fastify";

import { type AppConfig } from "./config.js";
import { registerHealthRoutes } from "./routes/health.routes.js";

export function createApp(config: AppConfig): FastifyInstance {
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

    void reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error"
      }
    });
  });

  void app.register(registerHealthRoutes);

  return app;
}
