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
  const replaceTemplatePlaceholders = (
    source: string,
    replacements: Record<string, string>,
  ): string =>
    Object.entries(replacements).reduce(
      (result, [key, value]) => result.split(`{{${key}}}`).join(value),
      source,
    );
  const readPublicFile = async (
    fileName: string,
    replacements: Record<string, string> = {},
  ): Promise<string> => {
    const sourcePath = path.resolve(process.cwd(), `src/public/${fileName}`);
    const source = await readFile(sourcePath, "utf8");

    return replaceTemplatePlaceholders(source, {
      PUBLIC_BASE_URL: publicBaseUrl,
      ...replacements,
    });
  };
  const createPublicUrl = (pathname = ""): string => `${publicBaseUrl}${pathname}`;
  const createGeneratorPage = async (
    mode: "rates" | "converter",
  ): Promise<string> => {
    const pageConfig =
      mode === "converter"
        ? {
            PAGE_PATH: "/converter",
            PAGE_TITLE: "Конвертер валют для сайта | RubleAPI",
            META_DESCRIPTION:
              "Бесплатный конвертер валют для сайта с курсами по данным ЦБ РФ. Настройте внешний вид, скопируйте код и вставьте конвертер на Tilda, WordPress или HTML-сайт.",
            BREADCRUMB_NAME: "Конвертер валют",
            EYEBROW: "Конвертер валют для сайта",
            HERO_TITLE: "Конвертер валют для сайта по данным ЦБ РФ",
            HERO_COPY:
              "Посетитель вводит сумму, выбирает валюту и получает пересчёт по данным ЦБ РФ. Настройте внешний вид, посмотрите предпросмотр и вставьте готовый код на сайт.",
            SETTINGS_TITLE: "Настройки конвертера",
            SETTINGS_COPY:
              "Выберите валюты для списка, тему и оформление. Генератор сразу показывает, как будет выглядеть конвертер на сайте.",
            CURRENCY_HINT:
              "Выбранные валюты появятся в выпадающем списке конвертера для посетителя сайта.",
            ROUND_FIELD_CLASS: " is-hidden",
            CODE_TITLE: "Код конвертера для вставки",
            CODE_STATUS:
              "Скопируйте этот код и вставьте его в HTML-блок на странице сайта.",
            PREVIEW_TITLE: "Предпросмотр конвертера",
            PREVIEW_COPY:
              "Ниже показано, как интерактивный конвертер будет выглядеть с текущими настройками.",
            INSTALL_TITLE: "Как установить конвертер",
            FOOTER_PRODUCT_TITLE: "Конвертер валют для сайта",
            FOOTER_PRODUCT_COPY:
              "RubleAPI помогает быстро добавить на сайт интерактивный конвертер валют с курсами ЦБ РФ.",
            NAV_WIDGET_CURRENT: "",
            NAV_CONVERTER_CURRENT: 'aria-current="page"',
            PAGE_MODE: "converter",
          }
        : {
            PAGE_PATH: "/widget",
            PAGE_TITLE: "Виджет курсов валют для сайта | RubleAPI",
            META_DESCRIPTION:
              "Бесплатный виджет курсов валют для сайта с данными ЦБ РФ. Выберите валюты, настройте оформление и вставьте готовый код на сайт.",
            BREADCRUMB_NAME: "Виджет курсов валют",
            EYEBROW: "Виджет курсов валют для сайта",
            HERO_TITLE: "Виджет курсов валют для сайта",
            HERO_COPY:
              "Выберите валюты, настройте внешний вид, скопируйте код и вставьте готовый блок с курсами валют на сайт. Данные берутся по курсам ЦБ РФ.",
            SETTINGS_TITLE: "Настройки виджета курсов",
            SETTINGS_COPY:
              "Отметьте нужные валюты, настройте оформление и сразу посмотрите, как готовый блок с курсами будет выглядеть на сайте.",
            CURRENCY_HINT:
              "Выберите курсы, которые хотите показывать в готовом блоке на странице сайта.",
            ROUND_FIELD_CLASS: "",
            CODE_TITLE: "Код виджета для вставки",
            CODE_STATUS:
              "Скопируйте этот код и вставьте его в HTML-блок на странице сайта.",
            PREVIEW_TITLE: "Предпросмотр виджета курсов",
            PREVIEW_COPY:
              "Ниже показано, как блок с курсами валют будет выглядеть с текущими настройками.",
            INSTALL_TITLE: "Как установить виджет",
            FOOTER_PRODUCT_TITLE: "Виджет курсов валют для сайта",
            FOOTER_PRODUCT_COPY:
              "RubleAPI помогает быстро добавить на сайт готовый блок с курсами валют по данным ЦБ РФ.",
            NAV_WIDGET_CURRENT: 'aria-current="page"',
            NAV_CONVERTER_CURRENT: "",
            PAGE_MODE: "rates",
          };

    return readPublicFile("widget-generator.html", pageConfig);
  };
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
    `    <loc>${createPublicUrl("/converter")}</loc>`,
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
    const generatorSource = await createGeneratorPage("rates");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/widget", async (_request, reply) => {
    const generatorSource = await createGeneratorPage("rates");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/converter", async (_request, reply) => {
    const generatorSource = await createGeneratorPage("converter");

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
