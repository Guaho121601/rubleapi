import cors from "@fastify/cors";
import Fastify from "fastify";

import { getConfig } from "./config";
import { registerRoutes } from "./routes";

export async function buildServer() {
  const config = getConfig();
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  const services = await registerRoutes(app, config);
  await services.ratesScheduler.start();

  app.addHook("onClose", async () => {
    services.ratesScheduler.stop();
  });

  return app;
}

async function startServer() {
  const config = getConfig();
  const app = await buildServer();

  await app.listen({
    host: config.host,
    port: config.port,
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
