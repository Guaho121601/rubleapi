import type { FastifyInstance } from "fastify";

import type { RatesService } from "../rates/rates.service";

interface LatestRatesQuery {
  base?: string;
  symbols?: string;
}

interface DateParams {
  date: string;
}

export async function registerPublicApiRoutes(
  app: FastifyInstance,
  ratesService: RatesService,
): Promise<void> {
  app.get<{ Querystring: LatestRatesQuery }>("/api/rates/latest", async (request) => {
    const symbols = request.query.symbols
      ? request.query.symbols.split(",").map((symbol) => symbol.trim()).filter(Boolean)
      : undefined;

    return ratesService.getLatestRates({
      base: request.query.base,
      symbols,
    });
  });

  app.get<{ Params: DateParams }>("/api/rates/date/:date", async (request, reply) => {
    const snapshot = await ratesService.getRatesByDate(request.params.date);

    if (!snapshot) {
      reply.code(200);
      return {
        base: "RUB",
        date: request.params.date,
        source: "stub",
        updatedAt: new Date().toISOString(),
        rates: [
          { code: "USD", nominal: 1, value: 89.5 },
          { code: "EUR", nominal: 1, value: 97.2 },
          { code: "CNY", nominal: 1, value: 12.4 },
        ],
      };
    }

    return snapshot;
  });
}
