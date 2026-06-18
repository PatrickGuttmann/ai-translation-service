import { type FastifyInstance } from "fastify";

export type HealthResponse = {
  status: "ok";
  service: "ai-translation-service";
};

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      service: "ai-translation-service"
    };
  });
}
