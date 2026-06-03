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
  const publicBaseUrl = config.publicBaseUrl;
  const replacePublicBaseUrlPlaceholder = (source: string): string =>
    source.split("{{PUBLIC_BASE_URL}}").join(publicBaseUrl);
  const readPublicFile = async (fileName: string): Promise<string> => {
    const sourcePath = path.resolve(process.cwd(), `src/public/${fileName}`);
    const source = await readFile(sourcePath, "utf8");

    return replacePublicBaseUrlPlaceholder(source);
  };
  const createPublicUrl = (pathname = ""): string => `${publicBaseUrl}${pathname}`;
  const robotsSource = [
    "user-agent: *",
    "allow: /",
    "",
    `sitemap: ${createPublicUrl("/sitemap.xml")}`,
  ].join("\n");
  const sitemapSource = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${createPublicUrl("/")}</loc>`,
    "  </url>",
    "  <url>",
    `    <loc>${createPublicUrl("/widget")}</loc>`,
    "  </url>",
    "  <url>",
    `    <loc>${createPublicUrl("/docs")}</loc>`,
    "  </url>",
    "</urlset>",
  ].join("\n");

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

  app.get("/robots.txt", async (_request, reply) => {
    reply.type("text/plain; charset=utf-8");
    return robotsSource;
  });

  app.get("/sitemap.xml", async (_request, reply) => {
    reply.type("application/xml; charset=utf-8");
    return sitemapSource;
  });

  app.get("/", async (_request, reply) => {
    const indexSource = await readPublicFile("index.html");

    reply.type("text/html; charset=utf-8");
    return indexSource;
  });

  app.get("/favicon.svg", async (_request, reply) => {
    const faviconPath = path.resolve(process.cwd(), "src/public/favicon.svg");
    const faviconSource = await readFile(faviconPath, "utf8");

    reply.type("image/svg+xml; charset=utf-8");
    return faviconSource;
  });

  app.get("/widget.js", async (_request, reply) => {
    const widgetPath = path.resolve(process.cwd(), "src/public/widget.js");
    const widgetSource = await readFile(widgetPath, "utf8");

    reply.type("application/javascript; charset=utf-8");
    return widgetSource;
  });

  app.get("/widget-generator", async (_request, reply) => {
    const generatorSource = await readPublicFile("widget-generator.html");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/widget", async (_request, reply) => {
    const generatorSource = await readPublicFile("widget-generator.html");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/docs", async (_request, reply) => {
    const docsSource = await readPublicFile("docs.html");

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
