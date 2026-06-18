import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const host = "0.0.0.0";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = createApp(config);

  try {
    await app.listen({ host, port: config.port });
    app.log.info(
      {
        host,
        port: config.port,
        nodeEnv: config.nodeEnv,
        ollamaModel: config.ollamaModel
      },
      "ai-translation-service started"
    );
  } catch (error) {
    app.log.error({ err: error }, "Failed to start ai-translation-service");
    process.exitCode = 1;
  }
}

void main();
