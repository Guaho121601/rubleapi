import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";

import type { AppConfig } from "./config";
import { registerPublicApiRoutes } from "../modules/api/public-api.controller";
import { registerWidgetApiRoutes } from "../modules/api/widget-api.controller";
import { CbrClient } from "../modules/sources/cbr/cbr.client";
import { CbrMapper } from "../modules/sources/cbr/cbr.mapper";
import { CbrParser } from "../modules/sources/cbr/cbr.parser";
import { RatesRepository } from "../modules/rates/rates.repository";
import { RatesScheduler } from "../modules/rates/rates.scheduler";
import { RatesService } from "../modules/rates/rates.service";

export interface AppServices {
  ratesService: RatesService;
  ratesScheduler: RatesScheduler;
}

export async function registerRoutes(
  app: FastifyInstance,
  config: AppConfig,
): Promise<AppServices> {
  const ratesRepository = new RatesRepository();
  const cbrClient = new CbrClient();
  const cbrParser = new CbrParser();
  const cbrMapper = new CbrMapper();
  const ratesService = new RatesService(ratesRepository, cbrClient, cbrParser, cbrMapper);
  const ratesScheduler = new RatesScheduler(ratesService, config.ratesSyncIntervalHours);

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "rubleapi",
    };
  });

  app.get("/", async (_request, reply) => {
    const indexPath = path.resolve(process.cwd(), "src/public/index.html");
    const indexSource = await readFile(indexPath, "utf8");

    reply.type("text/html; charset=utf-8");
    return indexSource;
  });

  app.get("/widget.js", async (_request, reply) => {
    const widgetPath = path.resolve(process.cwd(), "src/public/widget.js");
    const widgetSource = await readFile(widgetPath, "utf8");

    reply.type("application/javascript; charset=utf-8");
    return widgetSource;
  });

  app.get("/widget-generator", async (_request, reply) => {
    const generatorPath = path.resolve(process.cwd(), "src/public/widget-generator.html");
    const generatorSource = await readFile(generatorPath, "utf8");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/widget", async (_request, reply) => {
    const generatorPath = path.resolve(process.cwd(), "src/public/widget-generator.html");
    const generatorSource = await readFile(generatorPath, "utf8");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/docs", async (_request, reply) => {
    const docsPath = path.resolve(process.cwd(), "src/public/docs.html");
    const docsSource = await readFile(docsPath, "utf8");

    reply.type("text/html; charset=utf-8");
    return docsSource;
  });

  await registerPublicApiRoutes(app, ratesService);
  await registerWidgetApiRoutes(app, ratesService);

  return {
    ratesService,
    ratesScheduler,
  };
}
