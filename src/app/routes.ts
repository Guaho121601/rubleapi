import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";

import type { AppConfig } from "./config";
import { registerPublicApiRoutes } from "../modules/api/public-api.controller";
import { registerWidgetApiRoutes } from "../modules/api/widget-api.controller";
import { CryptoRepository } from "../modules/crypto/crypto.repository";
import { CryptoScheduler } from "../modules/crypto/crypto.scheduler";
import { CryptoService } from "../modules/crypto/crypto.service";
import { RatesRepository } from "../modules/rates/rates.repository";
import { RatesScheduler } from "../modules/rates/rates.scheduler";
import { RatesService } from "../modules/rates/rates.service";
import { CoinGeckoClient } from "../modules/sources/coingecko/coingecko.client";
import { CbrClient } from "../modules/sources/cbr/cbr.client";
import { CbrMapper } from "../modules/sources/cbr/cbr.mapper";
import { CbrParser } from "../modules/sources/cbr/cbr.parser";

type GeneratorPageMode = "rates" | "converter" | "crypto";

export interface AppServices {
  ratesService: RatesService;
  ratesScheduler: RatesScheduler;
  cryptoService: CryptoService;
  cryptoScheduler: CryptoScheduler;
}

function buildCurrencyChoices(options: string[]): string {
  return options
    .map((option) => `              <label class="choice">${option}</label>`)
    .join("\n");
}

const RATE_CURRENCY_CHOICES = buildCurrencyChoices([
  '<input type="checkbox" name="symbols" value="usd" checked /><span class="choice-label">USD</span>',
  '<input type="checkbox" name="symbols" value="eur" checked /><span class="choice-label">EUR</span>',
  '<input type="checkbox" name="symbols" value="cny" checked /><span class="choice-label">CNY</span>',
  '<input type="checkbox" name="symbols" value="aed" /><span class="choice-label">AED</span>',
  '<input type="checkbox" name="symbols" value="try" /><span class="choice-label">TRY</span>',
  '<input type="checkbox" name="symbols" value="thb" /><span class="choice-label">THB</span>',
  '<input type="checkbox" name="symbols" value="vnd" /><span class="choice-label">VND</span>',
]);

const CRYPTO_CURRENCY_CHOICES = buildCurrencyChoices([
  '<input type="checkbox" name="symbols" value="btc" checked /><span class="choice-label">BTC</span>',
  '<input type="checkbox" name="symbols" value="eth" checked /><span class="choice-label">ETH</span>',
  '<input type="checkbox" name="symbols" value="usdt" checked /><span class="choice-label">USDT</span>',
  '<input type="checkbox" name="symbols" value="ton" /><span class="choice-label">TON</span>',
  '<input type="checkbox" name="symbols" value="sol" /><span class="choice-label">SOL</span>',
  '<input type="checkbox" name="symbols" value="bnb" /><span class="choice-label">BNB</span>',
]);

const CRYPTO_EXTRA_OPTIONS = `
          <div class="field">
            <span class="field-label">Что показывать в информере</span>
            <div class="option-stack">
              <label class="option-row">
                <input type="checkbox" name="show-usd" checked />
                <span class="choice-label">Цена в USD</span>
              </label>
              <label class="option-row">
                <input type="checkbox" name="show-rub" checked />
                <span class="choice-label">Цена в RUB</span>
              </label>
              <label class="option-row">
                <input type="checkbox" name="show-change" checked />
                <span class="choice-label">Изменение за 24 часа</span>
              </label>
            </div>
          </div>
`;

const CRYPTO_DISCLAIMER_CARD = `
          <div class="install-card">
            <h2 class="toolbar-title">Важно</h2>
            <p class="preview-copy">
              Курсы криптовалют справочные, могут отличаться на разных площадках и не являются инвестиционной рекомендацией.
            </p>
          </div>
`;

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

  const createGeneratorPage = async (mode: GeneratorPageMode): Promise<string> => {
    const pageConfigByMode: Record<GeneratorPageMode, Record<string, string>> = {
      rates: {
        PAGE_PATH: "/widget",
        PAGE_TITLE: "Информер курсов валют для сайта | RubleAPI",
        META_DESCRIPTION:
          "Бесплатный информер курсов валют для сайта с данными ЦБ РФ. Выберите валюты, настройте оформление и вставьте готовый код на сайт.",
        BREADCRUMB_NAME: "Информер курсов валют",
        EYEBROW: "Информер курсов валют",
        HERO_TITLE: "Информер курсов валют для сайта",
        HERO_COPY:
          "Добавьте на сайт информер курсов валют по данным ЦБ РФ. Выберите валюты, настройте внешний вид, скопируйте код и вставьте готовый блок на сайт.",
        STEP_ONE_LABEL: "1. Выберите валюты",
        SETTINGS_TITLE: "Настройки информера курсов",
        SETTINGS_COPY:
          "Отметьте нужные валюты, настройте оформление и сразу посмотрите, как информер курсов будет выглядеть на сайте.",
        SYMBOL_GROUP_LABEL: "Валюты",
        CURRENCY_HINT:
          "Выберите курсы, которые хотите показывать в готовом блоке на странице сайта.",
        CURRENCY_CHOICES: RATE_CURRENCY_CHOICES,
        ROUND_FIELD_CLASS: "",
        EXTRA_OPTIONS_SECTION: "",
        CODE_TITLE: "Код информера для вставки",
        CODE_STATUS:
          "Скопируйте этот код и вставьте его в HTML-блок на странице сайта.",
        PREVIEW_TITLE: "Предпросмотр информера",
        PREVIEW_COPY:
          "Ниже показано, как блок с курсами валют будет выглядеть с текущими настройками.",
        INSTALL_TITLE: "Как установить информер",
        DISCLAIMER_CARD: "",
        FOOTER_PRODUCT_TITLE: "Информер курсов валют для сайта",
        FOOTER_PRODUCT_COPY:
          "RubleAPI помогает быстро добавить на сайт информер курсов валют по данным ЦБ РФ.",
        NAV_WIDGET_CURRENT: 'aria-current="page"',
        NAV_CONVERTER_CURRENT: "",
        NAV_CRYPTO_CURRENT: "",
        PAGE_MODE: "rates",
      },
      converter: {
        PAGE_PATH: "/converter",
        PAGE_TITLE: "Конвертер валют для сайта | RubleAPI",
        META_DESCRIPTION:
          "Бесплатный конвертер валют для сайта с курсами по данным ЦБ РФ. Настройте внешний вид, скопируйте код и вставьте конвертер на Tilda, WordPress или HTML-сайт.",
        BREADCRUMB_NAME: "Конвертер валют",
        EYEBROW: "Конвертер валют",
        HERO_TITLE: "Конвертер валют для сайта по данным ЦБ РФ",
        HERO_COPY:
          "Посетитель вводит сумму, выбирает валюту и получает пересчёт по данным ЦБ РФ. Настройте внешний вид, посмотрите предпросмотр и вставьте готовый код на сайт.",
        STEP_ONE_LABEL: "1. Выберите валюты",
        SETTINGS_TITLE: "Настройки конвертера",
        SETTINGS_COPY:
          "Выберите валюты для списка, тему и оформление. Генератор сразу показывает, как будет выглядеть конвертер на сайте.",
        SYMBOL_GROUP_LABEL: "Валюты",
        CURRENCY_HINT:
          "Выбранные валюты появятся в выпадающем списке конвертера для посетителя сайта.",
        CURRENCY_CHOICES: RATE_CURRENCY_CHOICES,
        ROUND_FIELD_CLASS: " is-hidden",
        EXTRA_OPTIONS_SECTION: "",
        CODE_TITLE: "Код конвертера для вставки",
        CODE_STATUS:
          "Скопируйте этот код и вставьте его в HTML-блок на странице сайта.",
        PREVIEW_TITLE: "Предпросмотр конвертера",
        PREVIEW_COPY:
          "Ниже показано, как интерактивный конвертер будет выглядеть с текущими настройками.",
        INSTALL_TITLE: "Как установить конвертер",
        DISCLAIMER_CARD: "",
        FOOTER_PRODUCT_TITLE: "Конвертер валют для сайта",
        FOOTER_PRODUCT_COPY:
          "RubleAPI помогает быстро добавить на сайт интерактивный конвертер валют с курсами ЦБ РФ.",
        NAV_WIDGET_CURRENT: "",
        NAV_CONVERTER_CURRENT: 'aria-current="page"',
        NAV_CRYPTO_CURRENT: "",
        PAGE_MODE: "converter",
      },
      crypto: {
        PAGE_PATH: "/crypto",
        PAGE_TITLE: "Информер криптовалют для сайта | RubleAPI",
        META_DESCRIPTION:
          "Бесплатный информер криптовалют для сайта с курсами BTC, ETH, USDT и других криптовалют. Настройте внешний вид, скопируйте код и вставьте информер на Tilda, WordPress или HTML-сайт.",
        BREADCRUMB_NAME: "Информер криптовалют",
        EYEBROW: "Информер криптовалют",
        HERO_TITLE: "Информер криптовалют для сайта",
        HERO_COPY:
          "Добавьте на сайт компактный информер с курсами BTC, ETH, USDT, TON, SOL и BNB. Данные обновляются автоматически, а внешний вид можно настроить под дизайн сайта.",
        STEP_ONE_LABEL: "1. Выберите монеты",
        SETTINGS_TITLE: "Настройки криптоинформера",
        SETTINGS_COPY:
          "Отметьте нужные монеты, настройте оформление и выберите, какие данные показывать в готовом блоке.",
        SYMBOL_GROUP_LABEL: "Криптовалюты",
        CURRENCY_HINT:
          "Выберите монеты, которые должны отображаться в информере на странице сайта.",
        CURRENCY_CHOICES: CRYPTO_CURRENCY_CHOICES,
        ROUND_FIELD_CLASS: " is-hidden",
        EXTRA_OPTIONS_SECTION: CRYPTO_EXTRA_OPTIONS,
        CODE_TITLE: "Код криптоинформера для вставки",
        CODE_STATUS:
          "Скопируйте этот код и вставьте его в HTML-блок на странице сайта.",
        PREVIEW_TITLE: "Предпросмотр криптоинформера",
        PREVIEW_COPY:
          "Ниже показано, как информер криптовалют будет выглядеть с текущими настройками.",
        INSTALL_TITLE: "Как установить криптоинформер",
        DISCLAIMER_CARD: CRYPTO_DISCLAIMER_CARD,
        FOOTER_PRODUCT_TITLE: "Информер криптовалют для сайта",
        FOOTER_PRODUCT_COPY:
          "RubleAPI помогает быстро добавить на сайт информер криптовалют с автоматическим обновлением данных и настройкой внешнего вида без лишней интеграции.",
        NAV_WIDGET_CURRENT: "",
        NAV_CONVERTER_CURRENT: "",
        NAV_CRYPTO_CURRENT: 'aria-current="page"',
        PAGE_MODE: "crypto",
      },
    };

    return readPublicFile("widget-generator.html", pageConfigByMode[mode]);
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
    `    <loc>${createPublicUrl("/crypto")}</loc>`,
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

  const cryptoRepository = new CryptoRepository();
  const coinGeckoClient = new CoinGeckoClient(config.coinGeckoBaseUrl);
  const cryptoService = new CryptoService(cryptoRepository, coinGeckoClient);
  const cryptoScheduler = new CryptoScheduler(
    cryptoService,
    config.cryptoSyncIntervalMinutes,
  );

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

  app.get("/crypto", async (_request, reply) => {
    const generatorSource = await createGeneratorPage("crypto");

    reply.type("text/html; charset=utf-8");
    return generatorSource;
  });

  app.get("/docs", async (_request, reply) => {
    const docsSource = await readPublicFile("docs.html");

    reply.type("text/html; charset=utf-8");
    return docsSource;
  });

  await registerPublicApiRoutes(app, ratesService, cryptoService);
  await registerWidgetApiRoutes(app, ratesService);

  return {
    ratesService,
    ratesScheduler,
    cryptoService,
    cryptoScheduler,
  };
}
