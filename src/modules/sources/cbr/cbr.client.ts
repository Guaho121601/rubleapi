import type { CbrRawResponse } from "../../rates/rates.types";

export class CbrClient {
  async fetchLatestRates(): Promise<CbrRawResponse> {
    return {
      requestedAt: new Date().toISOString(),
      source: "cbr-stub",
      payload: {
        date: "2026-05-24",
        rates: [
          { charCode: "USD", nominal: 1, value: 89.5 },
          { charCode: "EUR", nominal: 1, value: 97.2 },
          { charCode: "CNY", nominal: 1, value: 12.4 },
        ],
      },
    };
  }
}
