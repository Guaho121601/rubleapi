import type { FastifyInstance } from "fastify";

import type { CryptoService } from "../crypto/crypto.service";
import type { RatesService } from "../rates/rates.service";
import type { RateSnapshot } from "../rates/rates.types";

interface LatestRatesQuery {
  symbols?: string;
}

interface DateParams {
  date: string;
}

const API_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeSymbolsQuery(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const symbols = value
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  return symbols.length ? symbols : undefined;
}

function serializeSnapshot(snapshot: RateSnapshot) {
  return {
    source: snapshot.source,
    date: snapshot.date,
    fetchedAt: snapshot.updatedAt,
    base: "RUB",
    rates: snapshot.rates,
  };
}

function serializeCryptoSnapshot(snapshot: NonNullable<Awaited<ReturnType<CryptoService["findLatestCrypto"]>>>) {
  return {
    source: snapshot.source,
    updatedAt: snapshot.updatedAt,
    assets: snapshot.assets,
  };
}

export async function registerPublicApiRoutes(
  app: FastifyInstance,
  ratesService: RatesService,
  cryptoService: CryptoService,
): Promise<void> {
  app.get<{ Querystring: LatestRatesQuery }>("/api/rates/latest", async (request, reply) => {
    const symbols = normalizeSymbolsQuery(request.query.symbols);

    const snapshot = await ratesService.findLatestRates({
      symbols,
    });

    if (!snapshot) {
      reply.code(404);
      return {
        error: "Rates snapshot not found",
      };
    }

    return serializeSnapshot(snapshot);
  });

  app.get<{ Params: DateParams }>("/api/rates/date/:date", async (request, reply) => {
    if (!API_DATE_PATTERN.test(request.params.date)) {
      reply.code(400);
      return {
        error: "Invalid date format. Expected YYYY-MM-DD",
      };
    }

    const snapshot = await ratesService.getRatesByDate(request.params.date);

    if (!snapshot) {
      reply.code(404);
      return {
        error: "Rates snapshot not found",
        date: request.params.date,
      };
    }

    return serializeSnapshot(snapshot);
  });

  app.get<{ Querystring: LatestRatesQuery }>("/api/crypto/latest", async (request, reply) => {
    const symbols = normalizeSymbolsQuery(request.query.symbols);

    const snapshot = await cryptoService.findLatestCrypto({
      symbols,
    });

    if (!snapshot) {
      reply.code(404);
      return {
        error: "Crypto snapshot not found",
      };
    }

    return serializeCryptoSnapshot(snapshot);
  });
}
