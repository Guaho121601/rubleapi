import type { FastifyInstance } from "fastify";

import type { RatesService } from "../rates/rates.service";
import type { RateSnapshot } from "../rates/rates.types";

interface LatestRatesQuery {
  symbols?: string;
}

interface DateParams {
  date: string;
}

const API_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function serializeSnapshot(snapshot: RateSnapshot) {
  return {
    source: snapshot.source,
    date: snapshot.date,
    fetchedAt: snapshot.updatedAt,
    base: "RUB",
    rates: snapshot.rates,
  };
}

export async function registerPublicApiRoutes(
  app: FastifyInstance,
  ratesService: RatesService,
): Promise<void> {
  app.get<{ Querystring: LatestRatesQuery }>("/api/rates/latest", async (request, reply) => {
    const symbols = request.query.symbols
      ? request.query.symbols.split(",").map((symbol) => symbol.trim()).filter(Boolean)
      : undefined;

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
}
