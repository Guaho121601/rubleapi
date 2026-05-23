import type { FastifyInstance } from "fastify";

import type { RatesService } from "../rates/rates.service";

interface WidgetParams {
  widgetKey: string;
}

export async function registerWidgetApiRoutes(
  app: FastifyInstance,
  ratesService: RatesService,
): Promise<void> {
  app.get<{ Params: WidgetParams }>("/api/widget/:widgetKey", async (request) => {
    return ratesService.getWidgetPayload(request.params.widgetKey);
  });
}
